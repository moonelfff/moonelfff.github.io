import { parseMarkdown } from "../../utils/markdownParser";

type Props = {
  content: string;
};

function ContentBox({ content }: Props) {
  return (
    <div>
      <div className="markdown content-markdown flex flex-col gap-2">
        {parseMarkdown(content)}
      </div>
    </div>
  );
}

export default ContentBox;
