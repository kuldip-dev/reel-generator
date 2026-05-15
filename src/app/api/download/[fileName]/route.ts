import fs from "fs";
import { safeRenderPath, deleteFile } from "@/lib/fileUtils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const { fileName } = await params;

  // Validate and resolve path safely (prevents path traversal)
  const filePath = safeRenderPath(fileName);

  if (!filePath) {
    return new Response("Invalid file name.", { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return new Response("File not found or already downloaded.", { status: 404 });
  }

  // Read the entire file into memory first, then delete it from disk.
  // This way the user gets their download even if the deletion fails,
  // and we don't leave temporary files behind.
  const fileBuffer = fs.readFileSync(filePath);

  // Delete the render file now that it is buffered — no need to keep it
  deleteFile(filePath);

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": fileBuffer.byteLength.toString(),
      "Cache-Control": "no-store",
    },
  });
}
