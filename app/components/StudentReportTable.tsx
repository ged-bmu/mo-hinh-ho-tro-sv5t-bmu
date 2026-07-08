"use client";

type Props = {
  profile: any;
  reports: any[];
  criteriaList: any[];
};

export default function StudentReportTable({
  profile,
  reports,
  criteriaList,
}: Props) {
  return (
    <table
      style={{
        width: "100%",
        tableLayout: "fixed",
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr>
          <th
            style={{
              width: "280px",
              border: "1px solid #cbd5e1",
              background: "#eff6ff",
              padding: "14px 10px",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Thông tin sinh viên
          </th>

          {criteriaList.map((item) => (
            <th
              key={item.key}
              style={{
                border: "1px solid #cbd5e1",
                background: "#eff6ff",
                padding: "14px 10px",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {item.title}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        <tr>
          <td
            style={{
              border: "1px solid #cbd5e1",
              padding: "16px",
              verticalAlign: "top",
              lineHeight: "1.6",
              fontSize: "15px",
            }}
          >
            <div>
              <b>Họ và tên:</b> {profile?.ho_ten}
            </div>

            <div>
              <b>MSSV:</b> {profile?.mssv}
            </div>

            <div>
              <b>Nam/Nữ:</b>
            </div>

            <div>
              <b>Năm sinh:</b>
            </div>

            <div>
              <b>Dân tộc:</b>
            </div>

            <div>
              <b>Sinh viên năm thứ:</b>
            </div>

            <div>
              <b>Lớp:</b> {profile?.lop}, Trường Đại học Y Dược Buôn Ma Thuột
            </div>

            <div>
              <b>Chức vụ Đoàn - Hội:</b>
            </div>

            <div>
              <b>Đảng viên/Đoàn viên:</b>
            </div>

            <div>
              <b>Số điện thoại:</b>
            </div>

            <div>
              <b>Email:</b> {profile?.email}
            </div>
          </td>

          {criteriaList.map((item) => {
            const report = reports.find(
              (r) => r.criteria === item.key
            );

            return (
              <td
                key={item.key}
                style={{
                  border: "1px solid #cbd5e1",
                  verticalAlign: "top",
                  padding: "10px",
                }}
              >
                <div
                  style={{
                    minHeight: "300px",
                    lineHeight: "1.6",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                  }}
                  dangerouslySetInnerHTML={{
                    __html: report?.content || "",
                  }}
                />
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  );
}