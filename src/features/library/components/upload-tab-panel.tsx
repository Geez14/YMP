import { UploadForm } from "@/features/upload/components/upload-form";

type UploadTabPanelProps = {
  textSecondary: string;
  contentSurface: string;
  contentSurfaceColor: string;
  uploadLimit: number | null;
  uploadsRemaining: number | null;
  onUploaded: () => Promise<void>;
};

export function UploadTabPanel({
  textSecondary,
  contentSurface,
  contentSurfaceColor,
  uploadLimit,
  uploadsRemaining,
  onUploaded,
}: UploadTabPanelProps) {
  return (
    <div className="px-6 pb-32 pt-28 md:px-12 md:pt-32">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className={`text-sm ${textSecondary}`}>Upload center</p>
          <h1 className="font-manrope text-[clamp(1.8rem,3vw,2.6rem)] font-semibold">Upload Music</h1>
          <p className={`text-sm ${textSecondary}`}>
            {uploadsRemaining === null
              ? "Unlimited uploads"
              : `${uploadsRemaining} uploads remaining${uploadLimit ? ` of ${uploadLimit}` : ""}.`}
          </p>
        </div>
      </div>
      <div className={`rounded-3xl border border-dashed p-6 md:p-8 ${contentSurface}`} style={{ backgroundColor: contentSurfaceColor }}>
        <UploadForm onUploaded={onUploaded} uploadLimit={uploadLimit} uploadsRemaining={uploadsRemaining} />
      </div>
    </div>
  );
}
