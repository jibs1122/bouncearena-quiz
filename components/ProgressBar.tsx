interface ProgressBarProps {
  value: number; // 0–100
}

export default function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="w-full h-[3px] bg-black/[0.07] rounded-full overflow-hidden">
      <div
        className="h-full bg-[#38b1ab] rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${Math.max(3, value)}%` }}
      />
    </div>
  );
}
