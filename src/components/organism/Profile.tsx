import photo from "@/assets/images/photo.webp";
import Image from "../molecule/Image";
import Link from "../molecule/Link";
import ContentBox from "../molecule/ContentBox";
import Typography from "../atom/Typography";
import TelegramIcon from "../../assets/icons/TelegramIcon";
import Contact from "./Contact";
import { useSiteContent, useSiteMarkdown } from "../providers/SiteContentProvider";

function Profile() {
  const data = useSiteContent();
  const profileImageSrc = data.profileImageUrl || photo;

  const content = useSiteMarkdown(data.info.contentPath);
  const blogContent = useSiteMarkdown(data.blogDescriptionPath);

  return (
    <section
      id="profile"
      className="flex flex-col-reverse justify-between gap-6 lg:flex-row"
    >
      <div className="w-full lg:w-2/3">
        <Typography component="h1">{data.fullName}</Typography>
        <Typography component="h2" className="mb-3">
          {data.info.title}
        </Typography>
        <div className="flex flex-col gap-6">
          <div>
            <ContentBox content={content} />
            <Contact />
          </div>
          <div>
            <ContentBox content={blogContent} />
            <Link href={data.blogLink} title={data.blog} icon={TelegramIcon} />
          </div>
          {/* <Link href={data.testLink} title={data.testTitle} /> */}
        </div>
      </div>
      <div>
        <Image
          src={profileImageSrc}
          alt={data.fullName}
          className="flex w-full justify-center"
        />
      </div>
    </section>
  );
}

export default Profile;
