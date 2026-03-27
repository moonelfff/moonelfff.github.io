import Typography from "../atom/Typography";
import Card from "../molecule/Card";

type Props = {
  title: string;
  description: React.ReactNode;
  packages: {
    name: string;
    price: {
      regular: { amount: number; currency: string };
      discounted?: { amount: number; currency: string };
    };
  }[];
};

function PriceItem({ title, description, packages }: Props) {
  return (
    <Card>
      <div>
        <Typography component="h3">{title}</Typography>
        <div className="markdown flex flex-col gap-3">{description}</div>
      </div>
      <div className="pt-6">
        {packages.map((pkg, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <Typography component="span">{pkg.name}</Typography>
            {pkg.price.discounted ? (
              <div className="flex items-center gap-3">
                <Typography
                  component="span"
                  className="font-numerical text-alabaster-grey text-2xl line-through"
                >
                  {pkg.price.regular.amount} {pkg.price.regular.currency}
                </Typography>
                <Typography
                  component="span"
                  className="font-numerical text-2xl"
                >
                  {pkg.price.discounted.amount} {pkg.price.discounted.currency}
                </Typography>
              </div>
            ) : (
              <Typography component="span" className="font-numerical text-2xl">
                {pkg.price.regular.amount} {pkg.price.regular.currency}
              </Typography>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export default PriceItem;
