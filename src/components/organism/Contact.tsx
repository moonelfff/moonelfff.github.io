import BookingButton from "../molecule/BookingButton";
import type { SiteContent } from "@/lib/contentTypes";

function Contact({ data }: { data: SiteContent }) {
  return (
    <BookingButton
      label={data.bookConsultation}
      telegramLabel={data.telegram}
      telegramHref={data.telegramLink}
      vkLabel={data.vkMessenger}
      vkHref={data.vkMessengerLink}
      className="pt-5 lg:mx-auto lg:w-fit lg:min-w-100"
    />
  );
}

export default Contact;
