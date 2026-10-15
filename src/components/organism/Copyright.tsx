import Typography from "../atom/Typography";
import type { SiteContent } from "@/lib/contentTypes";

function Copyright({ content }: { content: SiteContent }) {
  const year = new Date().getUTCFullYear();

  return (
    <Typography component="p">
      Copyright © <span suppressHydrationWarning>{year}</span>{" "}
      {content.fullName}
    </Typography>
  );
}

export default Copyright;
