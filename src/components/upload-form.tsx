"use client";

import { useRef, useState } from "react";

type UploadFormProps = {
  onUploaded: () => Promise<void>;
};

export function UploadForm({ onUploaded }: UploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  function maybeCompress(file: File): File {
    return file;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const selected = fileInputRef.current?.files?.[0];
    if (!selected) {
      setError("Choose an audio file first.");
      return;
    }

    try {
      setIsBusy(true);
      const uploadFile = maybeCompress(selected);
      setStatus("Uploading...");

      const formData = new FormData();
      formData.set("title", uploadFile.name.replace(/\.[^.]+$/, ""));
      formData.set("file", uploadFile);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Upload failed.");
      }

      setStatus("Upload complete.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await onUploaded();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Unexpected upload error.",
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        border: "1px solid var(--border)",
        background: "#fff",
        borderRadius: "14px",
        padding: "1rem",
        display: "grid",
        gap: "0.75rem",
      }}
    >
      <label htmlFor="audioFile">Upload audio</label>
      <input id="audioFile" ref={fileInputRef} type="file" accept="audio/*" />
      <button
        type="submit"
        disabled={isBusy}
        style={{
          border: "none",
          borderRadius: "10px",
          background: "var(--accent-2)",
          color: "white",
          padding: "0.6rem 0.9rem",
          cursor: "pointer",
        }}
      >
        {isBusy ? "Working..." : "Upload"}
      </button>
      {status ? <p style={{ color: "#304f25" }}>{status}</p> : null}
      {error ? <p style={{ color: "#8f1a1a" }}>{error}</p> : null}
    </form>
  );
}
