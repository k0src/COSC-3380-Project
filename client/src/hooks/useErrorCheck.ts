import { useMemo } from "react";

interface ErrorCondition {
  condition: boolean;
  title: string;
  message: string;
}

interface UseErrorCheckResult {
  shouldShowError: boolean;
  errorTitle: string;
  errorMessage: string;
}

/**
 * Hook to check multiple error conditions in order and return the first matching error.
 *
 * @param conditions Array of error conditions to check in order
 * @returns Object with error state and error details
 *
 * @example
 * const { shouldShowError, errorTitle, errorMessage } = useErrorCheck([
 *   {
 *     condition: !!error,
 *     title: "Internal Server Error",
 *     message: "An unexpected error occurred."
 *   },
 *   {
 *     condition: !song && !loading,
 *     title: "Song Not Found",
 *     message: "The requested song does not exist."
 *   }
 * ]);
 *
 * if (shouldShowError) {
 *   return <ErrorPage title={errorTitle} message={errorMessage} />;
 * }
 */
export const useErrorCheck = (
  conditions: ErrorCondition[]
): UseErrorCheckResult => {
  return useMemo(() => {
    for (const { condition, title, message } of conditions) {
      if (condition) {
        return {
          shouldShowError: true,
          errorTitle: title,
          errorMessage: message,
        };
      }
    }

    return {
      shouldShowError: false,
      errorTitle: "",
      errorMessage: "",
    };
  }, [conditions]);
};
