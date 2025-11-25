export const formatNumber = (num: number | string): string => {
  const n = typeof num === "string" ? parseFloat(num) : num;
  if (n === null || n === undefined || isNaN(n)) {
    return "0";
  }
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(1)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1)}K`;
  }
  return n.toFixed(1).toString();
};

export const formatPercentage = (num: number, decimals: number = 1): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return "0%";
  }
  return `${num.toFixed(decimals)}%`;
};
