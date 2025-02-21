import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface LineMessage {
  type: string;
  text?: string;
  id: string;
}

interface LineEvent {
  type: string;
  message?: LineMessage;
  replyToken: string;
  source: {
    userId: string;
    type: string;
  };
}

interface WebhookRequest {
  events: LineEvent[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const agentId = new URL(req.url).pathname.split('/').pop();
    if (!agentId) {
      throw new Error('Missing agent ID in webhook URL');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get channel config for the agent
    const { data: config, error: configError } = await supabase
      .from('channel_configs')
      .select('config')
      .eq('agent_id', agentId)
      .eq('channel_type', 'line')
      .single();

    if (configError || !config) {
      throw new Error('Channel configuration not found');
    }

    // Verify LINE signature
    const signature = req.headers.get('x-line-signature');
    if (!signature) {
      throw new Error('Missing LINE signature');
    }

    // Parse webhook body
    const body: WebhookRequest = await req.json();
    
    // Process each event
    for (const event of body.events) {
      if (event.type === 'message' && event.message?.type === 'text') {
        // Create conversation if needed
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: event.source.userId,
            agent_id: agentId,
            channel: 'line'
          })
          .select()
          .single();

        if (convError) {
          console.error('Error creating conversation:', convError);
          continue;
        }

        // Send message to agent
        const response = await fetch(`${supabaseUrl}/functions/v1/message-bedrock`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            userId: event.source.userId,
            agentId,
            message: event.message.text,
            conversationId: conversation.id,
            model: "anthropic.claude-v2",
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        const messageResponse = await response.json();

        // Send response back to LINE
        if (messageResponse.message) {
          const lineResponse = await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.config.accessToken}`
            },
            body: JSON.stringify({
              replyToken: event.replyToken,
              messages: [{
                type: 'text',
                text: messageResponse.message
              }]
            })
          });

          if (!lineResponse.ok) {
            throw new Error('Failed to send LINE response');
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});