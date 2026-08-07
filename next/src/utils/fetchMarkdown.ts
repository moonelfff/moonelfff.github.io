function normalizePath(markdownPath: string): string {
  return markdownPath.replace(/^\/+/, "");
}

function toDirectPath(markdownPath: string): string {
  return markdownPath.startsWith("/") ? markdownPath : `/${markdownPath}`;
}

function toApiPath(markdownPath: string): string {
  const normalizedPath = normalizePath(markdownPath);
  return `/api/markdown?path=${encodeURIComponent(normalizedPath)}`;
}

async function fetchMarkdownText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load markdown from ${url}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    throw new Error(`HTML received instead of markdown from ${url}`);
  }

  return response.text();
}

export async function fetchMarkdown(markdownPath: string): Promise<string> {
  try {
    return await fetchMarkdownText(toApiPath(markdownPath));
  } catch {
    return fetchMarkdownText(toDirectPath(markdownPath));
  }
}
