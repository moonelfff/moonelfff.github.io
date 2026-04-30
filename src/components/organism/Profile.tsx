import getContent from "../../assets/data/content";
import photo from "@/assets/images/photo.webp?responsive";
import Image from "../molecule/Image";
import Link from "../molecule/Link";
import ContentBox from "../molecule/ContentBox";
import { useEffect, useState } from "react";
import Typography from "../atom/Typography";
import TelegramIcon from "../../assets/icons/TelegramIcon";
import Contact from "./Contact";

function Profile() {
  const data = getContent();

  const [content, setContent] = useState<string | undefined>(undefined);

  const [blogContent, setBlogContent] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch(data.info.contentPath)
      .then((response) => response.text())
      .then((content) => {
        setContent(content);
      });
    fetch(data.blogDescriptionPath)
      .then((response) => response.text())
      .then((content) => {
        setBlogContent(content);
      });
  }, [data.info.contentPath]);

  return (
    <section className="flex flex-col-reverse justify-between gap-6 lg:flex-row">
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
          src={photo}
          alt={data.fullName}
          className="flex w-full justify-center"
        />
      </div>
    </section>
  );
}

export default Profile;
