import HomePage from "@/components/organism/HomePage";
import { getPublicContentBundle } from "@/lib/contentStore";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { content, markdown } = await getPublicContentBundle();
  return <HomePage content={content} markdown={markdown} />;
}