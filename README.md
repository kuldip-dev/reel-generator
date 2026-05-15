# Reel Generator — Image to Video (Local MVP)

Generate **9:16 reel-format MP4 videos** from a set of uploaded images, powered by **Remotion** and **Next.js 16 App Router**.

---

## Features

- Upload 1–10 images (JPEG, PNG, WebP, GIF)
- Drag-to-reorder image sequence
- In-browser 9:16 image cropper (non-destructive — original preserved for re-crops)
- **20 animation effects**, assignable per-image or all at once
- Configurable duration per image (1, 2, 3, 4, 5, 6, 8, or 10 seconds)
- 1080 × 1920 resolution at 30 fps
- One-click MP4 download
- Browser "Leave site?" guard when a rendered video is waiting for download
- Automatic cleanup of temporary files
- 

---

## Animation Effects

| Effect | Effect | Effect | Effect |
|---|---|---|---|
| Fade In/Out | Zoom In | Zoom Out | Ken Burns |
| Slide Up | Slide Down | Slide Left | Slide Right |
| Scale Pop | Blur to Focus | Focus to Blur | Rotate In |
| 3D Flip | Parallax | Pan Left→Right | Pan Right→Left |
| Cross Dissolve | Wipe | Camera Flash | Glitch |

---

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | ≥ 18.x | Required by Remotion renderer |
| npm | ≥ 9 | |
| **FFmpeg** | any recent | **Must be installed and on `$PATH`** |

### Install FFmpeg

```bash
# macOS (Homebrew)
brew install ffmpeg

# Ubuntu / Debian
sudo apt-get install ffmpeg

# Windows — download from https://ffmpeg.org/download.html
```

Verify it is available:

```bash
ffmpeg -version
```

---

## Setup & Run

```bash
# 1. Clone / open the project
cd image-reel-video-genrator

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use

1. **Upload images** — drag & drop or click the upload area (up to 10). JPEG, PNG, WebP, and GIF are accepted.
2. **Crop** — click the crop button (✂) on any thumbnail to trim it to 9:16. The original is preserved so you can re-crop at any time.
3. **Reorder** — drag the thumbnails to set the playback sequence.
4. **Effects** — use "Apply to All" to set one effect for every image, or pick a different effect for each image individually.
5. **Duration** — choose how many seconds each image shows (1 – 10 s).
6. **Generate** — click "Generate Reel Video" and wait. Rendering happens locally; an animated progress bar is shown while it runs.
7. **Download** — click "Download MP4" when the render is complete. The file is deleted from the server after download.

---

## Project Structure

```
src/
  app/
    page.tsx                        ← Single-page UI (upload → effects → generate)
    layout.tsx                      ← Root layout
    globals.css                     ← Global styles
    api/
      generate-video/route.ts       ← POST: accept form data, render video
      download/[fileName]/route.ts  ← GET: serve the rendered MP4
  components/
    ImageUploader.tsx               ← Drag-drop upload, thumbnail reorder, crop trigger
    ImageCropper.tsx                ← 9:16 crop modal (react-easy-crop, canvas output)
    EffectSelector.tsx              ← Per-image & "apply to all" effect dropdowns + duration picker
    GenerateButton.tsx              ← Animated generate button
    VideoForm.tsx                   ← Title / subtitle text overlay inputs (API-ready)
  remotion/
    index.ts                        ← Remotion entry (registerRoot)
    Root.tsx                        ← Composition registry
    compositions/
      ReelFromImages.tsx            ← Main 9:16 composition with all 20 inline effects
    effects/
      FadeEffect.tsx
      ZoomEffect.tsx
      SlideEffect.tsx
      KenBurnsEffect.tsx
  lib/
    fileUtils.ts                    ← File I/O helpers + cleanup
    validation.ts                   ← Effect types, BackgroundStyle types, form validation
    renderVideo.ts                  ← Remotion bundle + renderMedia wrapper

storage/
  uploads/   ← Temporary uploaded images (auto-cleaned after render)
  renders/   ← Temporary rendered MP4s (auto-cleaned after 1 hour)
```

---

## Tech Stack

| Package | Version | Role |
|---|---|---|
| Next.js | 16.2.6 | App framework (App Router) |
| React | 19 | UI |
| Remotion | ^4.0 | Video composition & rendering |
| @remotion/renderer | ^4.0 | Server-side `renderMedia()` |
| @remotion/bundler | ^4.0 | Webpack bundle for Remotion compositions |
| react-easy-crop | ^5 | In-browser image cropper |
| react-select | ^5 | Searchable effect dropdown |
| Tailwind CSS | ^4 | Styling |
| uuid | ^14 | Unique render file names |

---

## Configuration

All validation constants live in `src/lib/validation.ts`:

| Constant | Default | Description |
|---|---|---|
| `MAX_IMAGES` | 10 | Max number of images |
| `MAX_FILE_SIZE_BYTES` | 10 MB | Max size per image |
| `MIN_DURATION` | 1 s | Min duration per image |
| `MAX_DURATION` | 10 s | Max duration per image |
| `VALID_EFFECTS` | 20 entries | All accepted effect values |
| `VALID_BACKGROUNDS` | `blur`, `solid`, `gradient` | Accepted background styles |

Temporary file TTL is set in `src/lib/fileUtils.ts` (`MAX_FILE_AGE_MS`, default 1 hour).

---

## Technical Notes

- **Bundling**: Remotion bundles the composition once per server process and caches the result. Subsequent renders reuse the same bundle.
- **Rendering**: Uses `@remotion/renderer`'s `renderMedia()` which calls FFmpeg internally.
- **Cropping**: Crops are applied client-side via Canvas before upload. The original file object is retained in the uploader so the cropper can be reopened at any time without quality loss.
- **Per-image effects**: The `effects` array sent to the API must have the same length as the `images` array. The `EffectSelector` keeps them in sync automatically.
- **Background style**: Currently fixed to `blur` (blurred, darkened, and saturated copy of the image fills the 9:16 background). The `blur`, `solid`, and `gradient` styles are all implemented in the composition and can be exposed via the form.
- **No permanent storage**: Uploads are deleted immediately after rendering. Rendered files are cleaned up on the next request after they exceed the TTL.
- **No authentication, database, or cloud services** are used.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "FFmpeg not found" | Install FFmpeg and ensure it is on `$PATH` |
| Generation timeout | Reduce image count or duration per image |
| "Invalid file name" error | Only `.mp4` files with safe characters are served |
| Blank video / black frames | Ensure image paths are accessible during render |
| Crop result looks wrong | Re-open the cropper — it always reloads from the original file |
