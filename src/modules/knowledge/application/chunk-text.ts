export function chunkText(
  text: string,
  options: { maxWords: number; overlapWords: number },
): Array<{ content: string; chunkIndex: number }> {
  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const chunks: Array<{ content: string; chunkIndex: number }> = [];
  const step = Math.max(1, options.maxWords - options.overlapWords);

  for (let start = 0; start < words.length; start += step) {
    const content = words.slice(start, start + options.maxWords).join(" ");
    chunks.push({ content, chunkIndex: chunks.length });

    if (start + options.maxWords >= words.length) {
      break;
    }
  }

  return chunks;
}
