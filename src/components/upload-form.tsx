"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

type FFmpegProgressPayload = {
  progress: number;
};

type FFmpegLoadOptions = {
  coreURL: string;
  wasmURL: string;
  workerURL: string;
};

type FFmpegInstance = {
  on: (event: "progress", cb: (payload: FFmpegProgressPayload) => void) => void;
  load: (options: FFmpegLoadOptions) => Promise<void>;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
  exec: (args: string[]) => Promise<void>;
  readFile: (path: string) => Promise<Uint8Array>;
  deleteFile: (path: string) => Promise<void>;
};

type FFmpegConstructor = new () => FFmpegInstance;

type FFmpegWindow = Window & {
  FFmpegWASM?: {
    FFmpeg?: FFmpegConstructor;
  };
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
  const ffmpegRef = useRef<FFmpegInstance | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [details, setDetails] = useState<string | null>(null);

  async function loadFfmpegUmd(): Promise<FFmpegConstructor | null> {
    if (typeof window === "undefined") {
      return null;
    }

    const ffWindow = window as FFmpegWindow;

    if (ffWindow.FFmpegWASM?.FFmpeg) {
      return ffWindow.FFmpegWASM.FFmpeg;
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        "script[data-ffmpeg-umd='true']",
      ) as HTMLScriptElement | null;

      if (existing) {
        if (ffWindow.FFmpegWASM?.FFmpeg) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load ffmpeg UMD script")), {
          once: true,
        });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js";
      script.async = true;
      script.dataset.ffmpegUmd = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load ffmpeg UMD script"));
      document.head.appendChild(script);
    });

    return ffWindow.FFmpegWASM?.FFmpeg ?? null;
  }

  async function getFfmpeg(onProgress?: (p: number) => void) {
    if (!ffmpegRef.current) {
      const FFmpeg = await loadFfmpegUmd();
      if (!FFmpeg) {
        return null;
      }

      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.9/dist/umd";
      const ffmpeg = new FFmpeg();

      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        if (onProgress) {
          onProgress(Math.max(0, Math.min(100, Math.round(progress * 100))));
        }
      });

      await ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
        workerURL: `${baseURL}/ffmpeg-core.worker.js`,
      });

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

      // transcode to target bitrate mp3
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
      const normalized = new Uint8Array(outData.length);
      normalized.set(outData);
      const blob = new Blob([normalized.buffer as ArrayBuffer], { type: "audio/mpeg" });
      const compressedFile = new File([blob], originalName.replace(/\.[^.]+$/, '') + '.mp3', { type: 'audio/mpeg' });

      // clean up FS
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch {}

      return compressedFile;
    } catch {
      // on failure, return original file
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

        const response = await fetch("/api/upload", {
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
