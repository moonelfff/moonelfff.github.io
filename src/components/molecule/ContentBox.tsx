import { parseMarkdown } from "../../utils/markdownParser";

type Props = {
  content: string;
};

function ContentBox({ content }: Props) {
  console.log(content);
  return (
    <div>
      <div className="markdown content-markdown flex flex-col gap-3">
        {parseMarkdown(content)}
      </div>
    </div>
  );
}

export default ContentBox;
