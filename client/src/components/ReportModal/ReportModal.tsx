import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { reportsApi } from "@api/reports.api";
import styles from "./ReportModal.module.css";

export type ReportEntityType = "SONG" | "ARTIST" | "ALBUM" | "PLAYLIST";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType: ReportEntityType;
}

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  entityId,
  entityType,
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  if (!isAuthenticated || !user) {
    // if not authenticated, close modal and navigate to login
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason || !description.trim()) {
      setError("Please select a reason and add a short description.");
      return;
    }

    if (!user?.id || !entityId || !entityType) {
      setError("Missing required information to submit report.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await reportsApi.createReport({
        reporterId: user.id,
        reportedEntityId: entityId,
        reportedEntityType: entityType,
        reason: reason as "EXPLICIT" | "VIOLENT" | "HATEFUL" | "COPYRIGHT",
        description,
      });

      onClose();
    } catch (err) {
      console.error("Error submitting report:", err);
      setError("An error occurred while submitting your report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.reportLayout} onClick={onClose}>
      <div className={styles.reportContainer} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Report Content</h2>
        <p className={styles.subtitle}>Please tell us why you’re reporting this content.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>Select a reason</label>
          <select
            className={styles.select}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">-- Choose a reason --</option>
            <option value="EXPLICIT">Sexual / Explicit Content</option>
            <option value="VIOLENT">Violent Content</option>
            <option value="HATEFUL">Hateful / Deceptive Content</option>
            <option value="COPYRIGHT">Copyright Violation</option>
          </select>

          <label className={styles.label}>Description</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain briefly..."
            rows={4}
          />

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.buttonGroup}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
