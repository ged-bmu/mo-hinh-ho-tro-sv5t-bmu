import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

export async function GET(
  request: Request
) {
  try {
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
      "uu-tien": "Tiêu chuẩn ưu tiên",
    };

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
  .neq("role", "admin");

if (search) {
  query = query.or(
    `ho_ten.ilike.%${search}%,mssv.ilike.%${search}%,lop.ilike.%${search}%`
  );
}

const { data: students, error } =
  await query;
    if (error) throw error;

    let filteredStudents =
      students || [];
      

    // Lọc đạt
    if (filter === "passed") {
      filteredStudents =
        filteredStudents.filter(
          (sv: any) =>
            sv["dao-duc"] &&
            sv["hoc-tap"] &&
            sv["the-luc"] &&
            sv["tinh-nguyen"] &&
            sv["hoi-nhap"]
        );
    }

    // Lọc chưa đạt
    if (filter === "failed") {
      filteredStudents =
        filteredStudents.filter(
          (sv: any) =>
            !(
              sv["dao-duc"] &&
              sv["hoc-tap"] &&
              sv["the-luc"] &&
              sv["tinh-nguyen"] &&
              sv["hoi-nhap"]
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
        "Tiêu chuẩn ưu tiên",
      ].forEach((folderName) => {
        studentFolder?.folder(
          folderName
        );
      });

      const { data: files } =
        await supabase
          .from("uploaded_files")
          .select("*")
          .eq(
            "user_id",
            student.id
          );

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
          console.log(
            "DOWNLOAD ERROR:",
            path
          );
          continue;
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