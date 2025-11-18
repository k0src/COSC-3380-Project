import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@contexts";
import type { LoginData } from "@types";
import { validateLoginForm, type ValidationErrors } from "@validators";
import { InputGroup, FormSubmitButton, PageLoader } from "@components";

import styles from "./LoginPage.module.css";
import Logo from "@assets/logo.svg?react";

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
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
    const errors = validateLoginForm(formData);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

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
      await login(formData);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Login - CoogMusic</title>
      </Helmet>

      <div className={styles.loginLayout}>
        <div className={styles.loginContainer}>
          <div className={styles.loginHeader}>
            <Logo className={styles.logo} />
            <div className={styles.loginHeaderBottom}>
              <span className={styles.title}>Welcome Back</span>
              <span className={styles.subtitle}>
                Sign in to your CoogMusic account
              </span>
            </div>
          </div>

          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <InputGroup
              label="Email"
              type="email"
              id="email"
              value={formData.email}
              onChange={handleInputChange}
              name="email"
              placeholder="Enter your email"
              error={validationErrors.email}
              disabled={isSubmitting}
            />
            <InputGroup
              label="Password"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              error={validationErrors.password}
              disabled={isSubmitting}
            />

            {error && (
              <div className={styles.serverError}>
                <span className={styles.errorText}>{error}</span>
              </div>
            )}

            <FormSubmitButton
              text={isSubmitting ? "Signing In..." : "Sign In"}
              disabled={isSubmitting}
            />
          </form>

          <div className={styles.loginFooter}>
            <Link to="/signup" className={styles.footerLink}>
              Don't have an account?
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
