import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { requireAdmin } from "@/lib/auth-admin";

export const runtime = "nodejs";

export async function GET(
  request: Request
) {
  try {
    const { error: authError } = await requireAdmin(request);

    if (authError) return authError;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } =
      new URL(request.url);

    const filter =
      searchParams.get("filter");

      const search =
  searchParams.get("search") || "";
  
    const zip = new JSZip();

    const folderNames: Record<
      string,
      string
    > = {
      "dao-duc": "Đạo đức tốt",
      "hoc-tap": "Học tập tốt",
      "the-luc": "Thể lực tốt",
      "tinh-nguyen": "Tình nguyện tốt",
      "hoi-nhap": "Hội nhập tốt",
      "uu-tien": "Thành tích khác",
    };

    const pageSize = 100;
    let offset = 0;
    let exportedStudentCount = 0;

    while (true) {
      let query = supabase
        .from("profiles")
        .select(`
          id,
          ho_ten,
          lop,
          mssv,
          "dao-duc",
          "hoc-tap",
          "the-luc",
          "tinh-nguyen",
          "hoi-nhap"
        `)
        .neq("role", "admin")
        .range(offset, offset + pageSize - 1);

      if (search) {
        const safeSearch = search.replace(/[.,()]/g, " ").trim();
        query = query.or(
          `ho_ten.ilike.%${safeSearch}%,mssv.ilike.%${safeSearch}%,lop.ilike.%${safeSearch}%`
        );
      }

      const { data: students, error } = await query;
      if (error) throw error;

      let filteredStudents = students || [];

      if (filter === "passed") {
        filteredStudents = filteredStudents.filter(
          (student) =>
            student["dao-duc"] &&
            student["hoc-tap"] &&
            student["the-luc"] &&
            student["tinh-nguyen"] &&
            student["hoi-nhap"]
        );
      }

      if (filter === "failed") {
        filteredStudents = filteredStudents.filter(
          (student) =>
            !(
              student["dao-duc"] &&
              student["hoc-tap"] &&
              student["the-luc"] &&
              student["tinh-nguyen"] &&
              student["hoi-nhap"]
            )
        );
      }

      for (const student of filteredStudents) {

  const classFolder =
    zip.folder(student.lop);

  const studentFolderName =
    `${student.ho_ten}-${student.mssv}`;

  const studentFolder =
    classFolder?.folder(studentFolderName);

      [
        "Đạo đức tốt",
        "Học tập tốt",
        "Thể lực tốt",
        "Tình nguyện tốt",
        "Hội nhập tốt",
        "Thành tích khác",
      ].forEach((folderName) => {
        studentFolder?.folder(
          folderName
        );
      });

      const { data: files, error: filesError } =
        await supabase
          .from("uploaded_files")
          .select("folder, storage_name, display_name")
          .eq("user_id", student.id);

      if (filesError) throw filesError;

      for (const file of files || []) {
        const path =
          `${student.id}/${file.folder}/${file.storage_name}`;

        const {
          data: fileBlob,
          error: downloadError,
        } = await supabase.storage
          .from("Ho so SV5T")
          .download(path);

        if (
          downloadError ||
          !fileBlob
        ) {
          throw downloadError || new Error(`Không tìm thấy file: ${path}`);
        }

        const buffer =
          await fileBlob.arrayBuffer();

        const folderName =
          folderNames[
            file.folder
          ] || file.folder;

        // Báo cáo để ngoài
        if (
          file.folder ===
          "bao-cao"
        ) {
          studentFolder?.file(
            "Báo cáo SV5T cấp Trường.pdf",
            buffer
          );
        } else {
          studentFolder
            ?.folder(folderName)
            ?.file(
              file.display_name,
              buffer
            );
        }
      }

      exportedStudentCount += 1;
    }

      if (!students || students.length < pageSize) break;
      offset += pageSize;
    }

    const zipFile =
      await zip.generateAsync({
        type: "blob",
      });

    return new Response(zipFile, {
      headers: {
        "Content-Type":
          "application/zip",
        "Content-Disposition":
          'attachment; filename="Ho-So-SV5T.zip"',
        "X-Exported-Students": String(exportedStudentCount),
      },
    });
  } catch (err) {
    console.log(err);

    return Response.json(
      {
        success: false,
        error: String(err),
      },
      {
        status: 500,
      }
    );
  }
}