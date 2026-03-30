"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import { API_ROUTES } from "@/lib/routes";

type FFmpegProgressPayload = {
  progress: number;
};

type UploadFormProps = {
  onUploaded: () => Promise<void>;
  uploadLimit: number | null;
  uploadsRemaining: number | null;
};

const COMPRESSION_TIMEOUT_MS = 45_000;
const TARGET_BITRATE = process.env.NEXT_PUBLIC_UPLOAD_BITRATE || "128k";
const ALLOWED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/flac",
]);

export function UploadForm({ onUploaded, uploadLimit, uploadsRemaining }: UploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [details, setDetails] = useState<string | null>(null);

  async function getFfmpeg(onProgress?: (p: number) => void) {
    if (!ffmpegRef.current) {
      if (typeof window === "undefined") {
        return null;
      }

      const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
        import("@ffmpeg/ffmpeg"),
        import("@ffmpeg/util"),
      ]);

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd";
      const ffmpeg = new FFmpeg();

      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        if (onProgress) {
          onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
        }
      });

      const didLoad = await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, "text/javascript"),
      });
      if (!didLoad) {
        // no-op: ffmpeg core was already initialized for this instance
      }

      ffmpegRef.current = ffmpeg;
    }

    return ffmpegRef.current;
  }

  async function compressTo128(file: File, onProgress?: (p: number) => void): Promise<File> {
    try {
      const ffmpeg = await getFfmpeg(onProgress);
      if (!ffmpeg) {
        return file;
      }

      const originalName = file.name;
      const inputName = `input.${originalName.split(".").pop() ?? "bin"}`;
      const outputName = "output.mp3";

      await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));

      await ffmpeg.exec([
        "-i",
        inputName,
        "-vn",
        "-b:a",
        TARGET_BITRATE,
        "-ar",
        "44100",
        "-ac",
        "2",
        outputName,
      ]);

      const outData = await ffmpeg.readFile(outputName);
      const normalized =
        outData instanceof Uint8Array
          ? outData
          : new TextEncoder().encode(String(outData));
      const blob = new Blob([normalized.buffer as ArrayBuffer], { type: "audio/mpeg" });
      const compressedFile = new File([blob], originalName.replace(/\.[^.]+$/, "") + ".mp3", { type: "audio/mpeg" });

      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch {}

      return compressedFile;
    } catch {
      return file;
    }
  }

  async function compressTo128WithTimeout(file: File, onProgress?: (p: number) => void): Promise<File> {
    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      const timeoutPromise = new Promise<File>((resolve) => {
        timer = setTimeout(() => {
          resolve(file);
        }, COMPRESSION_TIMEOUT_MS);
      });

      return await Promise.race([compressTo128(file, onProgress), timeoutPromise]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setDetails(null);

    const selected = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : [];
    if (selected.length === 0) {
      setError("Choose one or more audio files first.");
      return;
    }

    const validFiles = selected.filter((file) => file.type && ALLOWED_MIME_TYPES.has(file.type));
    if (validFiles.length === 0) {
      setError(`Unsupported file types. Allowed: ${Array.from(ALLOWED_MIME_TYPES).join(", ")}.`);
      return;
    }

    const remaining = uploadsRemaining === null ? Number.POSITIVE_INFINITY : Math.max(uploadsRemaining, 0);
    const allowedFiles = validFiles.slice(0, remaining === Number.POSITIVE_INFINITY ? validFiles.length : remaining);
    const skippedFiles = validFiles.slice(allowedFiles.length);
    const failed: string[] = [];
    const succeeded: string[] = [];

    let uploadCompleted = false;

    try {
      setIsBusy(true);
      setProgress(0);
      const total = allowedFiles.length || 1;

      for (let index = 0; index < allowedFiles.length; index += 1) {
        const file = allowedFiles[index];
        const label = `${file.name} (${index + 1}/${allowedFiles.length})`;

        setStatus(`Compressing ${label}`);
        const uploadFile = await compressTo128WithTimeout(file, (p) => {
          const overall = ((index + p / 100) / total) * 100;
          setProgress(Math.min(100, Math.max(0, Math.round(overall))));
          setStatus(`Compressing ${label}... ${Math.round(p)}%`);
        });

        setStatus(`Uploading ${label}...`);
        const formData = new FormData();
        formData.set("title", uploadFile.name.replace(/\.[^.]+$/, ""));
        formData.set("file", uploadFile);

        const response = await fetch(API_ROUTES.UPLOAD, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          failed.push(`${file.name}: ${payload?.error || "Upload failed."}`);
          continue;
        }

        succeeded.push(file.name);
      }

      uploadCompleted = true;
      setProgress(100);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      const skippedText = skippedFiles.length
        ? `${skippedFiles.length} file(s) skipped due to upload limit. Upgrade to premium for more uploads.`
        : null;
      const failedText = failed.length ? `Failed: ${failed.join("; ")}` : null;
      const successText = succeeded.length ? `Uploaded: ${succeeded.join(", " )}` : null;

      setStatus(successText ?? "No files uploaded.");
      setDetails([failedText, skippedText].filter(Boolean).join("\n"));
      await onUploaded();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Unexpected upload error.",
      );
    } finally {
      setIsBusy(false);
      if (!uploadCompleted) {
        setProgress(0);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <label htmlFor="audioFile" className="font-manrope text-sm font-semibold text-[#2c2f33]">
          Upload audio
        </label>
        <p className="text-xs text-[#4a5165]">
          Files are compressed to {TARGET_BITRATE} before upload. Allowed: MP3, MP4/M4A, AAC, OGG, WAV, FLAC.
        </p>
        <p className="text-xs text-[#4a5165]">
          {uploadsRemaining === null
            ? "Uploads: unlimited"
            : `Uploads remaining: ${uploadsRemaining}${uploadLimit ? ` of ${uploadLimit}` : ""}`}
        </p>
      </div>

      <label
        htmlFor="audioFile"
        className="grid gap-3 rounded-2xl border border-dashed border-[#c7ccda] bg-[#f7f9fe] p-6 text-center text-sm text-[#4a5165] transition hover:bg-white"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#dbe2fa] text-[#3652be]">
          <UploadCloud size={20} />
        </div>
        <div className="font-medium">Drop files here or click to browse</div>
        <div className="text-xs">Supports WAV, FLAC, and MP3 up to 50MB</div>
        <input
          id="audioFile"
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="sr-only"
        />
      </label>

      <button
        type="submit"
        disabled={isBusy}
        className="rounded-2xl bg-[linear-gradient(135deg,#3652be,#839aff)] px-4 py-3 font-semibold text-white shadow-[0_20px_40px_rgba(54,82,190,0.06)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isBusy ? "Working..." : "Upload Track"}
      </button>

      {isBusy ? (
        <div className="grid gap-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef1f6]">
            <div
              className="h-full bg-[linear-gradient(90deg,#3652be,#839aff)] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-[#4a5165]">{progress}%</p>
        </div>
      ) : null}

      {status ? <p className="text-sm text-[#2f5f3d] whitespace-pre-wrap">{status}</p> : null}
      {details ? <p className="text-xs text-[#4a5165] whitespace-pre-wrap">{details}</p> : null}
      {error ? <p className="text-sm text-[#c43d3d]">{error}</p> : null}
    </form>
  );
}
