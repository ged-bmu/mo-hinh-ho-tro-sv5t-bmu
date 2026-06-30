import { supabase } from "@/lib/supabase";

export async function sendNotification(
  userId: string,
  type: string,
  title: string,
  content: string,
  target_url: string
) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      content,
      target_url,
    });

  if (error) {
    console.error("Notification error:", error);
  }
}