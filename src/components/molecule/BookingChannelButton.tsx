import type { ReactNode } from "react";
import Button from "./Button";

type Props = {
  label: string;
  href: string;
  icon: ReactNode;
};

function BookingChannelButton({ label, href, icon }: Props) {
  return (
    <Button
      href={href}
      external
      variant="solid"
      icon={icon}
      iconPosition="left"
    >
      {label}
    </Button>
  );
}

export default BookingChannelButton;
