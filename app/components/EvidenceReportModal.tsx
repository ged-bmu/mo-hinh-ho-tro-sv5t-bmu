
"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth-fetch";
import { supabase } from "@/lib/supabase";
import ReportEditor from "./ReportEditor";
import Spinner from "./Spinner";

type Props = {
  file: any;
  url: string;
  orderNumber: number;
  reportContent: string;
  onSave: (newName: string, content: string) => Promise<void>;
  onClose: () => void;
};

type CriterionItem = {
  id: number;
  academic_year_id: number;
  criterion: string;
  content: string;
  sort_order: number;
  item_type: "required" | "additional";
};

const CRITERIA = [
  { id: "dao-duc", name: "Đạo đức tốt", icon: "🌱", items: [] as string[] },
  { id: "hoc-tap", name: "Học tập tốt", icon: "📚", items: [] as string[] },
  { id: "the-luc", name: "Thể lực tốt", icon: "💪", items: [] as string[] },
  { id: "tinh-nguyen", name: "Tình nguyện tốt", icon: "❤️", items: [] as string[] },
  { id: "hoi-nhap", name: "Hội nhập tốt", icon: "🌏", items: [] as string[] },
  { id: "uu-tien", name: "Ưu tiên", icon: "⭐", items: [] as string[] },
];
export default function EvidenceReportModal({
  file,
  url,
  orderNumber,
  reportContent,
  onSave,
  onClose,
}: Props) {
  const originalName =
    file.display_name || file.storage_name || file.name || "";

  const [fileName, setFileName] = useState(originalName);
  const [content, setContent] = useState(reportContent || "");
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

const currentCriterion = String(file.folder || "").toLowerCase();
console.log("Thư mục minh chứng:", file.folder);
const [showCriterionItems, setShowCriterionItems] = useState(false);
const [criterionItems, setCriterionItems] = useState<CriterionItem[]>([]);
const [additionalTitles, setAdditionalTitles] = useState<Record<string, string>>({});
const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
const [loadingCriteria, setLoadingCriteria] = useState(true);
useEffect(() => {
  let cancelled = false;

  async function loadCriterionData() {
    try {
      setLoadingCriteria(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error("Bạn chưa đăng nhập.");

      const storageName = String(
        file.storage_name || file.name || ""
      );

      const { data: year, error: yearError } = await supabase
        .from("academic_years")
        .select("id")
        .eq("is_current", true)
        .maybeSingle();

      if (yearError) throw yearError;

      if (!year) {
        setCriterionItems([]);
        setSelectedItemIds([]);
        return;
      }

      const [itemsResult, settingsResult, savedResult] =
        await Promise.all([
          supabase
            .from("sv5t_criterion_items")
            .select("*")
            .eq("academic_year_id", year.id)
            .in("criterion", CRITERIA.map((item) => item.id))
            .order("sort_order"),

          supabase
            .from("sv5t_criterion_settings")
            .select("criterion, additional_title")
            .eq("academic_year_id", year.id)
            .in("criterion", CRITERIA.map((item) => item.id)),

          supabase
            .from("sv5t_evidence_criteria")
            .select("criterion_item_id")
            .eq("user_id", user.id)
            .eq("storage_name", storageName),
        ]);

      if (itemsResult.error) throw itemsResult.error;
      if (settingsResult.error) throw settingsResult.error;
      if (savedResult.error) throw savedResult.error;

      if (cancelled) return;

      setCriterionItems(
        (itemsResult.data || []) as CriterionItem[]
      );

      const titles: Record<string, string> = {};

      (settingsResult.data || []).forEach((setting) => {
        titles[setting.criterion] = setting.additional_title;
      });

      setAdditionalTitles(titles);

      setSelectedItemIds(
        (savedResult.data || []).map(
          (item) => Number(item.criterion_item_id)
        )
      );
    } catch (err) {
      if (!cancelled) {
        console.error("Lỗi tải tiêu chí:", err);
        alert(
          err instanceof Error
            ? err.message
            : "Không thể tải nội dung tiêu chí."
        );
      }
    } finally {
      if (!cancelled) setLoadingCriteria(false);
    }
  }

  loadCriterionData();

  return () => {
    cancelled = true;
  };
}, [file]);
  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    async function loadPreview() {
      try {
        setLoading(true);
        setError("");
        setPreviewUrl("");
        setPreviewText("");

        const response = await authFetch(url);

        if (!response.ok) {
          throw new Error("Không thể tải file minh chứng.");
        }

        const blob = await response.blob();
        const type =
          blob.type ||
          file.mime_type ||
          "application/octet-stream";

        if (cancelled) return;

        setMimeType(type);

        if (type.startsWith("text/")) {
          setPreviewText(await blob.text());
        } else {
          objectUrl = URL.createObjectURL(blob);
          setPreviewUrl(objectUrl);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể xem file."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, file]);

  async function handleSave() {
    const trimmedName = fileName.trim();

    if (!trimmedName) {
      alert("Vui lòng nhập tên file.");
      return;
    }

    setSaving(true);

   try {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("Bạn chưa đăng nhập.");

  const storageName = String(
    file.storage_name || file.name || ""
  );

  if (!storageName) {
    throw new Error("Không xác định được file minh chứng.");
  }

  // Xóa các lựa chọn cũ của file
  const { error: deleteError } = await supabase
    .from("sv5t_evidence_criteria")
    .delete()
    .eq("user_id", user.id)
    .eq("storage_name", storageName);

  if (deleteError) throw deleteError;

  // Lưu lại các nội dung đã tích
  if (selectedItemIds.length > 0) {
   const validSelectedIds = selectedItemIds.filter((itemId) =>
  criterionItems.some(
    (item) =>
      item.id === itemId &&
      item.criterion === currentCriterion
  )
);

const rows = validSelectedIds.map((itemId) => ({
      user_id: user.id,
      storage_name: storageName,
      criterion_item_id: itemId,
    }));

    const { error: insertError } = await supabase
      .from("sv5t_evidence_criteria")
      .insert(rows);

    if (insertError) throw insertError;
  }

  // Lưu tên file và nội dung báo cáo
  await onSave(trimmedName, content);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Không thể lưu thay đổi."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "12px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "950px",
          maxHeight: "94vh",
          overflowY: "auto",
          background: "white",
          borderRadius: "14px",
          padding: "20px",
          boxShadow: "0 10px 35px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "20px" }}>
            Chỉnh sửa minh chứng số{" "}
            {String(orderNumber).padStart(2, "0")}
          </h2>

          <button
            onClick={onClose}
            disabled={saving}
            style={{
              border: "none",
              background: "#f1f5f9",
              borderRadius: "8px",
              padding: "7px 12px",
              cursor: "pointer",
              fontSize: "18px",
            }}
          >
            ✕
          </button>
        </div>

        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "7px",
          }}
        >
          Tên file minh chứng
        </label>

        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          disabled={saving}
          placeholder="Nhập tên file..."
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px 12px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "15px",
            marginBottom: "18px",
            color: "#111827",
            background: "white",
          }}
        />

        <label
          style={{
            display: "block",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Nội dung báo cáo minh chứng
        </label>

        <ReportEditor
          value={content}
          onChange={setContent}
        />


{/* MENU TIÊU CHUẨN SV5T */}
<div style={{ marginTop: "24px" }}>
  <h3 style={{ margin: "0 0 12px", fontSize: "16px" }}>
    Nội dung đáp ứng
  </h3>

  {loadingCriteria ? (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <Spinner size={28} />
      <p style={{ color: "#64748b", fontSize: "13px" }}>
        Đang tải nội dung tiêu chuẩn...
      </p>
    </div>
  ) : !CRITERIA.some((item) => item.id === currentCriterion) ? (
    <div
      style={{
        padding: "14px",
        textAlign: "center",
        border: "1px dashed #cbd5e1",
        borderRadius: "9px",
        color: "#64748b",
        fontSize: "13px",
      }}
    >
      Không xác định được tiêu chí của thư mục minh chứng.
    </div>
  ) : (
    (() => {
      const criterion = CRITERIA.find(
        (item) => item.id === currentCriterion
      )!;

      const requiredItems = criterionItems.filter(
        (item) =>
          item.criterion === currentCriterion &&
          item.item_type === "required"
      );

      const additionalItems = criterionItems.filter(
        (item) =>
          item.criterion === currentCriterion &&
          item.item_type === "additional"
      );

      const additionalTitle =
        additionalTitles[currentCriterion] ||
        "Đạt thêm 1 trong các tiêu chí sau";

      return (
        <div
          style={{
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            overflow: "hidden",
            background: "#fff",
          }}
        >
          {/* HÀNG TIÊU CHÍ */}
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              setShowCriterionItems((prev) => !prev)
            }
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              padding: "15px",
              border: "none",
              background: showCriterionItems ? "#eff6ff" : "#fff",
              cursor: saving ? "not-allowed" : "pointer",
              textAlign: "left",
              color: "#1e293b",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            <span>
              {criterion.icon} {criterion.name}
            </span>

            <span
              style={{
                color: "#64748b",
                fontSize: "18px",
                transform: showCriterionItems
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              ▾
            </span>
          </button>

          {/* NỘI DUNG XỔ XUỐNG */}
          {showCriterionItems && (
            <div
              style={{
                padding: "14px",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              {/* TIÊU CHUẨN BẮT BUỘC */}
              <div style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#b91c1c",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                >
                  🔴 Tiêu chuẩn bắt buộc
                </div>

                {requiredItems.length > 0 ? (
                  requiredItems.map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "9px",
                        padding: "9px 0",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: saving ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        lineHeight: 1.6,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        disabled={saving}
                        onChange={(e) => {
                          setSelectedItemIds((prev) =>
                            e.target.checked
                              ? [...prev, item.id]
                              : prev.filter((id) => id !== item.id)
                          );
                        }}
                        style={{
                          marginTop: "4px",
                          width: "16px",
                          height: "16px",
                          flexShrink: 0,
                        }}
                      />
                      <span>{item.content}</span>
                    </label>
                  ))
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>
                    Chưa có nội dung bắt buộc.
                  </p>
                )}
              </div>

              {/* TIÊU CHUẨN ĐẠT THÊM */}
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    color: "#b45309",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                >
                  ⭐ {additionalTitle}
                </div>

                {additionalItems.length > 0 ? (
                  additionalItems.map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "9px",
                        padding: "9px 0",
                        borderBottom: "1px solid #f1f5f9",
                        cursor: saving ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        lineHeight: 1.6,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds.includes(item.id)}
                        disabled={saving}
                        onChange={(e) => {
                          setSelectedItemIds((prev) =>
                            e.target.checked
                              ? [...prev, item.id]
                              : prev.filter((id) => id !== item.id)
                          );
                        }}
                        style={{
                          marginTop: "4px",
                          width: "16px",
                          height: "16px",
                          flexShrink: 0,
                        }}
                      />
                      <span>{item.content}</span>
                    </label>
                  ))
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "13px" }}>
                    Chưa có nội dung đạt thêm.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      );
    })()
  )}
</div>


        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            minHeight: "300px",
            height: "55vh",
            overflow: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#f8fafc",
          }}
        >
          {loading ? (
            <Spinner size={34} />
          ) : error ? (
            <span style={{ color: "#b91c1c", padding: "20px" }}>
              {error}
            </span>
          ) : mimeType === "application/pdf" ? (
            <iframe
              src={previewUrl}
              title="Xem minh chứng"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          ) : mimeType.startsWith("image/") ? (
            <img
              src={previewUrl}
              alt="Minh chứng"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          ) : previewText ? (
            <pre
              style={{
                width: "100%",
                padding: "20px",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {previewText}
            </pre>
          ) : (
            <div style={{ padding: "20px", textAlign: "center" }}>
              Không hỗ trợ xem trực tiếp định dạng này.
              <br />
              <a
                href={previewUrl}
                download={file.display_name || file.storage_name}
                style={{ color: "#2563eb" }}
              >
                Tải file xuống
              </a>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "18px",
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: "9px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "white",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 18px",
              border: "none",
              borderRadius: "8px",
              background: "#2563eb",
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
