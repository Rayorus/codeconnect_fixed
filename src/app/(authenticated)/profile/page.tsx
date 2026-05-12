import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Ensure user profile exists (in case trigger didn't fire)
  try {
    await ensureUserProfile(user.id, user.email || "", {
      username: user.user_metadata?.username,
      display_name: user.user_metadata?.display_name,
    });
  } catch (err) {
    console.error("Failed to ensure profile:", err);
    // Continue anyway
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <ProfileClient userId={user.id} profile={profile} />
    </div>
  );
}
