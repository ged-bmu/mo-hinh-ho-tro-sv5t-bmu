import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { google } from "googleapis";
import { requireAdmin } from "@/lib/auth-admin";

async function downloadFileBuffer(
  supabase: any,
  file: any,
  userId: string
): Promise<Buffer | null> {
  if (file?.storage_type === "google_drive") {
    const driveUrl = typeof file?.drive_url === "string" ? file.drive_url : "";
    const fileId =
      file?.drive_file_id ||
      driveUrl.match(/\/file\/d\/([^/]+)/)?.[1] ||
      driveUrl.match(/[?&]id=([^&]+)/)?.[1];

    if (!fileId) {
      return null;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error("Thiếu cấu hình Google Drive để xuất file");
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    const raw = response.data as ArrayBuffer | Buffer | string | undefined;
    if (!raw) return null;

    return Buffer.isBuffer(raw) ? raw : Buffer.from(raw as ArrayBuffer);
  }

  if (!file?.storage_name) {
    return null;
  }

  const storagePath = `${userId}/${file.folder}/${file.storage_name}`;
  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("Ho so SV5T")
    .download(storagePath);

  if (downloadError || !fileBlob) {
    return null;
  }

  return Buffer.from(await fileBlob.arrayBuffer());
}

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
          .select(
            "id, folder, storage_name, display_name, file_name, storage_type, drive_file_id, drive_url"
          )
          .eq("user_id", student.id);

      if (filesError) throw filesError;

      for (const file of files || []) {
        try {
          const buffer = await downloadFileBuffer(supabase, file, student.id);

          if (!buffer) {
            continue;
          }

          const folderName =
            folderNames[file.folder] || file.folder;

          const safeDisplayName = (file.display_name || file.storage_name || file.file_name || "file")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\\/:*?"<>|]/g, "_");

          if (file.folder === "bao-cao") {
            studentFolder?.file("Báo cáo SV5T cấp Trường.pdf", buffer);
          } else {
            studentFolder
              ?.folder(folderName)
              ?.file(safeDisplayName, buffer);
          }
        } catch (error) {
          console.error("EXPORT ALL FILE FAILED:", {
            studentId: student.id,
            fileId: file?.id,
            folder: file?.folder,
            error: error instanceof Error ? error.message : String(error),
          });
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