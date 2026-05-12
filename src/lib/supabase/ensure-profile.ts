import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Ensure a user profile exists in the public.users table
 * This handles cases where the auth trigger might not have fired
 */
export async function ensureUserProfile(
  userId: string,
  email: string,
  metadata?: {
    username?: string;
    display_name?: string;
  }
) {
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  // Check if profile exists
  const { data: existing } = await service
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  // Profile doesn't exist, create it
  const username = metadata?.username || email.split("@")[0] || userId.slice(0, 8);
  const displayName = metadata?.display_name || null;

  const { data, error } = await service.from("users").insert({
    id: userId,
    email,
    username,
    display_name: displayName,
  }).select().single();

  if (error && !error.message.includes("duplicate")) {
    throw new Error(`Failed to create user profile: ${error.message}`);
  }

  return data;
}
