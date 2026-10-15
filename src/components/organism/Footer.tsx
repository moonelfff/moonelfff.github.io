import Glass from "../atom/Glass";
import Copyright from "./Copyright";
import Social from "./Social";
import type { SiteContent } from "@/lib/contentTypes";

function Footer({ content }: { content: SiteContent }) {
  return (
    <footer className="text-platinum rounded-xl">
      <Glass>
        <div className="flex h-32 flex-col items-center justify-between p-6 lg:h-24 lg:flex-row">
          <Copyright content={content} />
          <Social content={content} />
        </div>
      </Glass>
    </footer>
  );
}

export default Footer;
