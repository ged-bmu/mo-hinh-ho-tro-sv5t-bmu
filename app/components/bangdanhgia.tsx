
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { authFetch } from "@/lib/auth-fetch";
import { supabase } from "@/lib/supabase";

type Criterion = {
  id: string;
  name: string;
  icon: string;
};

type CriterionItem = {
  id: number;
  academic_year_id: number;
  criterion: string;
  content: string;
  sort_order: number;
  item_type: "required" | "additional";
};

type Evaluation = {
  criterion_item_id: number;
  completion_percent: number;
  comment: string;
};

type EvidenceFile = {
  id: number;
  user_id: string;
  folder: string;
  storage_name: string;
  display_name: string;
  storage_type: string;
  drive_file_id: string | null;
  drive_url: string | null;
};

type Props = {
  studentId: string;
  academicYearId?: number | null;
};

const CRITERIA: Criterion[] = [
  { id: "dao-duc", name: "Đạo đức tốt", icon: "/icondaoduc.png" },
  { id: "hoc-tap", name: "Học tập tốt", icon: "/iconhoctap.png" },
  { id: "the-luc", name: "Thể lực tốt", icon: "/icontheluc.png" },
  { id: "tinh-nguyen", name: "Tình nguyện tốt", icon: "/icontinhnguyen.png" },
  { id: "hoi-nhap", name: "Hội nhập tốt", icon: "/iconhoinhap.png" },
  { id: "uu-tien", name: "Ưu tiên", icon: "/iconuutien.png" },
];

const DEFAULT_ADDITIONAL_TITLE =
  "Đạt 01 trong các tiêu chí sau";
  function calculateCriterionPercent(
  criterionId: string,
  items: CriterionItem[],
  evaluations: Record<number, Evaluation>
): number {
  const criterionItems = items.filter(
    (item) => item.criterion === criterionId
  );

  const requiredItems = criterionItems.filter(
    (item) => item.item_type === "required"
  );

  const additionalItems = criterionItems.filter(
    (item) => item.item_type === "additional"
  );

  let requiredScore = 0;

  if (requiredItems.length > 0) {
    const totalPercent = requiredItems.reduce(
      (sum, item) =>
        sum + (evaluations[item.id]?.completion_percent ?? 0),
      0
    );

    requiredScore =
      (totalPercent / requiredItems.length) * 0.5;
  }

  let additionalScore = 0;

  if (additionalItems.length > 0) {
    const maxPercent = Math.max(
      ...additionalItems.map(
        (item) =>
          evaluations[item.id]?.completion_percent ?? 0
      )
    );

    additionalScore = maxPercent * 0.5;
  }

  return Math.round(
    (requiredScore + additionalScore) * 100
  ) / 100;
}

export default function BangDanhGia({ studentId, academicYearId }: Props) {
  const [yearId, setYearId] = useState<number | null>(null);
  const [yearName, setYearName] = useState("");

  const [items, setItems] = useState<CriterionItem[]>([]);
  const [evaluations, setEvaluations] = useState<
    Record<number, Evaluation>
  >({});

  const [additionalTitles, setAdditionalTitles] = useState<
    Record<string, string>
  >({});

  // Minh chứng của từng ý tiêu chuẩn
  const [evidenceByItem, setEvidenceByItem] = useState<
    Record<number, EvidenceFile[]>
  >({});

  // Modal minh chứng
  const [selectedEvidenceItem, setSelectedEvidenceItem] =
    useState<CriterionItem | null>(null);

  const [previewFile, setPreviewFile] =
    useState<EvidenceFile | null>(null);

  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMimeType, setPreviewMimeType] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [hasChanges, setHasChanges] = useState(false);

const evaluationsRef = useRef(evaluations);
evaluationsRef.current = evaluations;
const syncCriteriaResults = useCallback(
  async (
    targetYearId: number,
    targetItems: CriterionItem[],
    targetEvaluations: Record<number, Evaluation>
  ) => {
    const result: Record<string, boolean> = {};

    CRITERIA
      .filter((criterion) => criterion.id !== "uu-tien")
      .forEach((criterion) => {
        result[criterion.id] =
          calculateCriterionPercent(
            criterion.id,
            targetItems,
            targetEvaluations
          ) >= 100;
      });

    const { error } = await supabase
      .from("student_criteria_results")
      .upsert(
        {
          user_id: studentId,
          academic_year_id: targetYearId,
          dao_duc: result["dao-duc"],
          hoc_tap: result["hoc-tap"],
          the_luc: result["the-luc"],
          tinh_nguyen: result["tinh-nguyen"],
          hoi_nhap: result["hoi-nhap"],
        },
        {
          onConflict: "user_id,academic_year_id",
        }
      );

    if (error) throw error;
  },
  [studentId]
);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

  // TẢI DỮ LIỆU
  useEffect(() => {
    if (!studentId) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");
      setSuccess("");

      try {
        // LẤY NĂM HỌC HIỆN TẠI
        const yearQuery = supabase
          .from("academic_years")
          .select("id, name");
        const { data: year, error: yearError } = academicYearId
          ? await yearQuery.eq("id", academicYearId).maybeSingle()
          : await yearQuery.eq("is_current", true).maybeSingle();

        if (yearError) throw yearError;

        if (!year) {
          throw new Error("Chưa có năm học hiện tại.");
        }

        if (cancelled) return;

        setYearId(year.id);
        setYearName(year.name);

        // LẤY NỘI DUNG, CÀI ĐẶT VÀ ĐÁNH GIÁ
        const [
          itemsResult,
          settingsResult,
          evaluationsResult,
        ] = await Promise.all([
          supabase
            .from("sv5t_criterion_items")
            .select("*")
            .eq("academic_year_id", year.id)
            .order("sort_order", { ascending: true })
            .order("id", { ascending: true }),

          supabase
            .from("sv5t_criterion_settings")
            .select("criterion, additional_title")
            .eq("academic_year_id", year.id),

          supabase
            .from("sv5t_student_criterion_evaluations")
            .select(
              "criterion_item_id, completion_percent, comment"
            )
            .eq("user_id", studentId)
            .eq("academic_year_id", year.id),
        ]);

        if (itemsResult.error) throw itemsResult.error;
        if (settingsResult.error) throw settingsResult.error;
        if (evaluationsResult.error) throw evaluationsResult.error;

        if (cancelled) return;

        const loadedItems =
          (itemsResult.data || []) as CriterionItem[];

        setItems(loadedItems);

        // LẤY TÊN NHÓM TIÊU CHÍ BỔ SUNG
        const titleMap: Record<string, string> = {};

        (settingsResult.data || []).forEach((setting) => {
          titleMap[setting.criterion] =
            setting.additional_title || DEFAULT_ADDITIONAL_TITLE;
        });

        setAdditionalTitles(titleMap);

        // LẤY ĐÁNH GIÁ
        const evaluationMap: Record<number, Evaluation> = {};

        (evaluationsResult.data || []).forEach((entry) => {
          evaluationMap[entry.criterion_item_id] = {
            criterion_item_id: entry.criterion_item_id,
            completion_percent: Number(
              entry.completion_percent ?? 0
            ),
            comment: entry.comment || "",
          };
        });

        await syncCriteriaResults(
  year.id,
  loadedItems,
  evaluationMap
);

        // LẤY DANH SÁCH LIÊN KẾT MINH CHỨNG VỚI Ý TIÊU CHUẨN
        const { data: evidenceLinks, error: evidenceError } =
          await supabase
            .from("sv5t_evidence_criteria")
            .select("criterion_item_id, storage_name")
            .eq("user_id", studentId);

        if (evidenceError) throw evidenceError;

        if (cancelled) return;

        const storageNames = [
          ...new Set(
            (evidenceLinks || [])
              .map((entry) => entry.storage_name)
              .filter(Boolean)
          ),
        ];

        let evidenceFiles: EvidenceFile[] = [];

        if (storageNames.length > 0) {
          const { data: files, error: filesError } =
            await supabase
              .from("uploaded_files")
              .select(
                "id, user_id, folder, storage_name, display_name, storage_type, drive_file_id, drive_url"
              )
              .eq("user_id", studentId)
              .eq("academic_year_id", year.id)
              .in("storage_name", storageNames);

          if (filesError) throw filesError;

          evidenceFiles = (files || []) as EvidenceFile[];
        }

        if (cancelled) return;

        // GHÉP FILE VỚI TỪNG Ý TIÊU CHUẨN
        const evidenceMap: Record<number, EvidenceFile[]> = {};

        (evidenceLinks || []).forEach((link) => {
          const file = evidenceFiles.find(
            (item) => item.storage_name === link.storage_name
          );

          if (!file) return;

          const itemId = Number(link.criterion_item_id);

          if (!evidenceMap[itemId]) {
            evidenceMap[itemId] = [];
          }

          // Không đếm trùng cùng một file
          const alreadyExists = evidenceMap[itemId].some(
            (item) => item.id === file.id
          );

          if (!alreadyExists) {
            evidenceMap[itemId].push(file);
          }
        });

        setEvidenceByItem(evidenceMap);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Không thể tải bảng đánh giá."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [studentId, academicYearId, syncCriteriaResults]);

  // LẤY GIÁ TRỊ ĐÁNH GIÁ CỦA MỘT Ý
  function getEvaluation(itemId: number): Evaluation {
    return (
      evaluations[itemId] || {
        criterion_item_id: itemId,
        completion_percent: 0,
        comment: "",
      }
    );
  }

  // CẬP NHẬT PHẦN TRĂM
function updatePercent(itemId: number, value: string) {
  const numberValue =
    value === ""
      ? 0
      : Math.min(100, Math.max(0, Number(value)));

  setEvaluations((prev) => ({
    ...prev,
    [itemId]: {
      ...(
        prev[itemId] || {
          criterion_item_id: itemId,
          completion_percent: 0,
          comment: "",
        }
      ),
      completion_percent: Number.isFinite(numberValue)
        ? numberValue
        : 0,
    },
  }));

  setHasChanges(true);
}

  // CẬP NHẬT NHẬN XÉT
function updateComment(itemId: number, value: string) {
  setEvaluations((prev) => ({
    ...prev,
    [itemId]: {
      ...(
        prev[itemId] || {
          criterion_item_id: itemId,
          completion_percent: 0,
          comment: "",
        }
      ),
      comment: value,
    },
  }));

  setHasChanges(true);
}

  // TÍNH PHẦN TRĂM TỪNG TIÊU CHÍ
  function calculateCriterion(criterionId: string): number {
    const criterionItems = items.filter(
      (item) => item.criterion === criterionId
    );

    const requiredItems = criterionItems.filter(
      (item) => item.item_type === "required"
    );

    const additionalItems = criterionItems.filter(
      (item) => item.item_type === "additional"
    );

    // BẮT BUỘC: 50%, CHIA ĐỀU CHO TẤT CẢ CÁC Ý
    let requiredScore = 0;

    if (requiredItems.length > 0) {
      const totalPercent = requiredItems.reduce(
        (sum, item) =>
          sum + getEvaluation(item.id).completion_percent,
        0
      );

      requiredScore =
        (totalPercent / requiredItems.length) * 0.5;
    }

    // BỔ SUNG: 50%, CHỈ LẤY MỨC CAO NHẤT
    let additionalScore = 0;

    if (additionalItems.length > 0) {
      const maxPercent = Math.max(
        ...additionalItems.map(
          (item) => getEvaluation(item.id).completion_percent
        )
      );

      additionalScore = maxPercent * 0.5;
    }

    return Math.round(
      (requiredScore + additionalScore) * 100
    ) / 100;
  }

  // TỔNG HỒ SƠ: TRUNG BÌNH 5 TIÊU CHÍ
  const totalPercent = useMemo(() => {
    const countedCriteria = CRITERIA.filter(
      (criterion) => criterion.id !== "uu-tien"
    );

    const total = countedCriteria.reduce(
      (sum, criterion) =>
        sum + calculateCriterion(criterion.id),
      0
    );

    return Math.round((total / 5) * 100) / 100;
  }, [items, evaluations]);

  // MỞ MODAL DANH SÁCH MINH CHỨNG
  function openEvidenceModal(item: CriterionItem) {
    setSelectedEvidenceItem(item);
    setPreviewFile(null);
    setPreviewUrl("");
    setPreviewText("");
    setPreviewError("");
  }

  // ĐÓNG MODAL
  function closeEvidenceModal() {
    setSelectedEvidenceItem(null);
    setPreviewFile(null);
    setPreviewUrl("");
    setPreviewText("");
    setPreviewError("");
  }

  // LẤY ĐƯỜNG DẪN FILE
  function getEvidenceUrl(file: EvidenceFile): string {
    if (file.storage_type === "google_drive") {
      let driveId = file.drive_file_id || "";

      if (!driveId && file.drive_url) {
        const match = file.drive_url.match(/\/d\/([^/]+)/);
        if (match) driveId = match[1];
      }

      if (!driveId) {
        throw new Error("Không tìm thấy ID file Google Drive.");
      }

      return `/api/view-drive?fileId=${encodeURIComponent(driveId)}`;
    }

    const { data } = supabase.storage
      .from("Ho so SV5T")
      .getPublicUrl(
        `${studentId}/${file.folder}/${file.storage_name}`
      );

    return data.publicUrl;
  }

  // XEM FILE TRONG MODAL
  async function handlePreview(file: EvidenceFile) {
    setPreviewFile(file);
    setPreviewUrl("");
    setPreviewText("");
    setPreviewMimeType("");
    setPreviewError("");
    setPreviewLoading(true);

    try {
      const fileUrl = getEvidenceUrl(file);
      const response = await authFetch(fileUrl);

      if (!response.ok) {
        throw new Error("Không thể tải file minh chứng.");
      }

      const blob = await response.blob();
      const mimeType =
        blob.type || "application/octet-stream";

      setPreviewMimeType(mimeType);

      if (mimeType.startsWith("text/")) {
        setPreviewText(await blob.text());
      } else {
        setPreviewUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      setPreviewError(
        err instanceof Error
          ? err.message
          : "Không thể xem file minh chứng."
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  // DỌN OBJECT URL KHI ĐỔI FILE HOẶC ĐÓNG MODAL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

// LƯU ĐÁNH GIÁ
const handleSave = useCallback(async () => {
  if (!yearId || !studentId || saving) return;

  const saveSnapshot = evaluations;

  setSaving(true);
  setError("");
  setSuccess("");

  try {
    const payload = items.map((item) => {
      const evaluation = saveSnapshot[item.id] || {
        criterion_item_id: item.id,
        completion_percent: 0,
        comment: "",
      };

      return {
        user_id: studentId,
        academic_year_id: yearId,
        criterion_item_id: item.id,
        completion_percent: evaluation.completion_percent,
        comment: evaluation.comment,
        updated_at: new Date().toISOString(),
      };
    });

    if (payload.length > 0) {
      const { error: saveError } = await supabase
        .from("sv5t_student_criterion_evaluations")
        .upsert(payload, {
          onConflict:
            "user_id,academic_year_id,criterion_item_id",
        });

      if (saveError) throw saveError;
      await syncCriteriaResults(
  yearId,
  items,
  saveSnapshot
);
    }

    // Chỉ đánh dấu đã lưu nếu không có chỉnh sửa mới trong lúc lưu
    if (
      JSON.stringify(evaluationsRef.current) ===
      JSON.stringify(saveSnapshot)
    ) {
      setHasChanges(false);
      setSuccess("Đã tự động lưu đánh giá.");
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Không thể lưu đánh giá."
    );
  } finally {
    setSaving(false);
  }
}, [
  yearId,
  studentId,
  items,
  evaluations,
  saving,
  syncCriteriaResults,
]);


// TỰ ĐỘNG LƯU SAU 1 GIÂY NGỪNG NHẬP
useEffect(() => {
  if (!hasChanges || loading || !yearId || !studentId || saving) {
    return;
  }

  const timer = setTimeout(() => {
    void handleSave();
  }, 1000);

  return () => clearTimeout(timer);
}, [
  hasChanges,
  loading,
  yearId,
  studentId,
  saving,
  evaluations,
  handleSave,
]);

  // LOADING
  if (loading) {
    return (
      <div className="bd-loading">
        <span className="bd-spinner" />
        <span>Đang tải bảng đánh giá...</span>
      </div>
    );
  }

  if (error && !yearId) {
    return <div className="bd-error">⚠️ {error}</div>;
  }

  // HIỂN THỊ MỘT DÒNG TIÊU CHUẨN
function renderItemRow(
  item: CriterionItem,
  index: number
) {
    const evidenceCount =
      evidenceByItem[item.id]?.length || 0;

    return (
      <tr key={item.id} className="bd-item-row">

        <td className="bd-content-cell">
          <span className="bd-item-number">
            {index + 1}.{" "}
          </span>
          {item.content}
        </td>

        <td className="bd-evidence-cell">
          {evidenceCount > 0 ? (
            <button
              type="button"
              className="bd-evidence-button"
              onClick={() => openEvidenceModal(item)}
              title="Xem minh chứng của ý này"
            >
              📎 {evidenceCount} minh chứng
            </button>
          ) : (
            <span className="bd-no-evidence">
              Chưa có
            </span>
          )}
        </td>

        <td className="bd-percent-cell">
          <div className="bd-percent-input">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={getEvaluation(item.id).completion_percent}
              onChange={(e) =>
                updatePercent(item.id, e.target.value)
              }
              aria-label={`Phần trăm hoàn thành ${item.content}`}
            />
            <span>%</span>
          </div>
        </td>

        <td className="bd-comment-cell">
          <textarea
            rows={2}
            value={getEvaluation(item.id).comment}
            onChange={(e) =>
              updateComment(item.id, e.target.value)
            }
            placeholder="Nhập nhận xét..."
          />
        </td>
      </tr>
    );
  }

  return (
    <section className="bd-container">
      {/* TỔNG QUAN */}
      <div className="bd-summary">
        <div>
          <span className="bd-eyebrow">
            KẾT QUẢ ĐÁNH GIÁ
          </span>
          <h2>Bảng đánh giá mức độ hoàn thành năm học {yearName}</h2>
        </div>

        <div className="bd-total">
          <span>Tổng hoàn thành hồ sơ</span>
          <strong>{totalPercent.toFixed(2)}%</strong>

          <div className="bd-progress">
            <div style={{ width: `${totalPercent}%` }} />
          </div>
        </div>
      </div>

      {error && <div className="bd-error">⚠️ {error}</div>}
      {success && <div className="bd-success">✓ {success}</div>}

      {/* BẢNG ĐÁNH GIÁ */}
      <div className="bd-table-wrap">
        <table className="bd-table">
          <thead>
            <tr>

              <th className="bd-col-content">
                Nội dung tiêu chuẩn
              </th>
              <th className="bd-col-evidence">Minh chứng</th>
              <th className="bd-col-percent">
                Hoàn thành (%)
              </th>
              <th className="bd-col-comment">Nhận xét</th>
            </tr>
          </thead>

          {CRITERIA.map((criterion) => {
            const criterionItems = items.filter(
              (item) => item.criterion === criterion.id
            );

            const requiredItems = criterionItems.filter(
              (item) => item.item_type === "required"
            );

            const additionalItems = criterionItems.filter(
              (item) => item.item_type === "additional"
            );

            const criterionPercent = calculateCriterion(
              criterion.id
            );

            return (
              <tbody key={criterion.id}>
                {/* DÒNG TIÊU CHÍ */}
                <tr className="bd-criterion-row">
                  <td colSpan={4}>
                    <div className="bd-criterion-heading">
                      <div className="bd-criterion-name">
                        <Image
                          src={criterion.icon}
                          width={32}
                          height={32}
                          alt={criterion.name}
                          className="bd-criterion-icon"
                        />
                        <strong>{criterion.name}</strong>

                        {criterion.id === "uu-tien" && (
                          <small>
                            Không tính tổng hồ sơ
                          </small>
                        )}
                      </div>

                      <div className="bd-criterion-result">
                        <span>Mức hoàn thành</span>
                        <strong>
                          {criterionPercent.toFixed(2)}%
                        </strong>
                      </div>
                    </div>
                  </td>
                </tr>

                {/* NHÓM BẮT BUỘC */}
                {requiredItems.length > 0 && (
                  <tr className="bd-group-row">
                    <td colSpan={4}>
                      <strong>
                        🔴 Tiêu chuẩn bắt buộc
                      </strong>
                    </td>
                  </tr>
                )}

                {requiredItems.map((item, index) =>
  renderItemRow(item, index)
)}

                {/* NHÓM BỔ SUNG */}
                {additionalItems.length > 0 && (
                  <>
                    <tr className="bd-group-row additional">
                      <td colSpan={4}>
                        <strong>
                          ⭐{" "}
                          {additionalTitles[criterion.id] ||
                            DEFAULT_ADDITIONAL_TITLE}
                        </strong>
                      </td>
                    </tr>

                    {additionalItems.map((item, index) =>
  renderItemRow(item, index)
)}
                  </>
                )}

                {criterionItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="bd-empty">
                      Chưa có nội dung tiêu chuẩn cho mục này.
                    </td>
                  </tr>
                )}

                {/* TỔNG KẾT TIÊU CHÍ */}
                <tr className="bd-criterion-footer">
                  <td colSpan={4}>
                  </td>
                </tr>
              </tbody>
            );
          })}
        </table>
      </div>

{/* TRẠNG THÁI TỰ ĐỘNG LƯU */}
<div className="bd-save-area">
  <div>
    <span>Tổng mức hoàn thành hồ sơ</span>
    <strong>{totalPercent.toFixed(2)}%</strong>
  </div>

  <div className="bd-autosave-status">
    {saving ? (
      <span>⏳ Đang tự động lưu...</span>
    ) : hasChanges ? (
      <span>● Đang chờ lưu thay đổi...</span>
    ) : (
      <span>✓ Đã lưu tự động</span>
    )}
  </div>
</div>

      {/* MODAL MINH CHỨNG */}
      {selectedEvidenceItem && (
        <div
          className="bd-modal-overlay"
          onClick={closeEvidenceModal}
        >
          <div
            className="bd-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bd-modal-header">
              <div>
                <h3>Minh chứng tiêu chuẩn</h3>
                <p>{selectedEvidenceItem.content}</p>
              </div>

              <button
                type="button"
                className="bd-modal-close"
                onClick={closeEvidenceModal}
              >
                ✕
              </button>
            </div>

            <div className="bd-modal-body">
              {!previewFile ? (
                <>
                  <div className="bd-evidence-list-title">
                    Danh sách minh chứng
                    <span>
                      {(
                        evidenceByItem[selectedEvidenceItem.id] ||
                        []
                      ).length}{" "}
                      file
                    </span>
                  </div>

                  {(
                    evidenceByItem[selectedEvidenceItem.id] ||
                    []
                  ).length > 0 ? (
                    <div className="bd-evidence-list">
                      {(
                        evidenceByItem[selectedEvidenceItem.id] ||
                        []
                      ).map((file, index) => (
                        <div
                          className="bd-evidence-file"
                          key={file.id}
                        >
                          <div className="bd-file-info">
                            <span className="bd-file-icon">
                              📄
                            </span>

                            <div>
                              <strong>
                                {file.display_name ||
                                  file.storage_name}
                              </strong>
                              <small>
                                Minh chứng số {index + 1}
                              </small>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handlePreview(file)
                            }
                          >
                            Xem minh chứng
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bd-modal-empty">
                      Chưa có minh chứng cho nội dung này.
                    </div>
                  )}
                </>
              ) : (
                <div className="bd-preview-area">
                  <div className="bd-preview-header">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewFile(null);
                        setPreviewUrl("");
                        setPreviewText("");
                        setPreviewError("");
                      }}
                    >
                      ← Quay lại danh sách
                    </button>

                    <strong>
                      {previewFile.display_name ||
                        previewFile.storage_name}
                    </strong>
                  </div>

                  <div className="bd-preview-content">
                    {previewLoading ? (
                      <div className="bd-preview-loading">
                        <span className="bd-spinner" />
                        Đang tải minh chứng...
                      </div>
                    ) : previewError ? (
                      <div className="bd-preview-error">
                        ⚠️ {previewError}
                      </div>
                    ) : previewMimeType ===
                      "application/pdf" ? (
                      <iframe
                        src={previewUrl}
                        title="Xem minh chứng PDF"
                      />
                    ) : previewMimeType.startsWith("image/") ? (
                      <img
                        src={previewUrl}
                        alt="Minh chứng"
                      />
                    ) : previewText ? (
                      <pre>{previewText}</pre>
                    ) : (
                      <div className="bd-preview-download">
                        <p>
                          Định dạng này không hỗ trợ xem trực tiếp.
                        </p>

                        <a
                          href={previewUrl}
                          download={
                            previewFile.display_name ||
                            previewFile.storage_name
                          }
                        >
                          Tải minh chứng xuống
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bd-modal-footer">
              <button
                type="button"
                onClick={closeEvidenceModal}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .bd-container {
  width: calc(100% - 40px);
  max-width: 1600px;
  margin: 32px auto;
  box-sizing: border-box;
  color: #172b4d;
  font-family: inherit;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: linear-gradient(145deg, #f8fbff 0%, #f0fdfa 100%);
  box-shadow: 0 18px 50px rgba(30, 64, 89, 0.09);
}

        .bd-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 28px 30px;
          border: 1px solid #dbeafe;
          border-radius: 20px;
          background: linear-gradient(120deg, #ffffff 0%, #eff6ff 58%, #ecfdf5 100%);
          box-shadow: 0 13px 28px rgba(37, 99, 235, 0.08);
          margin-bottom: 18px;
        }

        .bd-eyebrow {
          color: #2563eb;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .bd-summary h2 {
          margin: 7px 0;
          color: #172554;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.45;
        }

        .bd-summary p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
        }

        .bd-total {
          width: 220px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .bd-total > span,
        .bd-save-area > div > span {
          color: #64748b;
          font-size: 14px;
          font-weight: 700;
        }

        .bd-total strong {
          color: #059669;
          font-size: 30px;
          font-weight: 850;
          letter-spacing: -1px;
        }

        .bd-progress {
          height: 8px;
          overflow: hidden;
          border-radius: 20px;
          background: #e2e8f0;
        }

        .bd-progress div {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #10b981, #34d399);
          transition: width 0.2s;
        }

        .bd-total small {
          color: #94a3b8;
          font-size: 13px;
        }

        .bd-note {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 15px;
        }

        .bd-note > div {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 13px 15px;
          border: 1px solid #dbeafe;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 5px 16px rgba(30, 64, 89, 0.05);
        }

        .bd-note strong {
          font-size: 14px;
        }

        .bd-note span {
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .bd-table-wrap {
          width: 100%;
          overflow-x: auto;
          border: 1px solid #dbe3ee;
          border-radius: 18px;
          background: white;
          box-shadow: 0 13px 28px rgba(30, 64, 89, 0.07);
        }

        .bd-table {
          width: 100%;
          min-width: 1050px;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 14px;
          background: #fff;
        }

        .bd-table thead th {
          position: sticky;
          top: 0;
          z-index: 1;
          padding: 15px 14px;
          background: #172554;
          color: #fff;
          text-align: left;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .bd-col-content {
  width: 36%;
}

.bd-col-evidence {
  width: 17%;
}

.bd-col-percent {
  width: 16%;
}

.bd-col-comment {
  width: 31%;
}

        .bd-item-row td {
  padding: 13px 14px;
          background: #f1f5f9;
          color: #475569;
          text-align: left;
          font-weight: 800;
          border-bottom: 1px solid #e2e8f0;
        }
          .bd-evidence-cell,
.bd-percent-cell {
  text-align: center;
}

        .bd-criterion-row td {
          padding: 16px 17px;
          background: linear-gradient(90deg, #eaf2ff, #f1f7ff 70%, #f0fdfa);
          border-top: 1px solid #dbeafe;
          border-bottom: 1px solid #e2e8f0;
        }

        .bd-criterion-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 13px;
        }

        .bd-criterion-name {
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 14px;
          color: #1e3a8a;
        }

        .bd-criterion-icon {
          flex-shrink: 0;
          object-fit: contain;
          padding: 5px;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 3px 13px rgba(30, 64, 175, 0.12);
        }

        .bd-criterion-name small {
          padding: 4px 7px;
          border-radius: 5px;
          background: #f3e8ff;
          color: #7e22ce;
          font-size: 13px;
          font-weight: 700;
        }

        .bd-criterion-result {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #64748b;
          font-size: 13px;
        }

        .bd-criterion-result strong {
          color: #1d4ed8;
          font-size: 17px;
        }

        .bd-group-row td {
          padding: 13px 13px;
          background: linear-gradient(90deg, #fff7ed, #fffbeb);
          border-top: 1px solid #fed7aa;
          border-bottom: 1px solid #fed7aa;
        }

        .bd-group-row strong {
          display: block;
          color: #9a3412;
          font-size: 14px;
        }

        .bd-group-row span {
          display: block;
          margin-top: 3px;
          color: #9a3412;
          font-size: 13px;
        }

        .bd-group-row.additional td {
          background: #f5f3ff;
          border-color: #ddd6fe;
        }

        .bd-group-row.additional strong,
        .bd-group-row.additional span {
          color: #6d28d9;
        }

        .bd-item-row td {
          padding: 13px 14px;
          border-bottom: 1px solid #edf2f7;
          vertical-align: middle;
          transition: background 0.15s ease;
        }

        .bd-item-row:nth-of-type(even) td {
          background: #fbfdff;
        }

        .bd-item-row:hover td {
          background: #f0f9ff;
        }

        .bd-content-cell {
          color: #334155;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .bd-item-number {
          display: inline-block;
          margin-right: 6px;
          color: #2563eb;
          font-weight: 800;
        }

        .bd-evidence-cell {
          text-align: center;
        }

        .bd-evidence-button {
          border: 1px solid #bfdbfe;
          border-radius: 9px;
          padding: 8px 13px;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }

        .bd-evidence-button:hover {
          background: #bfdbfe;
          transform: translateY(-1px);
        }

        .bd-no-evidence {
          color: #94a3b8;
          font-size: 13px;
        }

       .bd-percent-input {
  display: flex;
  align-items: center;
  max-width: 113px;
  margin: 0 auto;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  overflow: hidden;
  background: white;
}

        .bd-percent-input:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px #dbeafe;
        }

        .bd-percent-input input {
          width: 100%;
          min-width: 0;
          padding: 9px 5px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #1e293b;
          font: inherit;
          text-align: center;
        }

        .bd-percent-input span {
          padding-right: 8px;
          color: #64748b;
        }

        .bd-comment-cell textarea {
          display: block;
          width: 100%;
          min-height: 42px;
          padding: 8px;
          resize: vertical;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          outline: 0;
          background: white;
          color: #334155;
          font: inherit;
          line-height: 1.5;
          box-sizing: border-box;
        }

        .bd-comment-cell textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px #dbeafe;
        }

        .bd-comment-cell textarea::placeholder {
          color: #a1aab8;
        }

        .bd-mobile-label {
          display: none;
        }

        .bd-empty {
          padding: 15px !important;
          color: #94a3b8;
          text-align: center;
        }

        .bd-criterion-footer td {
          padding: 13px 15px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 13px;
          text-align: right;
        }

        .bd-criterion-footer strong {
          margin-left: 15px;
          color: #15803d;
          font-size: 15px;
        }

        .bd-save-area {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 15px;
          padding: 19px 22px;
          border: 1px solid #bbf7d0;
          border-radius: 16px;
          background: linear-gradient(110deg, #fff, #f0fdf4);
          box-shadow: 0 8px 22px rgba(5, 150, 105, 0.08);
        }

        .bd-save-area > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .bd-save-area > div > strong {
          color: #15803d;
          font-size: 23px;
        }

        .bd-save-area button {
          padding: 13px 19px;
          border: 0;
          border-radius: 13px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.22);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .bd-save-area button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.3);
        }

        .bd-save-area button:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* MODAL */
        .bd-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
          background: rgba(15, 23, 42, 0.65);
        }

        .bd-modal {
          width: 100%;
          max-width: 850px;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: 18px;
          background: white;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
        }

        .bd-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding: 18px 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .bd-modal-header h3 {
          margin: 0 0 7px;
          color: #1e293b;
          font-size: 18px;
        }

        .bd-modal-header p {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }

        .bd-modal-close {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          background: #f1f5f9;
          color: #475569;
          font-size: 17px;
          cursor: pointer;
        }

        .bd-modal-body {
          min-height: 180px;
          overflow-y: auto;
          padding: 18px 20px;
        }

        .bd-evidence-list-title {
          display: flex;
          justify-content: space-between;
          gap: 13px;
          margin-bottom: 14px;
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }

        .bd-evidence-list-title span {
          color: #64748b;
          font-weight: 500;
        }

        .bd-evidence-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .bd-evidence-file {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #fff;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .bd-evidence-file:hover {
          border-color: #93c5fd;
          box-shadow: 0 5px 15px rgba(37, 99, 235, 0.08);
        }

        .bd-file-info {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .bd-file-icon {
          font-size: 23px;
        }

        .bd-file-info > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .bd-file-info strong {
          overflow-wrap: anywhere;
          color: #334155;
          font-size: 14px;
        }

        .bd-file-info small {
          color: #94a3b8;
          font-size: 13px;
        }

        .bd-evidence-file > button {
          flex-shrink: 0;
          padding: 8px 13px;
          border: 0;
          border-radius: 7px;
          background: #2563eb;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .bd-modal-empty {
          padding: 35px 15px;
          border: 1px dashed #cbd5e1;
          border-radius: 9px;
          color: #94a3b8;
          text-align: center;
          font-size: 13px;
        }

        .bd-preview-area {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .bd-preview-header {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .bd-preview-header button {
          padding: 7px 13px;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          background: white;
          color: #2563eb;
          font-size: 13px;
          cursor: pointer;
        }

        .bd-preview-header strong {
          color: #334155;
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .bd-preview-content {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 350px;
          height: 55vh;
          max-height: 600px;
          overflow: auto;
          border: 1px solid #e2e8f0;
          border-radius: 9px;
          background: #f8fafc;
        }

        .bd-preview-content iframe {
          width: 100%;
          height: 100%;
          min-height: 350px;
          border: 0;
          background: white;
        }

        .bd-preview-content img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .bd-preview-content pre {
          width: 100%;
          padding: 18px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          color: #334155;
          font-size: 14px;
        }

        .bd-preview-loading {
          display: flex;
          align-items: center;
          gap: 13px;
          color: #64748b;
          font-size: 14px;
        }

        .bd-preview-error {
          padding: 20px;
          color: #b91c1c;
          font-size: 13px;
        }

        .bd-preview-download {
          padding: 25px;
          text-align: center;
          color: #64748b;
          font-size: 13px;
        }

        .bd-preview-download a {
          display: inline-block;
          margin-top: 13px;
          color: #2563eb;
          font-weight: 700;
        }

        .bd-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 13px 20px;
          border-top: 1px solid #e2e8f0;
        }

        .bd-modal-footer button {
          padding: 9px 18px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          color: #475569;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .bd-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 13px;
          min-height: 150px;
          color: #64748b;
          font-size: 13px;
        }

        .bd-spinner {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          border: 3px solid #dbeafe;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: bdSpin 0.7s linear infinite;
        }

        .bd-error,
        .bd-success {
          padding: 14px 14px;
          margin-bottom: 14px;
          border-radius: 8px;
          font-size: 14px;
        }

        .bd-error {
          background: #fef2f2;
          color: #b91c1c;
        }

        .bd-success {
          background: #f0fdf4;
          color: #15803d;
        }

        @keyframes bdSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 650px) {
          .bd-container {
            padding: 14px;
            border-radius: 17px;
          }

          .bd-summary {
            flex-direction: column;
            align-items: stretch;
            padding: 19px;
            border-radius: 16px;
          }

          .bd-summary h2 {
            font-size: 17px;
          }

          .bd-total {
            width: 100%;
          }

          .bd-note {
            grid-template-columns: 1fr;
          }

          .bd-save-area {
            align-items: stretch;
            flex-direction: column;
          }

          .bd-save-area button {
            width: 100%;
          }

          .bd-modal-overlay {
            padding: 8px;
          }

          .bd-modal {
            max-height: 96vh;
          }

          .bd-modal-header,
          .bd-modal-body {
            padding: 14px;
          }

          .bd-evidence-file {
            align-items: flex-start;
          }

          .bd-evidence-file > button {
            white-space: nowrap;
          }

          .bd-preview-content {
            height: 55vh;
            min-height: 280px;
          }
        }
          @media (max-width: 650px) {
  .bd-container {
    width: calc(100% - 20px);
    margin: 15px auto;
  }
}
      `}</style>
    </section>
  );
}
