import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "storage", "uploads");
const RENDERS_DIR = path.join(process.cwd(), "storage", "renders");

// Maximum age for temporary files: 1 hour
const MAX_FILE_AGE_MS = 60 * 60 * 1000;

/** Ensure both storage directories exist */
export function ensureStorageDirs() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });
}

export function getUploadsDir() {
  return UPLOADS_DIR;
}

export function getRendersDir() {
  return RENDERS_DIR;
}

/** Save a File/Blob to the uploads directory, returns absolute path */
export async function saveUploadedFile(
  file: File,
  fileName: string
): Promise<string> {
  ensureStorageDirs();
  const filePath = path.join(UPLOADS_DIR, fileName);
  const arrayBuffer = await file.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
  return filePath;
}

/** Delete a file safely */
export function deleteFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // Ignore deletion errors
  }
}

/** Delete an array of files */
export function deleteFiles(filePaths: string[]) {
  filePaths.forEach(deleteFile);
}

/** Remove files older than MAX_FILE_AGE_MS from uploads and renders */
export function cleanupOldFiles() {
  const now = Date.now();
  for (const dir of [UPLOADS_DIR, RENDERS_DIR]) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === ".gitkeep") continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > MAX_FILE_AGE_MS) {
          fs.unlinkSync(filePath);
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

/** Safely resolve a render file path (prevents path traversal) */
export function safeRenderPath(fileName: string): string | null {
  // Only allow alphanumeric, hyphens, underscores, dots
  if (!/^[\w\-]+\.mp4$/.test(fileName)) return null;
  const filePath = path.join(RENDERS_DIR, fileName);
  // Ensure the resolved path is still inside RENDERS_DIR
  if (!filePath.startsWith(RENDERS_DIR)) return null;
  return filePath;
}
