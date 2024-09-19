export const cleanTitle = (title?: string): string | undefined => {
  if (!title) return undefined;
  const newTitle = encodeURIComponent(title);
  return newTitle.replaceAll(/%20/g, "-").replaceAll(/%27/g, "");
};
