import Typography from "../atom/Typography";

type Props = {
  value: string;
  crossedOut?: boolean;
};

export default function Number({ value, crossedOut }: Props) {
  return (
    <Typography
      component="span"
      className={`font-numerical text-2xl ${crossedOut ? "text-alabaster-grey line-through" : ""}`}
    >
      {value}
    </Typography>
  );
}
