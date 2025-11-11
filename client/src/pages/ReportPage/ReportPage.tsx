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

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Example: URL query params -> ?entityId=abc&entityType=song
  const searchParams = new URLSearchParams(location.search);
  const entityId = `8ac798e2-605e-4d3b-bc45-db87af811cab`;  // searchParams.get("entityId")
  const entityType = "SONG"; // searchParams.get("entityType")?.toUpperCase()

  const dummyId = "e3890941-e65a-4a6a-bad6-07623c3f2f74";
  const testUserId = dummyId || user?.id;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason || !description.trim()) {
      setError("Please select a reason and add a short description.");
      return;
    }

    // If the userId, entityId and its type are not found
    if (!testUserId || !entityId || !entityType) {
      setError("Missing required information to submit report.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await reportsApi.createReport({
        reporterId: testUserId,
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