type PlaybackWaveformIndicatorProps = {
  color: string;
};

export function PlaybackWaveformIndicator({ color }: PlaybackWaveformIndicatorProps) {
  return (
    <span className="inline-flex items-end gap-[2px]" aria-hidden>
      <span className="h-2 w-[2px] animate-[equalize_1.1s_ease-in-out_infinite] rounded-full" style={{ backgroundColor: color }} />
      <span className="h-4 w-[2px] animate-[equalize_0.9s_ease-in-out_infinite_0.1s] rounded-full" style={{ backgroundColor: color }} />
      <span className="h-3 w-[2px] animate-[equalize_1.3s_ease-in-out_infinite_0.2s] rounded-full" style={{ backgroundColor: color }} />
      <style jsx>{`
        @keyframes equalize {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </span>
  );
}
