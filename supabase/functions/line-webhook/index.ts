import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Helper function: Convert ArrayBuffer to Base64 string.
function base64EncodeFromBuffer(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

// Helper function: Compute HMAC-SHA256 using Web Crypto API.
async function computeHmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return base64EncodeFromBuffer(signature);
}

serve(async (req: Request) => {
  // Extract the agentId from the URL.
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/");
  const agentId = pathParts[pathParts.length - 1];

  if (!agentId) {
    return new Response(
      JSON.stringify({ error: "Agent ID not provided" }),
      { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Read the raw body for signature verification.
  const rawBody = await req.text();

  // Get the X-Line-Signature header.
  const lineSignature = req.headers.get("x-line-signature");
  if (!lineSignature) {
    console.error("Missing X-Line-Signature header");
    return new Response("Unauthorized", { status: 401 });
  }

  // Initialize Supabase client.
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase configuration" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get the agent and its owner
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("owner_id")
    .eq("agent_id", agentId)
    .single();

  if (agentError || !agent) {
    console.error("Error fetching agent:", agentError);
    return new Response(
      JSON.stringify({ error: "Agent not found" }),
      { status: 404, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Deduct points from agent owner
  try {
    const pointsResponse = await fetch(`${supabaseUrl}/functions/v1/points`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        userId: agent.owner_id,
        points: -5,
        reason: "LINE message processing fee"
      })
    });

    if (!pointsResponse.ok) {
      const errorData = await pointsResponse.json();
      console.error("Failed to deduct points:", errorData);
      // If points deduction fails, we should not process the message
      return new Response(
        JSON.stringify({ error: "Insufficient points to process message" }),
        { status: 402, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }

    const pointsData = await pointsResponse.json();
    if (pointsData.error) {
      console.error("Points deduction error:", pointsData.error);
      return new Response(
        JSON.stringify({ error: "Failed to process points deduction" }),
        { status: 402, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }
  } catch (pointsError) {
    console.error("Error deducting points:", pointsError);
    return new Response(
      JSON.stringify({ error: "Failed to process points deduction" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Fetch the LINE channel config for this agent.
  const { data: channelConfig, error: configError } = await supabase
    .from("channel_configs")
    .select("config")
    .eq("agent_id", agentId)
    .eq("channel_type", "LINE")
    .single();

  if (configError || !channelConfig) {
    console.error("No channel config found for agent", agentId);
    return new Response(
      JSON.stringify({ error: "Channel config not found" }),
      { status: 404, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Extract tokens from config.
  const { accessToken, secretToken } = channelConfig.config;
  if (!accessToken || !secretToken) {
    console.error("Missing tokens for agent", agentId);
    return new Response(
      JSON.stringify({ error: "Missing LINE configuration" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Verify the LINE signature using Web Crypto.
  const computedSignature = await computeHmacSha256(secretToken, rawBody);
  if (computedSignature !== lineSignature) {
    console.error("Signature mismatch:", { computedSignature, lineSignature });
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse the raw body into JSON.
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    console.error("Error parsing JSON payload:", e);
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  if (!payload.events || !Array.isArray(payload.events) || payload.events.length === 0) {
    return new Response(
      JSON.stringify({ success: true, message: "No events to process" }),
      { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Process the first event.
  const event = payload.events[0];
  const replyToken = event.replyToken;
  const receivedText = event.message?.text;
  const userId = event.source?.userId;

  if (!replyToken || !receivedText || !userId) {
    console.log("Missing replyToken, message text, or userId.");
    return new Response(
      JSON.stringify({ success: true, message: "No reply required" }),
      { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Try to find an existing conversation
  let conversationId = null;
  const { data: convData, error: convError } = await supabase
    .from("conversations")
    .select("conversation_id")
    .eq("user_id", userId)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!convError && convData && convData.length > 0) {
    conversationId = convData[0].conversation_id;
    console.log("Found existing conversation:", conversationId);
  }

  // Prepare payload for message-bedrock
  const messageBedrockPayload: Record<string, unknown> = {
    userId: userId,
    agentId: agentId,
    message: receivedText,
  };
  if (conversationId) {
    messageBedrockPayload.conversationId = conversationId;
  }

  // Get the AUTH_TOKEN for calling message-bedrock
  const messageBedrockAuthToken = Deno.env.get("AUTH_TOKEN");
  if (!messageBedrockAuthToken) {
    console.error("Missing AUTH_TOKEN for message-bedrock");
    return new Response(
      JSON.stringify({ error: "Missing AUTH_TOKEN for message-bedrock" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Call message-bedrock to get the agent's reply
  let messageBedrockResponseJson;
  try {
    const messageBedrockResponse = await fetch(`${supabaseUrl}/functions/v1/message-bedrock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${messageBedrockAuthToken}`,
      },
      body: JSON.stringify(messageBedrockPayload),
    });
    if (!messageBedrockResponse.ok) {
      const errorText = await messageBedrockResponse.text();
      console.error("Error calling message-bedrock:", messageBedrockResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to call message-bedrock" }),
        { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }
    messageBedrockResponseJson = await messageBedrockResponse.json();
  } catch (e) {
    console.error("Exception calling message-bedrock:", e);
    return new Response(
      JSON.stringify({ error: "Exception calling message-bedrock" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Extract the agent's answer
  const answerText = messageBedrockResponseJson.message;
  if (!answerText) {
    console.error("No answer returned from message-bedrock");
    return new Response(
      JSON.stringify({ error: "No answer returned" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Prepare payload to reply to LINE
  const replyPayload = {
    replyToken,
    messages: [
      {
        type: "text",
        text: answerText,
      },
    ],
  };

  // Reply to LINE
  try {
    const replyResponse = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(replyPayload),
    });
    if (!replyResponse.ok) {
      const errorText = await replyResponse.text();
      console.error("Error replying to LINE:", replyResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send reply to LINE" }),
        { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }
    console.log("Successfully sent reply to LINE");
  } catch (e) {
    console.error("Exception sending reply to LINE:", e);
    return new Response(
      JSON.stringify({ error: "Exception sending reply" }),
      { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // Return a successful response
  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
  );
});