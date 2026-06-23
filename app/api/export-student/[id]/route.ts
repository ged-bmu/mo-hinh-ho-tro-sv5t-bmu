import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: files, error } = await supabase
      .from("uploaded_files")
      .select("*")
      .eq("user_id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      );
    }

    const zip = new JSZip();

    const folderNames: Record<string, string> = {
      "dao-duc": "Đạo đức tốt",
      "hoc-tap": "Học tập tốt",
      "the-luc": "Thể lực tốt",
      "tinh-nguyen": "Tình nguyện tốt",
      "hoi-nhap": "Hội nhập tốt",
      "uu-tien": "Tiêu chuẩn ưu tiên",
    };

    // luôn tạo sẵn folder
    Object.values(folderNames).forEach((folderName) => {
      zip.folder(folderName);
    });

    for (const file of files || []) {
      const path =
        `${id}/${file.folder}/${file.storage_name}`;
console.log("TRY:", path);
      const {
        data: fileBlob,
        error: downloadError,
      } = await supabase.storage
        .from("Ho so SV5T")
        .download(path);

  if (downloadError || !fileBlob) {
  console.log(
    "DOWNLOAD FAILED",
    {
      path,
      downloadError,
      hasBlob: !!fileBlob,
    }
  );

  continue;
}

      const buffer =
        await fileBlob.arrayBuffer();

      const folderName =
        folderNames[file.folder] ||
        file.folder;

      let fileName =
        file.display_name;

      if (file.folder === "bao-cao") {
  zip.file(
    "Báo cáo SV5T cấp Trường.pdf",
    buffer
  );

  continue;
}

      console.log(
        "ADD FILE:",
        folderName,
        fileName
      );

      zip
        .folder(folderName)
        ?.file(
          fileName,
          buffer
        );
    }

    const zipFile =
  await zip.generateAsync({
    type: "blob",
  });


    const { data: profile } =
      await supabase
        .from("profiles")
        .select(
          "ho_ten, lop, mssv"
        )
        .eq("id", id)
        .single();

    const safeZipName =
      `${profile?.ho_ten || "SinhVien"}-${profile?.lop || ""}-${profile?.mssv || id}.zip`
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .replaceAll(" ", "_");

   return new Response(
  zipFile,
  {
    headers: {
      "Content-Type":
        "application/zip",
      "Content-Disposition":
        `attachment; filename="${safeZipName}"`,
    },
  }
);
  } catch (err) {
    console.log(err);

    return NextResponse.json(
      {
        success: false,
        error: String(err),
      },
      { status: 500 }
    );
  }
}