import getContent from "../../assets/data/content";
import photo from "@/assets/images/kate_zhuk.jpg";
import Image from "../molecule/Image";
import Link from "../molecule/Link";
import ContentBox from "../molecule/ContentBox";
import { useState } from "react";

function Profile() {
  const data = getContent();

  const [content, setContent] = useState("");

  fetch(data.info.contentPath)
    .then((response) => response.text())
    .then((content) => {
      setContent(content);
    });

  return (
    <section className="flex flex-col-reverse justify-between gap-6 lg:flex-row">
      <div className="w-full lg:w-2/3">
        <ContentBox content={content} />
        <Link href={data.telegramLink} title={data.bookConsultation} />
        <Link href={data.blogLink} title={data.blog} />
      </div>
      <div>
        <Image src={photo} alt={data.fullName} className="w-full" />
      </div>
    </section>
  );
}

export default Profile;
