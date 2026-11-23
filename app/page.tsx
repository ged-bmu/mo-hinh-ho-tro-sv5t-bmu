"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { authFetch as fetch } from "../lib/auth-fetch";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import Image from "next/image";
import CriteriaModal from "./components/CriteriaModal";
import BellUserTemp from "./components/BellUserTemp";
import Header from "./components/Header";
import Spinner from "./components/Spinner";
import NotificationCard from "./components/NotificationCard";
import { CircleHelp } from "lucide-react";

export default function Home() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tab, setTab] = useState("proof");
  const [showCriteria, setShowCriteria] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [nextActivities, setNextActivities] = useState<any[]>([]);
  const [showActivities, setShowActivities] = useState(false);
  const [rightCardScale, setRightCardScale] = useState(1);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [generalNotification, setGeneralNotification] = useState<any>(null);
  const [currentAcademicYearId, setCurrentAcademicYearId] = useState<number | null>(null);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [criteriaResults, setCriteriaResults] = useState<any>(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
  const [totalProfilePercent, setTotalProfilePercent] = useState(0);
  const cardScale = isMobile ? 1 : rightCardScale;

useEffect(() => {
  try {
    const savedPercent = Number(window.localStorage.getItem("home-right-card-size"));
    if (Number.isInteger(savedPercent) && savedPercent >= 90 && savedPercent <= 120 && savedPercent % 5 === 0) {
      setRightCardScale(savedPercent / 100);
    }
  } catch (error) {
    console.error("Lỗi tải kích thước thẻ trang chủ:", error);
  }
}, []);

function updateRightCardScale(percent: number) {
  setRightCardScale(percent / 100);
  try {
    window.localStorage.setItem("home-right-card-size", String(percent));
  } catch (error) {
    console.error("Lỗi lưu kích thước thẻ trang chủ:", error);
  }
}

useEffect(() => {
  checkUser();
  loadProfile();
  loadNextActivity();
  loadRegistrationStatus();

  const interval = setInterval(() => {
    loadNextActivity();
  }, 30000);

  return () => clearInterval(interval);
}, []);

useEffect(() => {
  let active = true;

  async function loadCurrentYearCriteria() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!active || !user || !currentAcademicYearId) {
      if (active) setCriteriaResults(null);
      return;
    }

    const { data, error } = await supabase
      .from("student_criteria_results")
      .select("dao_duc, hoc_tap, the_luc, tinh_nguyen, hoi_nhap")
      .eq("user_id", user.id)
      .eq("academic_year_id", currentAcademicYearId)
      .maybeSingle();

    if (!active) return;
    if (error) {
      console.error("Lỗi tải kết quả tiêu chí năm học hiện tại:", error);
      setCriteriaResults(null);
      return;
    }

    setCriteriaResults(data);
  }

  void loadCurrentYearCriteria();

  return () => {
    active = false;
  };
}, [currentAcademicYearId]);

useEffect(() => {
  if (!currentAcademicYearId) return;

  const channel = supabase
    .channel(`student-criteria-${currentAcademicYearId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "student_criteria_results", filter: `academic_year_id=eq.${currentAcademicYearId}` },
      async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("student_criteria_results")
          .select("dao_duc, hoc_tap, the_luc, tinh_nguyen, hoi_nhap")
          .eq("user_id", user.id)
          .eq("academic_year_id", currentAcademicYearId)
          .maybeSingle();
        setCriteriaResults(data);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}, [currentAcademicYearId]);
useEffect(() => {
  let active = true;

  async function loadTotalProfilePercent() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!active || !user || !currentAcademicYearId) {
      if (active) setTotalProfilePercent(0);
      return;
    }

    // Lấy danh sách các ý tiêu chuẩn của năm học
    const { data: criterionItems, error: itemsError } = await supabase
      .from("sv5t_criterion_items")
      .select("id, criterion, item_type")
      .eq("academic_year_id", currentAcademicYearId);

    if (itemsError) {
      console.error("Lỗi tải các ý tiêu chuẩn:", itemsError);
      return;
    }

    // Lấy phần trăm đánh giá của sinh viên
    const { data: evaluations, error: evaluationsError } = await supabase
      .from("sv5t_student_criterion_evaluations")
      .select("criterion_item_id, completion_percent")
      .eq("user_id", user.id)
      .eq("academic_year_id", currentAcademicYearId);

    if (evaluationsError) {
      console.error("Lỗi tải đánh giá tiêu chí:", evaluationsError);
      return;
    }

    if (!active) return;

    const criteria = [
      "dao-duc",
      "hoc-tap",
      "the-luc",
      "tinh-nguyen",
      "hoi-nhap",
    ];

    let totalScore = 0;

    criteria.forEach((criterion) => {
      const items = (criterionItems || []).filter(
        (item) => item.criterion === criterion
      );

      const requiredItems = items.filter(
        (item) => item.item_type === "required"
      );

      const additionalItems = items.filter(
        (item) => item.item_type === "additional"
      );

      // Bắt buộc: tối đa 50%, chia đều cho các ý
      const requiredScore =
        requiredItems.length > 0
          ? requiredItems.reduce((sum, item) => {
              const evaluation = (evaluations || []).find(
                (e) => e.criterion_item_id === item.id
              );

              return sum + Number(evaluation?.completion_percent || 0);
            }, 0) / requiredItems.length * 0.5
          : 0;

      // Bổ sung: tối đa 50%, chỉ lấy ý có phần trăm cao nhất
      const additionalScore =
        additionalItems.length > 0
          ? Math.max(
              ...additionalItems.map((item) => {
                const evaluation = (evaluations || []).find(
                  (e) => e.criterion_item_id === item.id
                );

                return Number(evaluation?.completion_percent || 0);
              })
            ) * 0.5
          : 0;

      totalScore += requiredScore + additionalScore;
    });

    // Trung bình 5 tiêu chí chính
    setTotalProfilePercent(totalScore / 5);
  }

  void loadTotalProfilePercent();

  return () => {
    active = false;
  };
}, [currentAcademicYearId]);
useEffect(() => {
  if (!currentAcademicYearId) return;

  const channel = supabase
    .channel(`student-total-evaluation-${currentAcademicYearId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sv5t_student_criterion_evaluations",
        filter: `academic_year_id=eq.${currentAcademicYearId}`,
      },
      async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: items } = await supabase
          .from("sv5t_criterion_items")
          .select("id, criterion, item_type")
          .eq("academic_year_id", currentAcademicYearId);

        const { data: evaluations } = await supabase
          .from("sv5t_student_criterion_evaluations")
          .select("criterion_item_id, completion_percent")
          .eq("user_id", user.id)
          .eq("academic_year_id", currentAcademicYearId);

        if (!items || !evaluations) return;

        const criteria = [
          "dao-duc",
          "hoc-tap",
          "the-luc",
          "tinh-nguyen",
          "hoi-nhap",
        ];

        let total = 0;

        criteria.forEach((criterion) => {
          const group = items.filter(
            (item) => item.criterion === criterion
          );

          const required = group.filter(
            (item) => item.item_type === "required"
          );

          const additional = group.filter(
            (item) => item.item_type === "additional"
          );

          const requiredScore =
            required.length > 0
              ? required.reduce((sum, item) => {
                  const evaluation = evaluations.find(
                    (e) => e.criterion_item_id === item.id
                  );

                  return sum + Number(evaluation?.completion_percent || 0);
                }, 0) / required.length * 0.5
              : 0;

          const additionalScore =
            additional.length > 0
              ? Math.max(
                  ...additional.map((item) => {
                    const evaluation = evaluations.find(
                      (e) => e.criterion_item_id === item.id
                    );

                    return Number(evaluation?.completion_percent || 0);
                  })
                ) * 0.5
              : 0;

          total += requiredScore + additionalScore;
        });

        setTotalProfilePercent(total / 5);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}, [currentAcademicYearId]);
useEffect(() => {
  let channel: ReturnType<typeof supabase.channel> | null = null;
  let active = true;

  const initRealtime = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!active || !user) return;

    // Theo dõi mở/đóng đợt đăng ký và chuyển năm học
    channel = supabase
      .channel("student-registration-year-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "academic_years",
        },
        async () => {
          if (active) {
            await loadRegistrationStatus();
          }
        }
      )
      .subscribe();
  };

  initRealtime();

  return () => {
    active = false;
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, []);


useEffect(() => {
  let active = true;

  const channel = supabase
    .channel("student-registration-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "student_year_profiles",
      },
      async () => {
        if (active) {
          await loadRegistrationStatus();
        }
      }
    )
    .subscribe();

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}, []);


useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

async function checkUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "/introduce";
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, roles")
    .eq("id", user.id)
    .single();

  if (profile?.roles?.includes("chu_tich_hsv")) {
    window.location.href = "/chutichhsv";
    return;
  }

  if (profile?.roles?.includes("bch_hsv")) {
    window.location.href = "/bch";
    return;
  }

  if (profile?.roles?.includes("admin")) {
    window.location.href = "/admin";
    return;
  }

  setLoading(false);
}
function formatEventTime(start: string | null, end: string | null) {
  const formatDate = (value: string | null) => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const startDate = formatDate(start);
  const endDate = formatDate(end);

  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  if (startDate) return `Từ ngày ${startDate}`;
  if (endDate) return `Đến ngày ${endDate}`;

  return "Chưa cập nhật thời gian";
}
const criterionLabel: Record<string, string> = {
  dao_duc: "Đạo đức tốt",
  hoc_tap: "Học tập tốt",
  the_luc: "Thể lực tốt",
  tinh_nguyen: "Tình nguyện tốt",
  hoi_nhap: "Hội nhập tốt",
  khac: "Khác",
};
const folders = [
{
  name: "Đạo đức tốt",
  icon: "/icondaoduc.png",
  link: "/dao-duc",
  field: "dao-duc",
},
{
  name: "Học tập tốt",
  icon: "/iconhoctap.png",
  link: "/hoc-tap",
  field: "hoc-tap",
},
{
  name: "Thể lực tốt",
  icon: "/icontheluc.png",
  link: "/the-luc",
  field: "the-luc",
},
{
  name: "Tình nguyện tốt",
  icon: "/icontinhnguyen.png",
  link: "/tinh-nguyen",
  field: "tinh-nguyen",
},
{
  name: "Hội nhập tốt",
  icon: "/iconhoinhap.png",
  link: "/hoi-nhap",
  field: "hoi-nhap",
},
{
  name: "Thành tích khác",
  icon: "/iconuutien.png",
  link: "/uu-tien",
  field: "uu-tien",
},
];
useEffect(() => {
  async function loadGeneralNotification() {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("type", "general")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      return;
    }
    setGeneralNotification(data);
  }
  loadGeneralNotification();
}, []);
useEffect(() => {
  const channel = supabase
    .channel("general-notification-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: "type=eq.general",
      },
      (payload) => {
        setGeneralNotification(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

async function loadRegistrationStatus() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: years, error: yearsError } = await supabase
    .from("academic_years")
    .select("id, name, is_current")
    .order("id", { ascending: false });

  if (yearsError) {
    console.error("Lỗi tải danh sách năm học:", yearsError);
  } else {
    setAcademicYears(years || []);
  }

  // Lấy năm học hiện tại và trạng thái mở đăng ký
  const { data: year, error: yearError } = await supabase
    .from("academic_years")
    .select("id, submission_open")
    .eq("is_current", true)
    .maybeSingle();

  if (yearError || !year) {
    setCurrentAcademicYearId(null);
    setRegistrationOpen(false);
    setIsRegistered(false);
    return;
  }

  setCurrentAcademicYearId(year.id);
  setRegistrationOpen(year.submission_open === true);

  // Lấy trạng thái đăng ký của sinh viên trong năm học này
  const { data: registration, error } = await supabase
    .from("student_year_profiles")
    .select("dang_ky_phan_dau")
    .eq("user_id", user.id)
    .eq("academic_year_id", year.id)
    .maybeSingle();

  if (error) {
    console.error("Lỗi tải trạng thái đăng ký:", error);
    return;
  }

  setIsRegistered(registration?.dang_ky_phan_dau === true);
}

async function toggleRegistration() {
  if (registrationLoading || !registrationOpen || !currentAcademicYearId) {
    return;
  }

  setRegistrationLoading(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Vui lòng đăng nhập lại.");
      return;
    }

    const nextStatus = !isRegistered;

    const { data: existing, error: findError } = await supabase
      .from("student_year_profiles")
      .select("id")
      .eq("user_id", user.id)
      .eq("academic_year_id", currentAcademicYearId)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      const { error } = await supabase
        .from("student_year_profiles")
        .update({ dang_ky_phan_dau: nextStatus })
        .eq("user_id", user.id)
        .eq("academic_year_id", currentAcademicYearId);

      if (error) throw error;
    } else if (nextStatus) {
      const { error } = await supabase
        .from("student_year_profiles")
        .insert({
          user_id: user.id,
          academic_year_id: currentAcademicYearId,
          dang_ky_phan_dau: true,
        });

      if (error) throw error;
    }

    setIsRegistered(nextStatus);

if (nextStatus) {
  setShowRegistrationSuccess(true);
} else {
  alert("Đã hủy đăng ký rèn luyện.");
}
  } catch (error) {
    console.error("Lỗi đăng ký rèn luyện:", error);
    alert("Không thể cập nhật đăng ký. Vui lòng thử lại.");
  } finally {
    setRegistrationLoading(false);
  }
}

async function loadProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

if (data) {
  setProfile(data);
}
}
useEffect(() => {
  let channel: any;
  let isMounted = true;

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isMounted) return;

    channel = supabase
      .channel(`profile-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (isMounted) {
            setProfile(payload.new);
          }
        }
      )
      .subscribe();
  };

  init();

  return () => {
    isMounted = false;

    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}, []);
useEffect(() => {
  let channel: any;
  let isMounted = true;

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isMounted) return;

    // Lấy số tin chưa đọc ban đầu
    const { data, error } = await supabase
      .from("conversations")
      .select("unread_user")
      .eq("user_id", user.id)
      .single();

    if (!error && isMounted) {
      setUnreadMessages(data?.unread_user || 0);
    }

    // Tạo realtime channel DUY NHẤT
    channel = supabase
      .channel(`conversation-unread-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {

          if (isMounted) {
            setUnreadMessages(
              Number(payload.new?.unread_user || 0)
            );
          }
        }
      )
      .subscribe((status) => {
      });
  };

  init();

  return () => {
    isMounted = false;

    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  };
}, []);
function getActivityStatus(activity: any) {
  const now = new Date().getTime();
  const start = activity.event_time
    ? new Date(activity.event_time).getTime()
    : NaN;
  const end = activity.end_time
    ? new Date(activity.end_time).getTime()
    : NaN;

  // Ưu tiên xác định trạng thái theo thời gian thực
  if (Number.isFinite(start) && Number.isFinite(end)) {
    if (now < start) return "scheduled";
    if (now <= end) return "ongoing";
    return "ended";
  }

  // Nếu thiếu thời gian thì sử dụng trạng thái trong database
  if (activity.status === "upcoming" || activity.status === "scheduled") {
    return "scheduled";
  }

  if (activity.status === "ongoing") return "ongoing";
  if (activity.status === "ended") return "ended";

  return "ended";
}

async function loadNextActivity() {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("event_time", { ascending: true });

  if (error) {
    console.error("Lỗi tải hoạt động:", error);
    return;
  }

  const activities = (data || [])
    .map((activity: any) => ({
      ...activity,
      displayStatus: getActivityStatus(activity),
    }))
    .filter(
      (activity: any) =>
        activity.displayStatus === "scheduled" ||
        activity.displayStatus === "ongoing"
    )
    .sort((a: any, b: any) => {
      // Đang diễn ra hiển thị trước
      if (a.displayStatus !== b.displayStatus) {
        return a.displayStatus === "ongoing" ? -1 : 1;
      }

      // Cùng trạng thái thì sắp xếp theo thời gian bắt đầu
      return (
        new Date(a.event_time).getTime() -
        new Date(b.event_time).getTime()
      );
    });

  setNextActivities(activities);
}
if (loading) {

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Spinner />
    </div>
  );
}
const handleExport = async (academicYearId: number) => {
  if (exporting || !profile?.id) return;

  setExporting(true);
  setShowExportMenu(false);

  try {
    const response = await fetch(
      `/api/export-student/${profile.id}?year=${academicYearId}`
    );

    if (!response.ok) {
      throw new Error("Xuất hồ sơ thất bại");
    }

    // Chờ toàn bộ file ZIP tải về trình duyệt
    const blob = await response.blob();

    // Lấy tên file từ Content-Disposition nếu có
    const contentDisposition =
      response.headers.get("Content-Disposition");

    let fileName = "HoSo-SV5T.zip";

    const match = contentDisposition?.match(
      /filename="([^"]+)"/
    );

    if (match?.[1]) {
      fileName = match[1];
    }

    // Tạo link tải
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Giải phóng bộ nhớ
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert("Không thể xuất hồ sơ. Vui lòng thử lại.");
  } finally {
    // Xuất xong hoặc lỗi đều dừng spinner
    setExporting(false);
  }
};

const circleRadius = 54;
const circleCircumference = 2 * Math.PI * circleRadius;
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const academicYear =
  currentDate.getMonth() >= 7
    ? `${currentYear}-${currentYear + 1}`
    : `${currentYear - 1}-${currentYear}`;
return (
<div
  style={{
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  }}
>

  
  <Header
  tab={tab}
  setTab={setTab}
  openCriteria={() => setShowCriteria(true)}
  openProfile={() => setShowProfile(true)}
/>
  
  <div
    style={{
      position: "fixed",
      top: 90,
      right: 20,
      zIndex: 9999,
    }}
  >
    <BellUserTemp />
  </div>

  <div
    style={{
      display: "flex",
      flex: 1,
    }}
  >

    <Sidebar />

    <main
      style={{
  flex: 1,
  background: "#d6f5ff",
  padding: isMobile ? "16px" : "30px",
  paddingBottom: isMobile ? "90px" : "30px",
  overflowX: "hidden",
}}
>
<div
  style={{
    width: "100%",
    maxWidth: isMobile ? "100%" : "1400px",
    margin: "0 auto",
  }}
>
{!isMobile && (
  <h1
    style={{
      marginBottom: "5px",
      fontSize: "20px",
      lineHeight: "1.5",
      fontWeight: 500,
      textAlign: "center",
      color: "#0f172a",
    }}
  >
    <b>
      CÂU LẠC BỘ SINH VIÊN 5 TỐT TRƯỜNG ĐẠI HỌC Y DƯỢC BUÔN MA THUỘT
    </b>
  </h1>
)}

{!isMobile && (
  <p
    style={{
      textAlign: "center",
      fontSize: "24px",
      fontWeight: "700",
      lineHeight: 1.4,
      color: "#0f65de",
      maxWidth: "900px",
      margin: "5px auto 30px",
    }}
  >
    Mô hình hỗ trợ sinh viên phấn đấu đạt danh hiệu Sinh viên 5 tốt các cấp
  </p>
)}
<div
  style={{
    background: "linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)",
    border: "1px solid #dbeafe",
    borderRadius: "16px",
    padding: "22px",
    minHeight: isMobile ? "280px" : "220px",
    marginBottom: "30px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  }}
>
<div 
  style={{ 
    display: "flex", 
    flexDirection: isMobile ? "column" : "row", 
    alignItems: isMobile ? "stretch" : "center", 
    justifyContent: "space-between", 
    gap: isMobile ? "8px" : "12px", 
  }} 
> 
  <div style={{ flex: 1, minWidth: 0 }}>
    <h2 
      style={{ 
        margin: 0, 
        fontSize: isMobile ? "17px" : "19px", 
        fontWeight: 700, 
        textAlign: isMobile ? "center" : "left", 
      }} 
    > 
      👋 Xin chào, {profile?.ho_ten} 
    </h2>

{profile?.trang_thai === "da_dat" &&
  profile?.da_duyet === true && (
  <div
    style={{
      marginTop: "10px",
      display: "flex",
      justifyContent: isMobile ? "center" : "flex-start",
    }}
  >
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "#dcfce7",
        color: "#166534",
        border: "1px solid #86efac",
        borderRadius: "999px",
        padding: isMobile ? "8px 12px" : "9px 14px",
        fontSize: isMobile ? "12px" : "13px",
        fontWeight: 800,
        boxShadow: "0 2px 8px rgba(22, 163, 74, 0.12)",
        textAlign: "center",
      }}
    >
      🎉 Bạn đã đạt danh hiệu Sinh viên 5 tốt cấp Trường, năm học 2025 - 2026 🎉
    </span>
  </div>
)}
  </div>

{registrationOpen && (
  <button
    type="button"
    onClick={toggleRegistration}
    disabled={registrationLoading}
    style={{
      background: isRegistered ? "#fff7ed" : "#2563eb",
      color: isRegistered ? "#c2410c" : "#ffffff",
      border: isRegistered
        ? "1px solid #fdba74"
        : "1px solid #2563eb",
      padding: "9px 16px",
      borderRadius: "10px",
      fontWeight: 700,
      fontSize: "14px",
      cursor: registrationLoading ? "wait" : "pointer",
      opacity: registrationLoading ? 0.7 : 1,
      width: isMobile ? "100%" : "auto",
      transition: "all .25s ease",
      lineHeight: 1.2,
      whiteSpace: "nowrap",
    }}
  >
    {registrationLoading
      ? "Đang cập nhật..."
      : isRegistered
      ? "↩ Hủy đăng ký rèn luyện"
      : "Đăng ký rèn luyện"}
  </button>
)}

  <div style={{ position: "relative", width: isMobile ? "100%" : "auto" }}>
    {false && (
  <button
    type="button"
    onClick={() => setShowExportMenu((open) => !open)}
    disabled={exporting || academicYears.length === 0}
    style={{
      background: "#16a34a",
      color: "#fff",
      border: "none",
      padding: "9px 16px",
      borderRadius: "10px",
      fontWeight: 600,
      fontSize: "14px",
      cursor: exporting ? "wait" : "pointer",
      width: isMobile ? "100%" : "auto",
      transition: "all .25s ease",
      lineHeight: 1.2,
    }}
  >
    {exporting ? "Đang xuất hồ sơ..." : "Xuất hồ sơ ▾"}
  </button>
)}

    {showExportMenu && !exporting && (
      <div
        role="menu"
        aria-label="Chọn năm học để xuất hồ sơ"
        style={{
          position: "absolute",
          right: 0,
          top: "calc(100% + 8px)",
          zIndex: 50,
          minWidth: isMobile ? "100%" : "220px",
          padding: "6px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          background: "#fff",
          boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
          display: "none",
        }}
      >
        <div style={{ padding: "8px 10px", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
          Chọn năm học
        </div>
        {academicYears.map((year) => (
          <button
            key={year.id}
            type="button"
            role="menuitem"
            onClick={() => void handleExport(year.id)}
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              padding: "10px",
              border: 0,
              borderRadius: "8px",
              background: "transparent",
              color: "#0f172a",
              textAlign: "left",
              fontSize: 14,
              cursor: "pointer",
            }}
            onMouseEnter={(event) => { event.currentTarget.style.background = "#f1f5f9"; }}
            onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}
          >
            <span>{year.name}</span>
            {year.is_current && <span style={{ color: "#15803d", fontSize: 12 }}>Hiện tại</span>}
          </button>
        ))}
      </div>
    )}
  </div>
</div>
<div
  style={{
    marginTop: isMobile ? 0 : 22,
    borderTop: "1px solid #e5e7eb",
    paddingTop: isMobile ? 10 : 18,
    display: "grid",
gridTemplateColumns: isMobile
  ? "1fr"
  : "170px minmax(220px, 0.9fr) minmax(0, 2.4fr)",
gap: isMobile ? 16 : 12,
  }}
>
{/* ===================================================== */}
{/* CỘT 1 — TIÊU CHÍ ĐÃ ĐẠT */}
{/* ===================================================== */}

<div
style={{
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  background: "#ffffff",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  overflow: "hidden",
  boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
}}
>
  {/* Tiêu đề */}
  <div
  style={{
    fontWeight: 700,
    fontSize: 15,
    color: "#2c449b",
    background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
    padding: "12px 14px",
    width: "100%",
    borderBottom: "1px solid #000000",
  }}
>
  🏅Tiến độ
</div>

  {!isMobile ? (
    /* ================= DESKTOP ================= */
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        flex: 1,
        minHeight: 150,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 150,
          height: 150,
        }}
      >
        <img
  src="/bonghoa5tot.png"
  alt=""
  style={{
    position: "absolute",
    width: 170,
    height: 170,
    objectFit: "contain",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    opacity: 0.12,
    pointerEvents: "none",
    zIndex: 0,
  }}
/>
        <svg
          width="150"
          height="150"
          viewBox="0 0 150 150"
          style={{
            transform: "rotate(-90deg)",
          }}
        >
          {/* Vòng nền */}
          <circle
            cx="75"
            cy="75"
            r={circleRadius}
            fill="none"
            stroke="#EEF2FF"
            strokeWidth="10"
          />

          {/* Vòng tiến độ */}
          <circle
            cx="75"
            cy="75"
            r={circleRadius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circleCircumference}
            strokeDashoffset={
circleCircumference -
  (totalProfilePercent / 100) * circleCircumference
}
            filter="url(#glow)"
            style={{
              transition: "stroke-dashoffset 0.6s ease",
            }}
          />

          
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>

            
              <feGaussianBlur
                stdDeviation="2.5"
                result="blur"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
        </svg>

        {/* Nội dung giữa vòng */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: "#0F172A",
              lineHeight: 1,
            }}
          >
            {Math.round(totalProfilePercent)}%
          </div>
        </div>
      </div>
    </div>
  ) : (
    /* ================= MOBILE ================= */
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Thanh tiến độ */}
      <div
        style={{
          flex: 1,
          height: 12,
          background: "#DBEAFE",
          borderRadius: 999,
          overflow: "hidden",
          boxShadow:
            "inset 0 1px 3px rgba(37, 99, 235, 0.12)",
        }}
      >
        <div
          style={{
            width: `${totalProfilePercent}%`,
            height: "100%",
            borderRadius: 999,
            background:
              "linear-gradient(90deg, #1D4ED8 0%, #2563EB 45%, #38BDF8 100%)",
            boxShadow:
              "0 2px 8px rgba(37, 99, 235, 0.3)",
            transition: "width 0.6s ease",
          }}
        />
      </div>

      {/* Số */}
      <div
        style={{
          flex: "0 0 auto",
          fontSize: 18,
          fontWeight: 800,
          color: "#1D4ED8",
          whiteSpace: "nowrap",
        }}
      >
        {Math.round(totalProfilePercent)}%
      </div>
    </div>
  )}
</div>
  


{/* ===================================================== */}
{/* CỘT 2 — THAO TÁC NHANH */}
{/* ===================================================== */}
<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: isMobile ? "100%" : "85%",
    justifySelf: "center",
    boxSizing: "border-box",
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    overflow: "visible",
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
  }}
  >
  <div
    style={{
      fontWeight: 700,
      fontSize: 15,
      color: "#2c449b",
      background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
      padding: "12px 14px",
      width: "100%",
      boxSizing: "border-box",
      borderBottom: "1px solid #000000",
      borderTopLeftRadius: "16px",
      borderTopRightRadius: "16px",
    }}
  >
    ⚡ Thao tác nhanh
  </div>

  {/* XEM BÁO CÁO */}
  <a
    href="/bao-cao"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "6px 10px",
      width: "85%",
      alignSelf: "center",
      boxSizing: "border-box",
      background: "#F0F9FF",
      border: "1px solid #BAE6FD",
      color: "#0369A1",
      borderRadius: 14,
      textDecoration: "none",
      transition: "all .2s ease",
      boxShadow: "0 2px 6px rgba(0,0,0,.04)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 6px 14px rgba(37,99,235,.12)";
      e.currentTarget.style.borderColor = "#93C5FD";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,.04)";
      e.currentTarget.style.borderColor = "#BFDBFE";
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: "#DBEAFE",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        flexShrink: 0,
      }}
    >
      📑
    </div>

    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
        Báo cáo điện tử
      </div>
    </div>

    <span style={{ fontSize: 18, color: "#2563EB", fontWeight: 700 }}>
      →
    </span>
  </a>

  {/* NHẮN TIN */}
  <a
    href="/trao-doi"
    onClick={async () => {
      if (!profile?.id) return;

      await supabase
        .from("conversations")
        .update({ unread_user: 0 })
        .eq("user_id", profile.id);

      setUnreadMessages(0);
    }}
    style={{
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "6px 10px",
      width: "85%",
      alignSelf: "center",
      boxSizing: "border-box",
      background: "#FFF7ED",
      border: "1px solid #FED7AA",
      borderRadius: 14,
      textDecoration: "none",
      color: "#0F172A",
      transition: "all .2s ease",
      boxShadow: "0 2px 6px rgba(0,0,0,.04)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "0 6px 14px rgba(249,115,22,.12)";
      e.currentTarget.style.borderColor = "#FDBA74";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,.04)";
      e.currentTarget.style.borderColor = "#FED7AA";
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: "#FFEDD5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        flexShrink: 0,
      }}
    >
      💬
    </div>

    <div style={{ minWidth: 0, flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
        Nhắn tin
      </div>
    </div>

    <span style={{ fontSize: 18, color: "#F97316", fontWeight: 700 }}>
      →
    </span>

    {unreadMessages > 0 && (
      <span
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          minWidth: 20,
          height: 20,
          padding: "0 5px",
          borderRadius: 999,
          background: "#EF4444",
          color: "#fff",
          fontSize: 11,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #fff",
          zIndex: 2,
        }}
      >
        {unreadMessages > 9 ? "9+" : unreadMessages}
      </span>
    )}
  </a>

{/* CÀI ĐẶT */}
<a
  href="/caidat"
  style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "6px 10px",
    width: "85%",
    alignSelf: "center",
    boxSizing: "border-box",
    background: "#F5F3FF",
    border: "1px solid #DDD6FE",
    borderRadius: 14,
    textDecoration: "none",
    color: "#0F172A",
    transition: "all .2s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,.04)",
    marginBottom: 10,
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
    e.currentTarget.style.boxShadow = "0 6px 14px rgba(124,58,237,.12)";
    e.currentTarget.style.borderColor = "#C4B5FD";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,.04)";
    e.currentTarget.style.borderColor = "#DDD6FE";
  }}
>
  <div
    style={{
      width: 40,
      height: 40,
      borderRadius: 12,
      background: "#EDE9FE",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      flexShrink: 0,
    }}
  >
    ⚙️
  </div>

  <div style={{ minWidth: 0, flex: 1 }}>
    <div style={{ fontSize: 14, fontWeight: 800, color: "#0F172A" }}>
      Cài đặt
    </div>
  </div>

  <span style={{ fontSize: 18, color: "#7C3AED", fontWeight: 700 }}>
    →
  </span>
</a>
</div>

    {/* ================= CARD CHỨC NĂNG BÊN PHẢI ================= */}
  <div
    style={{
  background: "transparent",
  borderRadius: 0,
  padding: 0,
  boxShadow: "none",
}}
  >
    {/* Tiêu đề */}
    <div
      style={{
  fontSize: 15,
  fontWeight: 700,
  color: "#2c449b",
  background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
  padding: "12px 14px",
  marginBottom: 14,
  borderBottom: "1px solid #000000",
  borderTopLeftRadius: "16px",
  borderTopRightRadius: "16px",
}}
    >
      Chức năng
    </div>

    {/* 3 nút */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile
          ? "1fr"
          : "repeat(3, 1fr)",
        gap: "14px",
      }}
    >
      {/* Hồ sơ Sinh viên 5 tốt */}
      <a
        href="/tieuchi"
        style={{
          background: "#F3E8FF",
          borderRadius: "14px",
          padding: "20px",
          textDecoration: "none",
          color: "#111827",
          boxShadow: "0 3px 8px rgba(0,0,0,.05)",
          transition: ".25s",
          minHeight: "150px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateY(-4px)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateY(0)")
        }
      >
        <img
  src="/bonghoa5tot.png"
  alt="Biểu tượng Sinh viên 5 tốt"
  style={{
    width: 38,
    height: 38,
    objectFit: "contain",
  }}
/>

        <h3
          style={{
            margin: "10px 0 6px",
            fontSize: 19,
          }}
        >
          Hồ sơ Sinh viên 5 tốt
        </h3>

        <p
          style={{
            margin: 0,
            color: "#8796aa",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          Quản lý minh chứng theo từng tiêu chí Sinh viên 5 Tốt.
        </p>
      </a>

      {/* Mục tiêu học tập */}
      <a
        href="/bang-diem"
        style={{
          background: "#DCFCE7",
          borderRadius: "14px",
          padding: "20px",
          textDecoration: "none",
          color: "#111827",
          boxShadow: "0 3px 8px rgba(0,0,0,.05)",
          transition: ".25s",
          minHeight: "150px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateY(-4px)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateY(0)")
        }
      >
        <div style={{ fontSize: 34 }}>📊</div>

        <h3
          style={{
            margin: "10px 0 6px",
            fontSize: 19,
          }}
        >
          Mục tiêu học tập
        </h3>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          Theo dõi kết quả học tập và đề ra mục tiêu của bạn.
        </p>
      </a>

      {/* Hoạt động */}
      <a
        href="/hoat-dong"
        style={{
          background: "#E0F2FE",
          borderRadius: "14px",
          padding: "20px",
          textDecoration: "none",
          color: "#111827",
          boxShadow: "0 3px 8px rgba(0,0,0,.05)",
          transition: ".25s",
          minHeight: "150px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateY(-4px)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateY(0)")
        }
      >
        <div style={{ fontSize: 34 }}>📅</div>

        <h3
          style={{
            margin: "10px 0 6px",
            fontSize: 19,
          }}
        >
          Hoạt động sắp tới
        </h3>

        <p
          style={{
            margin: 0,
            color: "#64748b",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          Xem các hoạt động sắp diễn ra trong thời gian tới.
        </p>
      </a>
    </div>

</div>
</div>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "1fr 2fr",
    gap: "20px",
    marginBottom: "20px",
    alignItems: "stretch",
  }}
>
{/* ================= THÔNG BÁO BÊN TRÁI ================= */}
{!isMobile && <NotificationCard isMobile={isMobile} />}
 
{/* ===================================================== */}
{/* CỘT PHẢI — HOẠT ĐỘNG SẮP TỚI + THÔNG TIN CHUNG */}
{/* ===================================================== */}

<div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 12 * cardScale,
    height: "100%",
    minWidth: 0,
    minHeight: 0,
  }}
>
  {/* ===================================================== */}
  {/* HOẠT ĐỘNG SẮP TỚI */}
  {/* ===================================================== */}

  <div
    style={{
      minWidth: 0,
      flex: "1 1 0",
      minHeight: 0,
      background: "#ffffff",
      borderRadius: "16px",
      border: "1px solid #e5e7eb",
      overflow: "hidden",
      boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* Tiêu đề */}
    <div
      onClick={() => {
        if (isMobile) {
          setShowActivities((prev) => !prev);
        }
      }}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 8 * cardScale,
        fontWeight: 700,
        fontSize: 15 * cardScale,
        color: "#2c449b",
        background: "linear-gradient(90deg, #63d0ff, #38bdf8)",
        padding: `${12 * cardScale}px ${14 * cardScale}px`,
        width: "100%",
        boxSizing: "border-box",
        borderBottom: "1px solid #000000",
        cursor: isMobile ? "pointer" : "default",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <span>📅 Hoạt động sắp tới</span>

      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "#2563EB",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 800,
          lineHeight: 1,
          boxShadow: "0 2px 6px rgba(37, 99, 235, 0.25)",
        }}
      >
        {nextActivities.length}
      </span>

      {!isMobile && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginLeft: "auto",
            color: "#1e3a8a",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <span>Cỡ thẻ</span>
          <input
            type="range"
            min={90}
            max={120}
            step={5}
            value={Math.round(rightCardScale * 100)}
            aria-label="Điều chỉnh kích thước các thẻ bên phải"
            onChange={(event) => updateRightCardScale(Number(event.target.value))}
            style={{ width: 90, accentColor: "#2563eb", cursor: "pointer" }}
          />
          <span style={{ minWidth: 36, textAlign: "right" }}>
            {Math.round(rightCardScale * 100)}%
          </span>
        </label>
      )}

      {/* Mũi tên chỉ hiện trên mobile */}
      {isMobile && (
        <span
          style={{
            marginLeft: "auto",
            fontSize: 18,
            color: "#2563EB",
            transition: "transform 0.25s ease",
            transform: showActivities
              ? "rotate(180deg)"
              : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      )}
    </div>

    {/* Danh sách hoạt động */}
    {(!isMobile || showActivities) && (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10 * cardScale,
          flex: "1 1 auto",
          minHeight: 0,
          maxHeight: isMobile ? "260px" : "none",
          overflowY: "auto",
          padding: `${10 * cardScale}px`,
          boxSizing: "border-box",
        }}
      >
        {nextActivities.length > 0 ? (
          nextActivities.map((activity) => (
            <div
              key={activity.id}
              style={{
                background: "#F8FAFC",
                borderRadius: 12,
                padding: `${12 * cardScale}px ${15 * cardScale}px`,
                border: "1px solid #E5E7EB",
                display: "flex",
                alignItems: "center",
                gap: 16 * cardScale,
                flexWrap: "nowrap",
                minWidth: 0,
                flexShrink: 0,
              }}
            >
              {/* Tên hoạt động và trạng thái */}
              <div
                style={{
                  flex: "1 1 40%",
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14 * cardScale,
                    color: "#0F172A",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {activity.title}
                </div>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    width: "fit-content",
                    padding: "3px 9px",
                    borderRadius: 999,
                    fontSize: 11 * cardScale,
                    fontWeight: 800,
                    background:
                      activity.displayStatus === "ongoing"
                        ? "#DCFCE7"
                        : "#DBEAFE",
                    color:
                      activity.displayStatus === "ongoing"
                        ? "#15803D"
                        : "#1D4ED8",
                  }}
                >
                  {activity.displayStatus === "ongoing"
                    ? "● Đang diễn ra"
                    : "◷ Sắp diễn ra"}
                </span>
              </div>

              {/* Tiêu chí */}
              <div
                style={{
                  flex: "0 0 150px",
                  fontSize: 13 * cardScale,
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                  display: isMobile ? "none" : "block",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "5px 10px",
                    borderRadius: 999,
                    background:
                      activity.criterion === "dao_duc"
                        ? "#FEE2E2"
                        : activity.criterion === "hoc_tap"
                        ? "#DBEAFE"
                        : activity.criterion === "the_luc"
                        ? "#FFEDD5"
                        : activity.criterion === "tinh_nguyen"
                        ? "#DCFCE7"
                        : activity.criterion === "hoi_nhap"
                        ? "#F3E8FF"
                        : "#F1F5F9",
                    color:
                      activity.criterion === "dao_duc"
                        ? "#B91C1C"
                        : activity.criterion === "hoc_tap"
                        ? "#1D4ED8"
                        : activity.criterion === "the_luc"
                        ? "#C2410C"
                        : activity.criterion === "tinh_nguyen"
                        ? "#15803D"
                        : activity.criterion === "hoi_nhap"
                        ? "#7E22CE"
                        : "#475569",
                  }}
                >
                  {criterionLabel[activity.criterion] ?? "Khác"}
                </span>
              </div>

              {/* Thời gian */}
              <div
                style={{
                  flex: "0 0 155px",
                  color: "#64748B",
                  fontSize: 13 * cardScale,
                  whiteSpace: "nowrap",
                  display: isMobile ? "none" : "block",
                }}
              >
                🕒 {formatEventTime(activity.event_time, activity.end_time)}
              </div>

              {/* Xem chi tiết */}
              <a
                href="/hoat-dong"
                style={{
                  flex: "0 0 auto",
                  color: "#2563EB",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 13 * cardScale,
                  whiteSpace: "nowrap",
                }}
              >
                {isMobile ? "Xem →" : "Xem chi tiết →"}
              </a>
            </div>
          ))
        ) : (
          <div
            style={{
              color: "#64748B",
              fontSize: 14 * cardScale,
              padding: `${14 * cardScale}px ${12 * cardScale}px`,
              margin: 0,
            }}
          >
            Chưa có hoạt động diễn ra trong thời gian sắp tới.
          </div>
        )}
      </div>
    )}
  </div>

  {/* ===================================================== */}
  {/* THÔNG TIN CHUNG */}
  {/* ===================================================== */}

  <div
    style={{
      flex: "0 0 auto",
      width: "100%",
      boxSizing: "border-box",
      background:
        "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
      borderRadius: "14px",
      padding: `${18 * cardScale}px ${22 * cardScale}px`,
      border: "1px solid #FED7AA",
      boxShadow: "0 3px 8px rgba(0,0,0,.05)",
      display: "flex",
      alignItems: "center",
      gap: 14 * cardScale,
    }}
  >
    {/* Icon */}
    <div
      style={{
        width: 46 * cardScale,
        height: 46 * cardScale,
        borderRadius: 12,
        background: "#FFEDD5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 25 * cardScale,
        flexShrink: 0,
      }}
    >
      📢
    </div>

    {/* Nội dung */}
    <div
      style={{
        minWidth: 0,
        flex: 1,
      }}
    >
      {/* Tiêu đề */}
      <div
        style={{
          fontSize: 16 * cardScale,
          fontWeight: 800,
          color: "#9A3412",
        }}
      >
        Thông tin chung
      </div>

      {/* Nội dung thông báo */}
      <div
        style={{
          fontSize: 14 * cardScale,
          color: "#C2410C",
          marginTop: 5 * cardScale,
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {generalNotification?.content ||
          "Sẽ sớm có thông báo từ Ban chủ nhiệm Câu lạc bộ Sinh viên 5 tốt BMU"}
      </div>

      {/* Thời gian */}
      {generalNotification?.created_at && (
        <div
          style={{
            fontSize: 12 * cardScale,
            color: "#9A3412",
            marginTop: 7 * cardScale,
          }}
        >
          Cập nhật:{" "}
          {new Date(
            generalNotification.created_at
          ).toLocaleString("vi-VN")}
        </div>
      )}
    </div>
  </div>
</div>

</div>

       </div>
       </main>

  </div>

{showRegistrationSuccess && (
  <div
    onClick={() => setShowRegistrationSuccess(false)}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      background: "rgba(15, 23, 42, 0.68)",
      backdropFilter: "blur(7px)",
      WebkitBackdropFilter: "blur(7px)",
      animation: "fadeIn 0.3s ease",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 460,
        overflow: "hidden",
        borderRadius: 26,
        background: "linear-gradient(145deg, #ffffff 0%, #eff6ff 55%, #dbeafe 100%)",
        boxShadow: "0 25px 80px rgba(0,0,0,0.3)",
        textAlign: "center",
        padding: "34px 26px 28px",
        animation: "popIn 0.45s cubic-bezier(.2,.8,.2,1)",
      }}
    >
      {/* Ánh sáng trang trí */}
      <div
        style={{
          position: "absolute",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: "rgba(96, 165, 250, 0.16)",
          filter: "blur(35px)",
          top: -100,
          left: -80,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "rgba(250, 204, 21, 0.16)",
          filter: "blur(35px)",
          bottom: -90,
          right: -60,
          pointerEvents: "none",
        }}
      />

      {/* Huy hiệu */}
      <div
        style={{
          position: "relative",
          width: 126,
          height: 126,
          margin: "0 auto 18px",
          borderRadius: "50%",
          background: "linear-gradient(145deg, #dbeafe, #bfdbfe)",
          border: "5px solid #ffffff",
          boxShadow: "0 8px 25px rgba(37, 99, 235, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/bonghoa5tot.png"
          alt="Biểu tượng Sinh viên 5 tốt"
          style={{
            width: 94,
            height: 94,
            objectFit: "contain",
          }}
        />
      </div>

      {/* Tiêu đề */}
      <h2
        style={{
          position: "relative",
          margin: "0 0 12px",
          color: "#1E3A8A",
          fontSize: 25,
          lineHeight: 1.3,
          fontWeight: 900,
        }}
      >
        ĐĂNG KÝ THÀNH CÔNG
      </h2>

      <p
        style={{
          position: "relative",
          margin: "0 auto 20px",
          maxWidth: 340,
          color: "#475569",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        Bạn đã chính thức đăng ký rèn luyện phong trào
        <strong style={{ color: "#1D4ED8" }}>
          {" "}Sinh viên 5 tốt năm học {academicYear} 
        </strong>.
        <br />
        Hãy bắt đầu hành trình rèn luyện, hoàn thiện bản thân
        và chinh phục những mục tiêu phía trước!
      </p>

      {/* Thông điệp */}
      <div
        style={{
          position: "relative",
          padding: "13px 14px",
          marginBottom: 22,
          borderRadius: 14,
          background: "rgba(219, 234, 254, 0.75)",
          border: "1px solid #BFDBFE",
          color: "#1E40AF",
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1.5,
        }}
      >
        ⭐ Đạo đức – Năng lực – Tâm huyết ⭐
        <br />
        Sinh viên 5 tốt, hành trình hơn cả một danh hiệu!
      </div>

      {/* Nút đóng */}
      <button
        type="button"
        onClick={() => setShowRegistrationSuccess(false)}
        style={{
          position: "relative",
          width: "100%",
          border: "none",
          borderRadius: 13,
          padding: "14px 20px",
          background: "linear-gradient(90deg, #2563EB, #1D4ED8)",
          color: "#ffffff",
          fontSize: 15,
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 5px 14px rgba(37, 99, 235, 0.25)",
        }}
      >
        BẮT ĐẦU HÀNH TRÌNH
      </button>
    </div>

    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes popIn {
        from {
          opacity: 0;
          transform: scale(0.82) translateY(20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    `}</style>
  </div>
)}

  {showCriteria && (
  <CriteriaModal
    onClose={() => setShowCriteria(false)}
  />
)}
<Footer />
</div>
);
 
}
