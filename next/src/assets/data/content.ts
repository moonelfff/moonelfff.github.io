import content from "./content.json";

export type Content = typeof content;

let cachedContent: Content | null = null;

export function getContent(): Content {
  if (!cachedContent) {
    cachedContent = content as Content;
  }
  return cachedContent;
}

export default getContent;
