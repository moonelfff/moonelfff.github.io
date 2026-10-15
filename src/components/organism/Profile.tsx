import photo from "@/assets/images/photo.webp";
import Image from "../molecule/Image";
import Link from "../molecule/Link";
import ContentBox from "../molecule/ContentBox";
import Typography from "../atom/Typography";
import TelegramIcon from "../../assets/icons/TelegramIcon";
import Contact from "./Contact";
import type { MarkdownMap, SiteContent } from "@/lib/contentTypes";

function Profile({ data, markdown }: { data: SiteContent; markdown: MarkdownMap }) {
  const profileImageSrc = data.profileImageUrl || photo;

  const content = markdown[data.info.contentPath.replace(/^\/+/, "")] ?? "";
  const blogContent = markdown[data.blogDescriptionPath.replace(/^\/+/, "")] ?? "";

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
            <Contact data={data} />
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
