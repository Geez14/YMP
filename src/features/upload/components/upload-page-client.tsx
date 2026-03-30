"use client";

import { UploadForm } from "@/features/upload/components/upload-form";

export default function UploadPageClient() {
  return <UploadForm onUploaded={async () => {}} uploadLimit={null} uploadsRemaining={null} />;
}
