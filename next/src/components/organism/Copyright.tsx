import Typography from "../atom/Typography";
import { useSiteContent } from "../providers/SiteContentProvider";

function Copyright() {
  const year = new Date().getFullYear();
  const content = useSiteContent();

  return (
    <Typography component="p">
      Copyright © {year} {content.fullName}
    </Typography>
  );
}

export default Copyright;
