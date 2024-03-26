export const calculateReadingTime = (block, wordsPerMinute = 225) => {
  const textContent = block.type === "paragraph" ? block.data.text : "";
  const listContent = block.type === "list" ? block.data.items.join(" ") : "";
  const combinedContent = `${textContent} ${listContent}`;
  const totalWords = combinedContent?.split(/\s+/).length || 0;
  const readingTimeMinutes = totalWords / wordsPerMinute;
  return readingTimeMinutes ;
};
