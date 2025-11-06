export interface ValidationErrors {
  [key: string]: string | undefined;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Validates an email address by making sure it is not empty and follows a basic email pattern.
 * @param email The email address to validate.
 * @returns A string error message if validation fails, otherwise undefined.
 */
export const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return "Email is required";
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return "Please enter a valid email address";
  }
  return undefined;
};

/**
 * Validates a password by checking for length and character requirements.
 * @param password The password to validate.
 * @returns A string error message if validation fails, otherwise undefined.
 */
export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (password.length > 128) {
    return "Password must be less than 128 characters";
  }
  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
      password
    )
  ) {
    return "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)";
  }
  return undefined;
};

/**
 * Validates a username by checking for length requirements.
 * @param username The username to validate.
 */
export const validateUsername = (username: string): string | undefined => {
  if (!username) {
    return "Username is required";
  }
  if (username.length < 3) {
    return "Username must be at least 3 characters";
  }
  if (username.length > 50) {
    return "Username must be less than 50 characters";
  }
  return undefined;
};

/**
 * Validates that the confirmation password matches the original password.
 * @param password The original password
 * @param confirmPassword The confirmation password to validate
 * @returns A string error message if validation fails, otherwise undefined.
 */
export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string | undefined => {
  if (!confirmPassword) {
    return "Please confirm your password";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return undefined;
};

/**
 * Validates the login form data.
 * @param formData The login form data to validate.
 * @returns An object containing validation errors, if any.
 */
export const validateLoginForm = (
  formData: LoginFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  if (!formData.password) {
    errors.password = "Password is required";
  }

  return errors;
};

/**
 * Validates the signup form data.
 * @param formData The signup form data to validate.
 * @returns An object containing validation errors, if any.
 */
export const validateSignupForm = (
  formData: SignupFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  const usernameError = validateUsername(formData.username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validateConfirmPassword(
    formData.password,
    formData.confirmPassword
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  return errors;
};
