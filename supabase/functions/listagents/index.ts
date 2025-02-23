import { serve } from "https://deno.land/std@0.166.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper function to add CORS headers
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
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    let mainCategory: string | undefined;
    let agentId: string | undefined;
    
    // Handle both GET and POST methods
    if (req.method === "POST") {
      const body = await req.json();
      mainCategory = body.mainCategory;
      agentId = body.agentId; // Add support for filtering by agentId
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      mainCategory = url.searchParams.get("mainCategory") || undefined;
      agentId = url.searchParams.get("agentId") || undefined;
    } else {
      return new Response("Method Not Allowed", { 
        status: 405, 
        headers: corsHeaders() 
      });
    }

    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders()
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Build query
    let query = supabase
      .from("agents")
      .select(`
        agent_id,
        owner_id,
        name,
        personality,
        instructions,
        prohibition,
        agent_profile_image,
        agent_main_category,
        agent_sub_category,
        llm_engine,
        number_of_message_called,
        number_of_users,
        average_rating,
        created_at,
        modified_at
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (mainCategory) {
      query = query.eq("agent_main_category", mainCategory);
    }
    if (agentId) {
      query = query.eq("agent_id", agentId);
    }

    // Execute query
    const { data: agentsData, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders()
      });
    }

    // Add default values for testing if needed
    const processedAgents = agentsData?.map(agent => ({
      ...agent,
      agent_main_category: agent.agent_main_category || "Miscellaneous",
      average_rating: agent.average_rating || (3 + Math.random() * 2).toFixed(1),
      number_of_users: agent.number_of_users || Math.floor(Math.random() * 100),
      number_of_message_called: agent.number_of_message_called || Math.floor(Math.random() * 1000)
    }));

    return new Response(JSON.stringify({
      agents: processedAgents || []
    }), {
      status: 200,
      headers: corsHeaders()
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "An unexpected error occurred"
    }), {
      status: 500,
      headers: corsHeaders()
    });
  }
});