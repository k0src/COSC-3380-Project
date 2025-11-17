const PG_ERROR_CODES = {
  "23505": "duplicate_key",
  "23503": "foreign_key_violation",
  "23502": "not_null_violation",
  "23514": "check_violation",
  "42P01": "undefined_table",
  "42703": "undefined_column",
} as const;

const ERROR_MESSAGES = {
  username: "Username is already taken. Please choose a different one.",
  email: "Email address is already registered. Please use a different email.",
  name: "This name is already in use.",
} as const;

/**
 * Handles PostgreSQL errors and returns error messages
 * @param error The error object from PostgreSQL
 * @returns Object with error message and HTTP status code
 */
export function handlePgError(error: any): {
  message: string;
  statusCode: number;
} {
  if (error.code && PG_ERROR_CODES[error.code as keyof typeof PG_ERROR_CODES]) {
    const errorType = PG_ERROR_CODES[error.code as keyof typeof PG_ERROR_CODES];

    switch (errorType) {
      case "duplicate_key":
        return handleDuplicateKeyError(error);
      case "foreign_key_violation":
        return {
          message: "The referenced record does not exist.",
          statusCode: 400,
        };
      case "not_null_violation":
        return {
          message: `The field '${error.column}' is required.`,
          statusCode: 400,
        };
      case "check_violation":
        return {
          message: "The provided data does not meet the required constraints.",
          statusCode: 400,
        };
      default:
        return {
          message: "A database constraint was violated.",
          statusCode: 400,
        };
    }
  }
  return {
    message: error.message || "An unexpected error occurred.",
    statusCode: 500,
  };
}

/**
 * Handles duplicate key violations with specific messages based on the constraint
 * @param error The PostgreSQL duplicate key error
 * @returns Object with message and status code
 */
function handleDuplicateKeyError(error: any): {
  message: string;
  statusCode: number;
} {
  const constraintName = error.constraint || "";
  const detail = error.detail || "";

  let fieldName = "";

  if (constraintName.includes("username")) {
    fieldName = "username";
  } else if (constraintName.includes("email")) {
    fieldName = "email";
  }
  if (!fieldName && detail) {
    if (detail.includes("username")) {
      fieldName = "username";
    } else if (detail.includes("email")) {
      fieldName = "email";
    }
  }

  if (fieldName && ERROR_MESSAGES[fieldName as keyof typeof ERROR_MESSAGES]) {
    return {
      message: ERROR_MESSAGES[fieldName as keyof typeof ERROR_MESSAGES],
      statusCode: 409,
    };
  }

  return {
    message: "An unexpected error occurred.",
    statusCode: 409,
  };
}
