import Typography from "../atom/Typography";
import Link from "../molecule/Link";
import PriceItem from "./PriceItem";
import getContent from "../../assets/data/content";
import Markdown from "react-markdown";
import { useEffect, useState } from "react";

function Pricelist() {
  const data = getContent();
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});

  useEffect(() => {
    // Загрузка всех описаний
    const loadDescriptions = async () => {
      const descriptionPromises = data.pricelist.map(async (item) => {
        const response = await fetch(item.descriptionPath);
        const content = await response.text();
        return { [item.title]: content };
      });

      const loadedDescriptions = await Promise.all(descriptionPromises);
      const descriptionsMap = Object.assign({}, ...loadedDescriptions);
      setDescriptions(descriptionsMap);
    };

    loadDescriptions();
  }, [data.pricelist]);

  return (
    <section>
      <Typography component="h2">{data.priceHeader}</Typography>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col flex-wrap justify-center gap-3 gap-y-5 lg:flex-row">
          {data.pricelist.map((item) => (
            <PriceItem
              key={item.title}
              title={item.title}
              description={
                descriptions[item.title] ? (
                  <Markdown>{descriptions[item.title]}</Markdown>
                ) : (
                  "Loading..."
                )
              }
              packages={item.packages}
            />
          ))}
        </div>
      </div>
      <Link href={data.telegramLink} title={data.bookConsultation} />
    </section>
  );
}

export default Pricelist;
