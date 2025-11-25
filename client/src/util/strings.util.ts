export const pluralize = (count: number, singular: string, plural?: string) =>
  count === 1 ? singular : plural || `${singular}s`;

export const capitalize = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};
