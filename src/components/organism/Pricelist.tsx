import Typography from "../atom/Typography";
import PriceItem from "./PriceItem";
import { parseMarkdown } from "../../utils/markdownParser";
import type { SiteContent } from "@/lib/contentTypes";
import type { Tariff } from "@/lib/tariffStore";

function Pricelist({ data, tariffs }: { data: SiteContent; tariffs: Tariff[] }) {

  return (
    <section id="price">
      <Typography component="h2" className="mb-3">
        {data.priceHeader}
      </Typography>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col flex-wrap justify-center gap-3 lg:flex-row">
          {tariffs.map(tariff => (
            <PriceItem
              key={tariff.id}
              title={tariff.title}
              contactLabel={data.priceCardBookLabel}
              telegramLabel={data.telegram}
              telegramHref={data.telegramLink}
              vkLabel={data.vkMessenger}
              vkHref={data.vkMessengerLink}
              description={
                tariff.descriptionMarkdown
                  ? parseMarkdown(tariff.descriptionMarkdown)
                  : null
              }
              packages={tariff.packages.map(pkg => ({
                name: pkg.title,
                price: {
                  regular: {
                    amount: pkg.regularAmount,
                    currency: pkg.currency
                  },
                  discounted:
                    pkg.discountedAmount === null
                      ? undefined
                      : {
                          amount: pkg.discountedAmount,
                          currency: pkg.currency
                        }
                }
              }))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricelist;
