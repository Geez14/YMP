"use client";

import { UploadForm } from "@/components/upload-form";

export default function UploadClient() {
  return <UploadForm onUploaded={async () => {}} uploadLimit={null} uploadsRemaining={null} />;
}
