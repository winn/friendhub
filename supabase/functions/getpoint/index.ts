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
  
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders() });
  }
  
  try {
    // Expected payload: { userId: string }
    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid userId in request body" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }
    
    // Initialize Supabase client.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: corsHeaders(),
      });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Query the "users" table for the remaining_points value
    const { data, error } = await supabase
      .from("users")
      .select("remaining_points")
      .eq("id", userId)
      .maybeSingle();
      
    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: "Failed to fetch user points" }), {
        status: 500,
        headers: corsHeaders(),
      });
    }

    // If no user found, check if they exist in auth
    if (!data) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: corsHeaders(),
        });
      }

      // Create user record with default points
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: authUser.user.email,
          remaining_points: 1000 // Default points for new users
        })
        .select("remaining_points")
        .single();

      if (createError) {
        console.error('User creation error:', createError);
        return new Response(JSON.stringify({ error: "Failed to create user record" }), {
          status: 500,
          headers: corsHeaders(),
        });
      }

      // Return the points using the same key as the response expects
      return new Response(JSON.stringify({ remain_points: newUser.remaining_points }), {
        status: 200,
        headers: corsHeaders(),
      });
    }
    
    // Return the points using the same key as the response expects
    return new Response(JSON.stringify({ remain_points: data.remaining_points }), {
      status: 200,
      headers: corsHeaders(),
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
});