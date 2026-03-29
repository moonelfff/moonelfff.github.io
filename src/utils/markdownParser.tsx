import { marked } from "marked";
import React from "react";
import Typography from "../components/atom/Typography";

/**
 * Parses a Markdown string into React components recursively.
 * @param markdown - The Markdown string to parse.
 * @returns An array of React components.
 */
export function parseMarkdown(markdown: string): React.ReactNode {
  const renderer = new marked.Renderer();

  // Recursive function to convert HTML strings into React components
  const parseHtmlToComponents = (
    html: string | Promise<string>,
  ): React.ReactNode => {
    const div = document.createElement("div");
    if (html instanceof Promise) {
      html.then((resolvedHtml) => {
        div.innerHTML = resolvedHtml;
      });
      return null;
    } else {
      div.innerHTML = html;
    }

    return Array.from(div.childNodes).map((node, index) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const children = parseHtmlToComponents(element.innerHTML);

        switch (element.tagName.toLowerCase()) {
          case "p":
            return (
              <Typography key={index} component="p">
                {children}
              </Typography>
            );
          case "h1":
            return (
              <Typography key={index} component="h1">
                {children}
              </Typography>
            );
          case "h2":
            return (
              <Typography key={index} component="h2">
                {children}
              </Typography>
            );
          case "h3":
            return (
              <Typography key={index} component="h3">
                {children}
              </Typography>
            );
          case "h4":
            return (
              <Typography key={index} component="h4">
                {children}
              </Typography>
            );
          case "h5":
            return (
              <Typography key={index} component="h5">
                {children}
              </Typography>
            );
          case "h6":
            return (
              <Typography key={index} component="h6">
                {children}
              </Typography>
            );
          default:
            return React.createElement(
              element.tagName.toLowerCase(),
              { key: index },
              children,
            );
        }
      }

      return null;
    });
  };

  // Ensure synchronous parsing of Markdown
  const html = marked(markdown, { renderer });

  // Convert the HTML into React components recursively
  return <>{parseHtmlToComponents(html)}</>;
}
