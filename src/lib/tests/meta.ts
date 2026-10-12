type SchemaNode = {
  elements?: SchemaNode[];
  pages?: SchemaNode[];
  type?: string;
};

export function countQuestions(schema: Record<string, unknown>): number {
  const walk = (node: SchemaNode): number => {
    const children = [...(node.pages ?? []), ...(node.elements ?? [])];
    if (children.length === 0) {
      return node.type && node.type !== "panel" ? 1 : 0;
    }
    return children.reduce((sum, child) => sum + walk(child), 0);
  };
  return walk(schema as SchemaNode);
}

const SECONDS_PER_QUESTION = 8;

export function estimateMinutes(questions: number): number {
  return Math.max(1, Math.round((questions * SECONDS_PER_QUESTION) / 60));
}

export function pluralize(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function plainText(markdown: string): string {
  return markdown
    .replace(/[*_`>#]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*(?:[-+]|\d+\.)\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
