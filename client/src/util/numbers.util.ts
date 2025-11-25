export const formatNumber = (
  num: number | string,
  decimals: number = 1
): string => {
  const n = typeof num === "string" ? parseFloat(num) : num;

  if (n === null || n === undefined || isNaN(n)) {
    return "0";
  }

  if (n >= 1000000) {
    return `${Math.floor(n / 1000000)}M`;
  }

  if (n >= 1000) {
    return `${Math.floor(n / 1000)}K`;
  }

  if (Number.isInteger(n)) {
    return n.toString();
  }

  return n.toFixed(decimals);
};

export const formatPercentage = (num: number, decimals: number = 1): string => {
  if (num === null || num === undefined || isNaN(num)) {
    return "0%";
  }
  return `${num.toFixed(decimals)}%`;
};
