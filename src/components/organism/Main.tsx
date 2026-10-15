import Pricelist from "./Pricelist";
import Profile from "./Profile";
import type { ContentBundle } from "@/lib/contentStore";
import type { Tariff } from "@/lib/tariffStore";

type Props = Pick<ContentBundle, "content" | "markdown"> & { tariffs: Tariff[] };

function Main({ content, markdown, tariffs }: Props) {
  return (
    <main className="flex grow flex-col gap-8 text-black">
      <Profile data={content} markdown={markdown} />
      <Pricelist data={content} tariffs={tariffs} />
    </main>
  );
}

export default Main;
