import { useSiteContent } from "../providers/SiteContentProvider";
import { parseMarkdown } from "../../utils/markdownParser";

type Props = {
  content: string | undefined;
};

function ContentBox({ content }: Props) {
  const data = useSiteContent();

  return (
    <div>
      <div className="markdown content-markdown flex flex-col gap-2">
        {content === undefined ? (
          <div className="flex h-120 items-center justify-center">
            {data.loading}
          </div>
        ) : (
          parseMarkdown(content)
        )}
      </div>
    </div>
  );
}

export default ContentBox;
