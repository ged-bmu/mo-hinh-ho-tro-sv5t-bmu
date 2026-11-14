export function getStudentStudyYear(className?: string | null): number | null {
  const value = (className || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!value) return null;

  const newClass = value.match(/^(?:YTA|DDA|YK|DH|DD|YC)(\d{2})/);
  const oldClass = value.match(/^(\d{2})(?:DDA|YTA|YA|DA|ĐD|DD)/);
  const cohort = Number(newClass?.[1] ?? oldClass?.[1]);
  if (!Number.isFinite(cohort)) return null;

  const currentAcademicYear =
    new Date().getFullYear() - (new Date().getMonth() < 8 ? 1 : 0);
  const studyYear = currentAcademicYear - (2000 + cohort) + 1;
  if (studyYear < 1) return null;

  const duration = value.startsWith("YK") || /^(\d{2})YA/.test(value)
    ? 6
    : value.startsWith("DH") || /^(\d{2})DA/.test(value)
    ? 5
    : 4;

  return studyYear <= duration ? studyYear : null;
}
