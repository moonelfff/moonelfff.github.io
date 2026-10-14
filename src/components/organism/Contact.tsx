import BookingButton from "../molecule/BookingButton";
import { useSiteContent } from "../providers/SiteContentProvider";

function Contact() {
  const data = useSiteContent();
  return (
    <BookingButton
      label={data.bookConsultation}
      telegramLabel={data.telegram}
      telegramHref={data.telegramLink}
      vkLabel={data.vkMessenger}
      vkHref={data.vkMessengerLink}
    />
  );
}

export default Contact;
