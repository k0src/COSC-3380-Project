import React, { useState } from "react";
import { type UUID } from "../../types/index";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@contexts";
import { appealsApi } from "@api/appeals.api";
import styles from "./AppealsPage.module.css";

const AppealsPage: React.FC = () => {
  const [appealType, setAppealType] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get parameters from URL query params
  const searchParams = new URLSearchParams(location.search);
  const entityId = searchParams.get("entityId") || "8ac798e2-605e-4d3b-bc45-db87af811cab"; // fallback for testing
  const entityType = searchParams.get("entityType")?.toUpperCase() || "SONG";
  const appealContext = searchParams.get("context") || "content"; // "content" or "account"

  const dummyId = "e3890941-e65a-4a6a-bad6-07623c3f2f74";
  const testUserId = dummyId || user?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appealType || !reason.trim() || !description.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!testUserId || !entityId || !entityType) {
      setError("Missing required information to submit appeal.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await appealsApi.createAppeal({
        appealerId: testUserId,
        appealedEntityId: entityId as UUID,
        appealedEntityType: entityType as "SONG" | "ALBUM" | "PLAYLIST" | "USER",
        appealType: appealType as  "CONTENT_HIDDEN" | "ACCOUNT_SUSPENSION",
        reason,
        description,
      });

      setSuccess("Your appeal has been submitted successfully. We'll review it within 24-48 hours.");
      
      // Clear form
      setAppealType("");
      setReason("");
      setDescription("");
      
      // Navigate back
      navigate(-1);
    } catch (err) {
      console.error("Error submitting appeal:", err);
      setError("An error occurred while submitting your appeal. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (appealContext === "account") {
      return "Appeal Account Suspension";
    }
    return `Appeal ${entityType.charAt(0) + entityType.slice(1).toLowerCase()} Action`;
  };

  const getSubtitle = () => {
    if (appealContext === "account") {
      return "Request to have your account reinstated";
    }
    return "Contest the removal or hiding of your content";
  };

  const getAppealTypeOptions = () => {
    if (appealContext === "account") {
      return [
        { value: "ACCOUNT_SUSPENSION", label: "Account Suspension" }
      ];
    }
    return [
      { value: "CONTENT_HIDDEN", label: "Content was hidden from public" }
    ];
  };

  const getReasonOptions = () => {
    return [
      "Content does not violate community guidelines",
      "Content was removed by mistake",
      "I have permission/rights to use this content",
      "Content is educational or newsworthy",
      "Content is parody or fair use",
      "Account suspension was unwarranted",
      "Technical error or system malfunction",
      "Other (please explain in description)"
    ];
  };

  return (
    <div className={styles.appealsLayout}>
      <div className={styles.appealsContainer}>
        <h2 className={styles.title}>{getTitle()}</h2>
        <p className={styles.subtitle}>{getSubtitle()}</p>

        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Type of Appeal</label>
            <select
              className={styles.select}
              value={appealType}
              onChange={(e) => setAppealType(e.target.value)}
              required
            >
              <option value="">-- Select appeal type --</option>
              {getAppealTypeOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Reason for Appeal</label>
            <select
              className={styles.select}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">-- Choose a reason --</option>
              {getReasonOptions().map((reasonOption, index) => (
                <option key={index} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Additional Information</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any additional details that support your appeal..."
              rows={5}
              required
            />
            <p className={styles.helpText}>
              Include any relevant details, timestamps, or evidence that supports your appeal.
            </p>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={styles.cancelBtn}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting Appeal..." : "Submit Appeal"}
            </button>
          </div>
        </form>

        <div className={styles.infoBox}>
          <h4 className={styles.infoTitle}>What happens next?</h4>
          <ul className={styles.infoList}>
            <li>If approved, your content/account will be restored</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AppealsPage;