import HomePage from "@/components/organism/HomePage";
import { getPublicContentBundle } from "@/lib/contentStore";
import { getPublicTariffBundle, type Tariff } from "@/lib/tariffStore";

export const dynamic = "force-dynamic";

// The price list is non-critical: if tariffs fail to load, the rest of the page still renders.
async function getActiveTariffs(): Promise<Tariff[]> {
  try {
    const { tariffs } = await getPublicTariffBundle();
    return tariffs.filter((tariff) => tariff.isActive);
  } catch (error) {
    console.error("Failed to load tariffs", error);
    return [];
  }
}

export default async function Home() {
  const [{ content, markdown }, tariffs] = await Promise.all([
    getPublicContentBundle(),
    getActiveTariffs(),
  ]);
  return <HomePage content={content} markdown={markdown} tariffs={tariffs} />;
}
