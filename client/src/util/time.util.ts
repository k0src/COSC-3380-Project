/**
 * Formats seconds into MM:SS format.
 * @param seconds The time in seconds to format.
 * @returns Formatted time string in MM:SS format.
 */
export const formatPlaybackTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Extracts the date part (YYYY-MM-DD) from an timestamptz string.
 * @param dateString The timestamptz string (e.g., "2025-10-14T05:00:00.000Z").
 * @returns Date string in YYYY-MM-DD format.
 */
export const formatDateString = (dateString: string): string =>
  dateString.split("T")[0];

/**
 * Formats a date string into a relative time description (e.g., "2 days ago").
 * @param dateString The timestamptz string (e.g., "2025-10-14T05:00:00.000Z").
 * @returns Relative time description.
 */
export const formatRelativeDate = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
};

/**
 * Formats runtime in seconds into HH hr MM min format.
 * @param seconds The runtime in seconds.
 * @returns Formatted runtime string.
 */
export const formatRuntime = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const hrsPart = hrs > 0 ? `${hrs} hr ` : "";
  const minsPart = `${mins} min`;
  return `${hrsPart}${minsPart}`.trim();
};
