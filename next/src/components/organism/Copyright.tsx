import getContent from "../../assets/data/content";
import Typography from "../atom/Typography";

function Copyright() {
  const year = new Date().getFullYear();
  const content = getContent();

  return (
    <Typography component="p">
      Copyright © {year} {content.fullName}
    </Typography>
  );
}

export default Copyright;
