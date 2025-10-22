import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts";
import type { SignupData } from "../../types";
import { validateSignupForm, type ValidationErrors } from "../../validators";
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

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

  useEffect(() => {
    return () => {
      if (error) {
        clearError();
      }
    };
  }, []);

  const validateForm = (): boolean => {
    const errors = validateSignupForm({
      ...formData,
      confirmPassword,
    });
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

    if (validationErrors[name]) {
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
              {validationErrors.email && (
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
