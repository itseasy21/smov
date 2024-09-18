export const cleanTitle = (title?: string): string | undefined => {
  if (!title) return undefined;
  return title.replaceAll(" ", "-");
};
