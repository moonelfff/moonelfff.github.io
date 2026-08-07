import Typography from "../atom/Typography";
import PriceItem from "./PriceItem";
import { useEffect, useState } from "react";
import { parseMarkdown } from "../../utils/markdownParser";
import Contact from "./Contact";
import { useSiteContent } from "../providers/SiteContentProvider";
import type { Tariff } from "@/lib/tariffStore";

type TariffResponse = {
  tariffs: Tariff[];
};

function Pricelist() {
  const data = useSiteContent();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);

  useEffect(() => {
    const loadTariffs = async () => {
      try {
        const response = await fetch("/api/tariffs", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const body = (await response.json()) as TariffResponse;
        setTariffs(body.tariffs.filter((tariff) => tariff.isActive));
      } catch {
        setTariffs([]);
      }
    };

    loadTariffs();
  }, []);

  return (
    <section id="price">
      <Typography component="h2" className="mb-3">
        {data.priceHeader}
      </Typography>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col flex-wrap justify-center gap-3 lg:flex-row">
          {tariffs.map((tariff) => (
            <PriceItem
              key={tariff.id}
              title={tariff.title}
              description={
                tariff.descriptionMarkdown ? (
                  parseMarkdown(tariff.descriptionMarkdown)
                ) : (
                  <div className="flex h-50 items-center justify-center">
                    {data.loading}
                  </div>
                )
              }
              packages={tariff.packages.map((pkg) => ({
                name: pkg.title,
                price: {
                  regular: {
                    amount: pkg.regularAmount,
                    currency: pkg.currency,
                  },
                  discounted:
                    pkg.discountedAmount === null
                      ? undefined
                      : {
                          amount: pkg.discountedAmount,
                          currency: pkg.currency,
                        },
                },
              }))}
            />
          ))}
        </div>
      </div>
      <Contact />
    </section>
  );
}

export default Pricelist;
