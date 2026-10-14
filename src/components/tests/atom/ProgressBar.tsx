type Props = {
  value: number;
  label?: string;
  onGlass?: boolean;
};

function ProgressBar({ value, label, onGlass = false }: Props) {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-3 w-full overflow-hidden rounded-full ${
        onGlass ? "bg-black/30" : "bg-dusty-grape/15"
      }`}
    >
      <div
        className="bg-success h-full rounded-full transition-all duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default ProgressBar;
