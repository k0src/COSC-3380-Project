import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts";
import type { SignupData } from "../../types";
import styles from "./SignupPage.module.css";
import { PageLoader } from "../../components";
import classNames from "classnames";

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<SignupData>({
    username: "",
    email: "",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { signup, isAuthenticated, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      setIsSubmitting(false);
    }
  }, [error]);

  const validateForm = (): boolean => {
    const errors: {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!formData.username) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 50) {
      errors.username = "Username must be less than 50 characters";
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "confirmPassword") {
      setConfirmPassword(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }));
    }

    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signup(formData);
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Sign Up - CoogMusic</title>
      </Helmet>

      <div className={styles.signupLayout}>
        <div className={styles.signupContainer}>
          <div className={styles.signupHeader}>
            <img src="/logo.svg" alt="CoogMusic" className={styles.logo} />
            <div className={styles.signupHeaderBottom}>
              <span className={styles.title}>Join CoogMusic</span>
              <span className={styles.subtitle}>
                Create your account to get started
              </span>
            </div>
          </div>

          <form className={styles.signupForm} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.formLabel}>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={classNames(styles.input, {
                  [styles.inputError]: !!validationErrors.username,
                })}
                placeholder="Choose a username"
                disabled={isSubmitting}
              />
              {validationErrors.username && (
                <span className={styles.inputErrorText}>
                  {validationErrors.username}
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={classNames(styles.input, {
                  [styles.inputError]: !!validationErrors.email,
                })}
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
              {!validationErrors.email && (
                <span className={styles.inputErrorText}>
                  {validationErrors.email}
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={classNames(styles.input, {
                  [styles.inputError]: !!validationErrors.password,
                })}
                placeholder="Create a password"
                disabled={isSubmitting}
              />
              {validationErrors.password && (
                <span className={styles.inputErrorText}>
                  {validationErrors.password}
                </span>
              )}
              <div className={styles.passwordHint}>
                <span className={styles.hintText}>
                  8+ characters with uppercase, lowercase, and number
                </span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.formLabel}>
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleInputChange}
                className={classNames(styles.input, {
                  [styles.inputError]: !!validationErrors.confirmPassword,
                })}
                placeholder="Confirm your password"
                disabled={isSubmitting}
              />
              {validationErrors.confirmPassword && (
                <span className={styles.inputErrorText}>
                  {validationErrors.confirmPassword}
                </span>
              )}
            </div>

            {error && (
              <div className={styles.serverError}>
                <span className={styles.errorText}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Creating Account...</span>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className={styles.signupFooter}>
            <Link to="/login" className={styles.footerLink}>
              Already have an account?
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
