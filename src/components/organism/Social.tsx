import B17Icon from "../../assets/icons/B17Icon";
import TelegramIcon from "../../assets/icons/TelegramIcon";
import VKIcon from "../../assets/icons/VKIcon";
import Tooltip from "../atom/Tooltip";
import type { SiteContent } from "@/lib/contentTypes";

function Social({ content }: { content: SiteContent }) {

  return (
    <ul className="flex gap-3">
      <li>
        <Tooltip text={content.telegram}>
          <a
            href={content.telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={content.telegram}
          >
            <TelegramIcon color="var(--color-platinum)" />
          </a>
        </Tooltip>
      </li>
      <li>
        <Tooltip text={content.vkMessenger}>
          <a
            href={content.vkMessengerLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={content.vkMessenger}
          >
            <VKIcon color="var(--color-platinum)" />
          </a>
        </Tooltip>
      </li>
      <li>
        <Tooltip text={content.b17}>
          <a
            href={content.b17Link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={content.b17}
          >
            <B17Icon color="var(--color-platinum)" />
          </a>
        </Tooltip>
      </li>
    </ul>
  );
}

export default Social;
