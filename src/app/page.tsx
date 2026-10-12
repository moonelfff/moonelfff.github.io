import App from "@/App";
import { getContentBundle } from "@/lib/contentStore";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { content, markdown } = await getContentBundle();
  return <App content={content} markdown={markdown} />;
}