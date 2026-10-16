import Typography from "./Typography";

type Props = {
  children: string;
  className?: string;
};

export default function GlassText({ children, className = "" }: Props) {
  return (
    <Typography component="span" className={`glass-text ${className}`}>
      <span aria-hidden className="glass-text__backing">
        {children}
      </span>
      <span className="glass-text__surface" data-text={children}>
        {children}
      </span>
    </Typography>
  );
}
