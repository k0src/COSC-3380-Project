/**
 * Formats seconds into MM:SS format.
 */
export const formatPlaybackTime = (seconds: number) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return "0:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const formatDateString = (dateString: string): string => {
  if (!dateString) return "";
  try {
    return dateString.split("T")[0];
  } catch {
    return "";
  }
};

export const formatLocaleDate = (dateString: string) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

export const formatHour = (hour: number) => {
  if (hour === null || hour === undefined || isNaN(hour)) {
    return "00:00";
  }
  return hour.toString().padStart(2, "0") + ":00";
};

/**
 * Formats a date string into a relative time (e.g., "2 days ago").
 */
export const formatRelativeDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  try {
    const now = new Date();
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
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
    if (months < 12)
      return `${months} ${months === 1 ? "month" : "months"} ago`;

    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  } catch {
    return "N/A";
  }
};

export const formatRuntime = (seconds: number) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return "0 min";
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const hrsPart = hrs > 0 ? `${hrs} hr ` : "";
  const minsPart = `${mins} min`;
  return `${hrsPart}${minsPart}`.trim();
};
