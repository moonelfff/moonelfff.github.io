import Typography from "../atom/Typography";
import PriceItem from "./PriceItem";
import getContent from "../../assets/data/content";
import { useEffect, useState } from "react";
import { parseMarkdown } from "../../utils/markdownParser";
import Contact from "./Contact";

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
      <Typography component="h2" className="mb-3">
        {data.priceHeader}
      </Typography>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col flex-wrap justify-center gap-3 lg:flex-row">
          {data.pricelist.map((item) => (
            <PriceItem
              key={item.title}
              title={item.title}
              description={
                descriptions[item.title] ? (
                  parseMarkdown(descriptions[item.title])
                ) : (
                  <div className="flex h-50 items-center justify-center">
                    {data.loading}
                  </div>
                )
              }
              packages={item.packages}
            />
          ))}
        </div>
      </div>
      <Contact />
    </section>
  );
}

export default Pricelist;
