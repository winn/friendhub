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
    const { 
      userId, 
      agentId, 
      message, 
      conversationId, 
      model = "anthropic.claude-v2",
      temperature = 0.7,
      max_tokens = 1000 
    } = await req.json();
    
    if (!userId || !agentId || !message) {
      throw new Error("Missing required fields");
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get agent details
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("*")
      .eq("agent_id", agentId)
      .single();

    if (agentError || !agent) {
      throw new Error("Agent not found");
    }

    // Create conversation if needed
    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          user_id: userId,
          agent_id: agentId
        })
        .select()
        .single();

      if (convError) {
        throw new Error("Failed to create conversation");
      }
      activeConversationId = newConversation.id;
    }

    // Store user message
    const { error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeConversationId,
        user_id: userId,
        content: message,
        role: "user"
      });

    if (messageError) {
      throw new Error("Failed to store user message");
    }

    // Prepare system prompt from agent configuration
    const systemPrompt = `You are ${agent.agent_name}, an AI assistant with the following personality: ${agent.personality}

Instructions: ${agent.instructions}

Prohibitions: ${agent.prohibition || "None specified"}

Remember to stay in character and follow all instructions and prohibitions.`;

    // Call Bedrock API (you'll need to implement this part based on your Bedrock setup)
    // This is a placeholder for the actual Bedrock API call
    const response = "I am ${agent.agent_name} and I received your message: " + message;

    // Store assistant response
    const { error: responseError } = await supabase
      .from("messages")
      .insert({
        conversation_id: activeConversationId,
        user_id: userId,
        content: response,
        role: "assistant"
      });

    if (responseError) {
      throw new Error("Failed to store assistant response");
    }

    // Update message count and other stats
    await supabase
      .from("agents")
      .update({ 
        number_of_message_called: agent.number_of_message_called + 1
      })
      .eq("agent_id", agentId);

    return new Response(
      JSON.stringify({
        success: true,
        message: response,
        conversationId: activeConversationId
      }),
      { 
        status: 200,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in message-bedrock function:", error);
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