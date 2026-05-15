import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(projectRoot, ".remotion", "bundle");

const serveUrl = await bundle({
  entryPoint: path.join(projectRoot, "src", "remotion", "index.ts"),
  outDir,
  onProgress: (progress) => {
    process.stdout.write(`\rRemotion bundle: ${progress}%`);
  },
});

console.log(`\nRemotion bundle ready at ${serveUrl}`);
