import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { agentId, channelType } = await req.json();

    if (!agentId || !channelType) {
      throw new Error('Missing required fields');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get channel config
    const { data, error } = await supabase
      .from('channel_configs')
      .select('*')
      .eq('agent_id', agentId)
      .eq('channel_type', channelType)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    // If no config exists, create one with the webhook URL
    if (!data) {
      const webhookUrl = `${supabaseUrl}/functions/v1/line_webhook/${agentId}`;
      const { data: newConfig, error: createError } = await supabase
        .from('channel_configs')
        .insert({
          agent_id: agentId,
          channel_type: channelType,
          config: {},
          webhook_url: webhookUrl
        })
        .select()
        .single();

      if (createError) throw createError;
      return new Response(
        JSON.stringify({ config: newConfig }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ config: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});