import Typography from "../atom/Typography";
import { useSiteContent } from "../providers/SiteContentProvider";

function Copyright() {
  const year = new Date().getUTCFullYear();
  const content = useSiteContent();

  return (
    <Typography component="p">
      Copyright © <span suppressHydrationWarning>{year}</span>{" "}
      {content.fullName}
    </Typography>
  );
}

export default Copyright;
