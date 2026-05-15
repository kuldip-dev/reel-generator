import { v4 as uuidv4 } from "uuid";
import {
  saveUploadedFile,
  deleteFiles,
  cleanupOldFiles,
} from "@/lib/fileUtils";
import {
  validateVideoFormData,
  type Effect,
  type BackgroundStyle,
  type TextOverlayConfig,
} from "@/lib/validation";
import { renderReelVideo } from "@/lib/renderVideo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  cleanupOldFiles();

  let uploadedFilePaths: string[] = [];

  try {
    const formData = await request.formData();

    // Collect uploaded image files
    const imageFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === "images" && value instanceof File) {
        imageFiles.push(value);
      }
    }

    const backgroundStyle =
      (formData.get("backgroundStyle") as BackgroundStyle) || "blur";
    const durationPerImage = parseFloat(
      (formData.get("durationPerImage") as string) || "3"
    );

    // Parse per-image effects sent as a JSON array string
    let effects: Effect[] = [];
    try {
      const raw = formData.get("effects") as string;
      effects = JSON.parse(raw);
    } catch {
      effects = imageFiles.map(() => "fade" as Effect);
    }

    // Parse per-image overlays sent as a JSON array string
    let overlays: TextOverlayConfig[] = [];
    try {
      const raw = formData.get("overlays") as string;
      if (raw) overlays = JSON.parse(raw);
    } catch {
      overlays = [];
    }

    // Validate
    const validation = validateVideoFormData({
      images: imageFiles,
      overlays,
      effects,
      durationPerImage,
      backgroundStyle,
    });

    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    // Save uploaded files temporarily
    const sessionId = uuidv4();
    const savedPaths: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const ext = file.name.split(".").pop() ?? "jpg";
      const savedPath = await saveUploadedFile(
        file,
        `${sessionId}-${i}.${ext}`
      );
      savedPaths.push(savedPath);
    }

    uploadedFilePaths = savedPaths;

    const outputFileName = `${sessionId}.mp4`;

    await renderReelVideo({
      images: savedPaths,
      overlays,
      effects,
      durationPerImage,
      backgroundStyle,
      outputFileName,
    });

    // Delete source images — render is complete
    deleteFiles(uploadedFilePaths);
    uploadedFilePaths = [];

    return Response.json({
      success: true,
      downloadUrl: `/api/download/${outputFileName}`,
      fileName: outputFileName,
    });
  } catch (err) {
    if (uploadedFilePaths.length > 0) deleteFiles(uploadedFilePaths);
    console.error("[generate-video] Error:", err);
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return Response.json({ error: message }, { status: 500 });
  }
}
