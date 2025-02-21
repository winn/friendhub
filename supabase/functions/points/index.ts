import { serve } from "https://deno.land/std@0.166.0/http/server.ts";
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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders() });
  }
  
  try {
    const { userId, points, reason } = await req.json();
    
    if (!userId || typeof points !== 'number' || !reason) {
      return new Response(JSON.stringify({ error: "Missing or invalid parameters" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }
    
    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // First, get current points using single() to ensure one row
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("remaining_points")
      .eq("id", userId)
      .single();
      
    if (userError) {
      // If user doesn't exist, check auth and create them
      if (userError.code === 'PGRST116') { // PGRST116 is "not found"
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
        
        if (authError || !authUser.user) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: corsHeaders(),
          });
        }

        // Create user with initial points
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            id: userId,
            email: authUser.user.email,
            remaining_points: 1000 + points // Initial points plus the change
          })
          .select()
          .single();

        if (createError) {
          console.error('User creation error:', createError);
          return new Response(JSON.stringify({ error: "Failed to create user" }), {
            status: 500,
            headers: corsHeaders(),
          });
        }

        // Record the points transaction
        await supabase
          .from("points_transactions")
          .insert({
            user_id: userId,
            points,
            reason
          });

        return new Response(JSON.stringify({ 
          success: true,
          remaining_points: newUser.remaining_points,
          remain_points: newUser.remaining_points // For backwards compatibility
        }), {
          status: 200,
          headers: corsHeaders(),
        });
      }

      console.error('Error fetching user:', userError);
      return new Response(JSON.stringify({ error: "Failed to fetch user data" }), {
        status: 500,
        headers: corsHeaders(),
      });
    }

    // Calculate new points total
    const newTotal = (userData.remaining_points || 0) + points;
    
    // Update user's points
    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ remaining_points: newTotal })
      .eq("id", userId)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating points:', updateError);
      return new Response(JSON.stringify({ error: "Failed to update points" }), {
        status: 500,
        headers: corsHeaders(),
      });
    }

    // Record the points transaction
    const { error: transactionError } = await supabase
      .from("points_transactions")
      .insert({
        user_id: userId,
        points,
        reason
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      // Don't fail the request, just log the error
    }

    return new Response(JSON.stringify({ 
      success: true,
      remaining_points: updatedUser.remaining_points,
      remain_points: updatedUser.remaining_points // For backwards compatibility
    }), {
      status: 200,
      headers: corsHeaders(),
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ 
      error: err instanceof Error ? err.message : "Internal server error" 
    }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
});