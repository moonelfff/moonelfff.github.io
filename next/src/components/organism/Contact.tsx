import getContent from "../../assets/data/content";
import TelegramIcon from "../../assets/icons/TelegramIcon";
import VKIcon from "../../assets/icons/VKIcon";
import Link from "../molecule/Link";

function Contact() {
  const data = getContent();
  return (
    <div>
      <Link
        href={data.telegramLink}
        title={data.bookConsultation}
        icon={TelegramIcon}
      />
      <Link
        href={data.vkMessengerLink}
        title={data.bookConsultation}
        icon={VKIcon}
      />
    </div>
  );
}

export default Contact;
