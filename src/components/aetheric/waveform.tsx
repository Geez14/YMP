type WaveformProps = {
  color?: string;
};

export function Waveform({ color = "#3652be" }: WaveformProps) {
  return (
    <svg
      width="20"
      height="16"
      viewBox="0 0 20 16"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <rect x="1" y="5" width="3" height="6" rx="1" className="aetheric-wave-bar" />
      <rect x="6" y="3" width="3" height="10" rx="1" className="aetheric-wave-bar" />
      <rect x="11" y="6" width="3" height="5" rx="1" className="aetheric-wave-bar" />
      <rect x="16" y="2" width="3" height="12" rx="1" className="aetheric-wave-bar" />
    </svg>
  );
}
