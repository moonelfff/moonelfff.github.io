import HomePage from "@/components/organism/HomePage";
import { getContentBundle } from "@/lib/contentStore";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { content, markdown } = await getContentBundle();
  return <HomePage content={content} markdown={markdown} />;
}