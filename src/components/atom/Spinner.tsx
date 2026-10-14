import { LoaderCircle } from "lucide-react";

type SpinnerProps = {
  className?: string;
};

/** Circular loader that inherits the current text color. */
function Spinner({ className = "size-5" }: SpinnerProps) {
  return (
    <LoaderCircle
      role="status"
      aria-label="Загрузка"
      className={`motion-safe:animate-spin ${className}`}
    />
  );
}

export default Spinner;
