import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@contexts";
import type { SignupData } from "@types";
import { validateSignupForm, type ValidationErrors } from "@validators";
import { InputGroup, FormSubmitButton, PageLoader } from "@components";

import styles from "./SignupPage.module.css";
import logo from "@assets/logo.svg";

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<SignupData>({
    username: "",
    email: "",
    password: "",
    role: "USER",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            <img src={logo} alt="CoogMusic" className={styles.logo} />
            <div className={styles.signupHeaderBottom}>
              <span className={styles.title}>Join CoogMusic</span>
              <span className={styles.subtitle}>
                Create your account to get started
              </span>
            </div>
          </div>

          <form className={styles.signupForm} onSubmit={handleSubmit}>
            <InputGroup
              label="Username"
              type="text"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Choose a username"
              error={validationErrors.username}
              disabled={isSubmitting}
            />
            <InputGroup
              label="Email"
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              error={validationErrors.email}
              disabled={isSubmitting}
            />
            <div className={styles.inputGroup}>
              <label htmlFor="role" className={styles.formLabel}>
                Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className={styles.select}
                disabled={isSubmitting}
              >
                <option value="USER">User</option>
                <option value="ARTIST">Artist</option>
              </select>
              <span className={styles.inputHintText}>
                Artists can upload music and create artist profiles
              </span>
            </div>
            <InputGroup
              label="Password"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a password"
              error={validationErrors.password}
              disabled={isSubmitting}
              hint="8+ characters with uppercase, lowercase, number, and special character (@$!%*?&)"
            />
            <InputGroup
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              error={validationErrors.confirmPassword}
              disabled={isSubmitting}
            />

            {error && (
              <div className={styles.serverError}>
                <span className={styles.errorText}>{error}</span>
              </div>
            )}

            <FormSubmitButton
              text={isSubmitting ? "Signing Up..." : "Sign Up"}
              disabled={isSubmitting}
            />
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
