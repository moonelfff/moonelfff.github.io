import Typography from "../atom/Typography";
import Card from "../molecule/Card";
import Number from "../molecule/Number";
import BookingButton from "../molecule/BookingButton";

type Props = {
  title: string;
  description: React.ReactNode;
  contactLabel: string;
  telegramLabel: string;
  telegramHref: string;
  vkLabel: string;
  vkHref: string;
  packages: {
    name: string;
    price: {
      regular: { amount: number; currency: string };
      discounted?: { amount: number; currency: string };
    };
  }[];
};

function PriceItem({
  title,
  description,
  contactLabel,
  telegramLabel,
  telegramHref,
  vkLabel,
  vkHref,
  packages,
}: Props) {
  return (
    <Card>
      <div>
        <Typography component="h3">{title}</Typography>
        <div className="markdown flex flex-col gap-2">{description}</div>
      </div>
      <div className="pt-6">
        {packages.map((pkg, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <Typography component="span">{pkg.name}</Typography>
            {pkg.price.discounted ? (
              <div className="flex items-center gap-3">
                <Number
                  value={`${pkg.price.regular.amount} ${pkg.price.regular.currency}`}
                  crossedOut
                />
                <Number
                  value={`${pkg.price.discounted.amount} ${pkg.price.discounted.currency}`}
                />
              </div>
            ) : (
              <Number
                value={`${pkg.price.regular.amount} ${pkg.price.regular.currency}`}
              />
            )}
          </div>
        ))}
      </div>
      <BookingButton
        label={contactLabel}
        telegramLabel={telegramLabel}
        telegramHref={telegramHref}
        vkLabel={vkLabel}
        vkHref={vkHref}
        variant="solid"
        icon={
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        }
      />
    </Card>
  );
}

export default PriceItem;
