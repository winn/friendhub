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

  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders() });
  }

  try {
    // Get query parameters
    const url = new URL(req.url);
    const mainCategory = url.searchParams.get("mainCategory");
    const subCategory = url.searchParams.get("subCategory");

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
      .select("*")
      .order("created_at", { ascending: false });

    // Apply category filters if provided
    if (mainCategory) {
      query = query.eq("agent_main_category", mainCategory);
    }
    if (subCategory) {
      query = query.eq("agent_sub_category", subCategory);
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

    // Get unique categories and subcategories from the data
    const categories: { [key: string]: Set<string> } = {};
    agentsData?.forEach(agent => {
      if (agent.agent_main_category) {
        if (!categories[agent.agent_main_category]) {
          categories[agent.agent_main_category] = new Set();
        }
        if (agent.agent_sub_category) {
          categories[agent.agent_main_category].add(agent.agent_sub_category);
        }
      }
    });

    // Convert Sets to arrays for JSON serialization
    const categoriesObject: { [key: string]: string[] } = {};
    Object.entries(categories).forEach(([main, subs]) => {
      categoriesObject[main] = Array.from(subs);
    });

    return new Response(JSON.stringify({
      agents: agentsData,
      categories: categoriesObject
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