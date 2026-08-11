import { supabase } from "./supabase";

export async function checkSubmissionAccess() {
  // Kiểm tra người dùng
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      allowed: false,
      message: "Bạn chưa đăng nhập.",
    };
  }

  // Lấy trạng thái hồ sơ
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_submitted")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Lỗi lấy trạng thái hồ sơ:", profileError);

    return {
      allowed: false,
      message: "Không thể kiểm tra trạng thái hồ sơ.",
    };
  }

  // Lấy trạng thái nhận hồ sơ
  const { data: setting, error: settingError } = await supabase
    .from("site_settings")
    .select("submission_open")
    .eq("id", 1)
    .single();

  if (settingError) {
    console.error(
      "Lỗi lấy trạng thái nhận hồ sơ:",
      settingError
    );

    return {
      allowed: false,
      message: "Không thể kiểm tra trạng thái nhận hồ sơ.",
    };
  }

  // Đã nộp hoặc đã đóng nhận hồ sơ
  if (profile?.is_submitted || !setting?.submission_open) {
    return {
      allowed: false,
      message: profile?.is_submitted
        ? "Bạn đã nộp hồ sơ. Không thể chỉnh sửa tiêu chí."
        : "Hệ thống đã đóng nhận hồ sơ. Không thể chỉnh sửa tiêu chí.",
    };
  }

  return {
    allowed: true,
    message: "",
  };
}