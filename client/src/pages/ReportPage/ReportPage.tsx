import React, { useState } from "react";
import {type UUID} from "../../types/index";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@contexts";
import { reportsApi } from "@api/reports.api";
import styles from "./ReportPage.module.css";

const ReportPage: React.FC = () => {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract entity and entityId from URL path
  // URL structure: /songs/id, /artists/id, /playlists/id, /albums/id, /users/id
  const pathParts = location.pathname.split('/').filter(Boolean);
  const entityPlural = pathParts[pathParts.length - 2]; // e.g., "songs", "artists", "playlists"
  const entityId = pathParts[pathParts.length - 1]; // the UUID
  
  const entityType = entityPlural?.replace(/s$/, '').toUpperCase();

  if (!isAuthenticated || !user) {
    return null;
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason || !description.trim()) {
      setError("Please select a reason and add a short description.");
      return;
    }

    // If the userId, entityId and its type are not found
    if (!user?.id || !entityId || !entityType) {
      setError("Missing required information to submit report.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await reportsApi.createReport({
        reporterId: user.id,
        reportedEntityId: entityId as UUID,
        reportedEntityType: entityType as
          | "SONG"
          | "ALBUM"
          | "ARTIST"
          | "PLAYLIST",
        reason: reason as "EXPLICIT" | "VIOLENT" | "HATEFUL" | "COPYRIGHT",
        description,
      });

      navigate(-1); // go back to previous page
    } catch (err) {
      console.error("Error submitting report:", err);
      setError("An error occurred while submitting your report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.reportLayout}>
      <div className={styles.reportContainer}>
        <h2 className={styles.title}>Report Content</h2>
        <p className={styles.subtitle}>
          Please tell us why you’re reporting this content.
        </p>

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
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportPage;