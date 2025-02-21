import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function corsHeaders(extraHeaders = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    ...extraHeaders,
  };
}

serve(async (req: Request) => {
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders() });
  }
  
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders() });
  }
  
  try {
    const { agentId, channelType, config } = await req.json();
    
    if (!agentId || !channelType) {
      throw new Error("Missing required fields");
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Generate webhook URL
    const webhookUrl = `${supabaseUrl}/functions/v1/line-webhook/${agentId}`;
    
    if (config) {
      // Upsert channel config
      const { data, error } = await supabase
        .from("channel_configs")
        .upsert({
          agent_id: agentId,
          channel_type: channelType,
          config,
          webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error("Supabase upsert error:", error);
        throw error;
      }
      
      return new Response(
        JSON.stringify({ success: true, data }),
        { 
          status: 200,
          headers: { ...corsHeaders(), "Content-Type": "application/json" }
        }
      );
    } else {
      // Get existing config
      const { data, error } = await supabase
        .from("channel_configs")
        .select("*")
        .eq("agent_id", agentId)
        .eq("channel_type", channelType);

      if (error) {
        console.error("Supabase select error:", error);
        throw error;
      }

      // If no config exists, create a default one
      if (!data || data.length === 0) {
        const { data: newConfig, error: createError } = await supabase
          .from("channel_configs")
          .insert({
            agent_id: agentId,
            channel_type: channelType,
            config: {
              webhook_setting: "enabled",
              otherConfigKey: "value"
            },
            webhook_url: webhookUrl
          })
          .select();

        if (createError) {
          console.error("Supabase insert error:", createError);
          throw createError;
        }

        return new Response(
          JSON.stringify({ success: true, data: newConfig }),
          { 
            status: 200,
            headers: { ...corsHeaders(), "Content-Type": "application/json" }
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { 
          status: 200,
          headers: { ...corsHeaders(), "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error("Error in channel-config function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      }
    );
  }
});