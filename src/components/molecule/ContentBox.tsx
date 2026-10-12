import { parseMarkdown } from "../../utils/markdownParser";
import { SkeletonText } from "../atom/Skeleton";

type Props = {
  content: string | undefined;
};

function ContentBox({ content }: Props) {
  return (
    <div>
      <div className="markdown content-markdown flex flex-col gap-2">
        {content === undefined ? (
          <div className="py-2">
            <SkeletonText lines={10} />
          </div>
        ) : (
          parseMarkdown(content)
        )}
      </div>
    </div>
  );
}

export default ContentBox;
