import { Fragment, type ReactNode } from "react";
import { Lexer, type Token, type Tokens } from "marked";
import Typography from "../components/atom/Typography";
import Tooltip from "../components/atom/Tooltip";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

function renderInline(tokens: Token[] = []): ReactNode {
  return tokens.map((token, index) => {
    switch (token.type) {
      case "strong":
        return (
          <strong key={index}>
            {renderInline((token as Tokens.Strong).tokens)}
          </strong>
        );
      case "em":
        return <em key={index}>{renderInline((token as Tokens.Em).tokens)}</em>;
      case "del":
        return (
          <del key={index}>{renderInline((token as Tokens.Del).tokens)}</del>
        );
      case "codespan":
        return <code key={index}>{(token as Tokens.Codespan).text}</code>;
      case "br":
        return <br key={index} />;
      case "link": {
        const link = token as Tokens.Link;
        const anchor = <a href={link.href}>{renderInline(link.tokens)}</a>;
        return link.title ? (
          <Tooltip key={index} text={link.title} className="inline">
            {anchor}
          </Tooltip>
        ) : (
          <Fragment key={index}>{anchor}</Fragment>
        );
      }
      case "image": {
        const image = token as Tokens.Image;
        // eslint-disable-next-line @next/next/no-img-element
        return <img key={index} src={image.href} alt={image.text} />;
      }
      case "escape":
        return (token as Tokens.Escape).text;
      case "text": {
        const text = token as Tokens.Text;
        return text.tokens ? renderInline(text.tokens) : text.text;
      }
      case "html":
        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{ __html: (token as Tokens.HTML).text }}
          />
        );
      default:
        return (token as Tokens.Generic).raw;
    }
  });
}

function renderBlocks(tokens: Token[]): ReactNode {
  return tokens.map((token, index) => {
    switch (token.type) {
      case "heading": {
        const heading = token as Tokens.Heading;
        return (
          <Typography key={index} component={`h${heading.depth}` as HeadingTag}>
            {renderInline(heading.tokens)}
          </Typography>
        );
      }
      case "paragraph":
        return (
          <Typography key={index} component="p">
            {renderInline((token as Tokens.Paragraph).tokens)}
          </Typography>
        );
      case "list": {
        const list = token as Tokens.List;
        const items = list.items.map((item, itemIndex) => (
          <li key={itemIndex}>{renderBlocks(item.tokens)}</li>
        ));
        return list.ordered ? (
          <ol key={index} start={list.start || undefined}>
            {items}
          </ol>
        ) : (
          <ul key={index}>{items}</ul>
        );
      }
      case "blockquote":
        return (
          <blockquote key={index}>
            {renderBlocks((token as Tokens.Blockquote).tokens)}
          </blockquote>
        );
      case "code":
        return (
          <pre key={index}>
            <code>{(token as Tokens.Code).text}</code>
          </pre>
        );
      case "hr":
        return <hr key={index} />;
      case "html":
        return (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: (token as Tokens.HTML).text }}
          />
        );
      case "text": {
        // Tight list items contain bare text tokens instead of paragraphs.
        const text = token as Tokens.Text;
        return (
          <Fragment key={index}>
            {text.tokens ? renderInline(text.tokens) : text.text}
          </Fragment>
        );
      }
      default:
        return null;
    }
  });
}

/** Renders Markdown as React elements; works on both server and client. */
export function parseMarkdown(markdown: string): ReactNode {
  return <>{renderBlocks(new Lexer().lex(markdown))}</>;
}
