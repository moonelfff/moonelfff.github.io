import getContent from "../../assets/data/content";
import photo from "@/assets/images/photo.webp";
import Image from "../molecule/Image";
import Link from "../molecule/Link";
import ContentBox from "../molecule/ContentBox";
import { useEffect, useState } from "react";
import Typography from "../atom/Typography";

function Profile() {
  const data = getContent();

  const [content, setContent] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch(data.info.contentPath)
      .then((response) => response.text())
      .then((content) => {
        setContent(content);
      });
  }, [data.info.contentPath]);

  return (
    <section className="flex flex-col-reverse justify-between gap-6 lg:flex-row">
      <div className="w-full lg:w-2/3">
        <Typography component="h1">{data.fullName}</Typography>
        <Typography component="h2" className="mb-3">
          {data.info.title}
        </Typography>
        <ContentBox content={content} />
        <Link href={data.telegramLink} title={data.bookConsultation} />
        <Link href={data.blogLink} title={data.blog} />
        <Link href={data.testLink} title={data.testTitle} />
      </div>
      <div>
        <Image src={photo} alt={data.fullName} className="w-full" />
      </div>
    </section>
  );
}

export default Profile;
