import { supabase } from "./supabase";

export async function checkSubmissionAccess(yearId?: number) {
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

  // Kiểm tra năm học
  if (!yearId) {
    return {
      allowed: false,
      message: "Chưa xác định được năm học.",
    };
  }

  // Lấy trạng thái hồ sơ theo năm học
  const { data: yearProfile, error: yearProfileError } = await supabase
    .from("student_year_profiles")
    .select("is_submitted")
    .eq("user_id", user.id)
    .eq("academic_year_id", yearId)
    .maybeSingle();

  if (yearProfileError) {
    console.error(
      "Lỗi lấy trạng thái hồ sơ theo năm:",
      yearProfileError
    );

    return {
      allowed: false,
      message: "Không thể kiểm tra trạng thái hồ sơ.",
    };
  }

  // Lấy trạng thái nhận hồ sơ theo năm
  const { data: setting, error: settingError } = await supabase
    .from("academic_years")
    .select("submission_open")
    .eq("id", yearId)
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
  if (yearProfile?.is_submitted || !setting?.submission_open) {
    return {
      allowed: false,
      message: yearProfile?.is_submitted
        ? "Bạn đã nộp hồ sơ. Không thể chỉnh sửa tiêu chí."
        : "Hệ thống đã đóng nhận hồ sơ. Không thể chỉnh sửa tiêu chí.",
    };
  }

  return {
    allowed: true,
    message: "",
  };
}