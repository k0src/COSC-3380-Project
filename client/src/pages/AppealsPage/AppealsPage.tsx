import { memo, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { useAsyncData } from "@hooks";
import { capitalize } from "@util";
import { songApi, albumApi, playlistApi, userApi, adminApi } from "@api";
import { SettingsTextArea, ErrorPage, PageLoader } from "@components";
import styles from "./AppealsPage.module.css";
import type {
  Song,
  Album,
  Playlist,
  User,
  AccessContext,
  ReportableEntityType,
} from "@types";

const AppealsPage: React.FC = () => {
  const { entityType, entityId } = useParams<{
    entityType: ReportableEntityType;
    entityId: string;
  }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [hasAppealed, setHasAppealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isAuthenticated || !user) {
    navigate("/login");
    return;
  }

  if (
    !entityType ||
    !entityId ||
    !["song", "album", "playlist", "user"].includes(entityType)
  ) {
    return (
      <ErrorPage
        title="Invalid Appeal Request"
        message="The appeal request is invalid."
      />
    );
  }

  const accessContext: AccessContext = {
    role: user?.role === "ADMIN" ? "admin" : "user",
    userId: user?.id,
    scope: "owner",
  };

  const { data, loading } = useAsyncData(
    {
      entity: async () => {
        switch (entityType) {
          case "song":
            return await songApi.getSongDetails(entityId, accessContext);
          case "album":
            return await albumApi.getAlbumDetails(entityId, accessContext);
          case "playlist":
            return await playlistApi.getPlaylistById(entityId, accessContext, {
              includeUser: true,
            });
          case "user":
            return await userApi.getUserById(entityId);
          default:
            return null;
        }
      },
      pendingAppeal: () =>
        adminApi.checkPendingAppeal(user.id, entityType, entityId),
    },
    [entityType, entityId, user.id],
    {
      cacheKey: `appeal_${entityType}_${entityId}`,
      hasBlobUrl: true,
    }
  );

  const entity = data?.entity as Song | Album | Playlist | User | null;
  const hasPendingAppeal = data?.pendingAppeal?.hasPendingAppeal ?? false;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccessMessage("");

      if (!reason.trim()) {
        setError("Please provide a reason for your appeal.");
        return;
      }

      if (reason.length > 500) {
        setError("Reason must be 500 characters or less.");
        return;
      }

      setIsSubmitting(true);

      try {
        await adminApi.submitAppeal(user.id, entityType, entityId, reason);
        setSuccessMessage(
          "Your appeal has been submitted successfully. You will be notified of the decision."
        );
        setReason("");
      } catch (error: any) {
        setError(
          error.response?.data?.error ||
            "Failed to submit appeal. Please try again."
        );
      } finally {
        setIsSubmitting(false);
        setHasAppealed(true);
      }
    },
    [entityType, entityId, reason]
  );

  if (loading) {
    return <PageLoader />;
  }

  if (!entity) {
    return (
      <ErrorPage
        title="Entity Not Found"
        message="The requested entity does not exist."
      />
    );
  }

  if (
    entityType !== "user" &&
    "owner_id" in entity &&
    entity.owner_id !== user.id
  ) {
    return (
      <ErrorPage
        title="Invalid Appeal Request"
        message="You are not authorized to appeal this content."
      />
    );
  }

  const isUnlisted =
    entityType === "user"
      ? (entity as User).status === "SUSPENDED"
      : (entity as Song | Album | Playlist).visibility_status === "UNLISTED";

  if (!isUnlisted) {
    return (
      <ErrorPage
        title="Cannot Appeal"
        message={`This ${entityType.slice(
          0,
          -1
        )} is not unlisted or suspended. Appeals can only be submitted for unlisted or suspended content.`}
      />
    );
  }

  const getEntityTitle = () => {
    if (entityType === "user") return (entity as User).username;
    return (entity as Song | Album | Playlist).title;
  };

  const getEntityType = () => {
    return capitalize(entityType);
  };

  return (
    <>
      <Helmet>
        <title>Submit Appeal - CoogMusic</title>
      </Helmet>

      <div className={styles.appealsLayout}>
        <div className={styles.appealsContainer}>
          <header className={styles.appealsHeader}>
            <h1 className={styles.appealsTitle}>Submit Appeal</h1>
            <p className={styles.appealsSubtitle}>
              Your {getEntityType().toLowerCase()} has been{" "}
              {entityType === "user" ? "suspended" : "unlisted"}. You can submit
              an appeal to request a review.
            </p>
          </header>

          <div className={styles.entityInfo}>
            <div className={styles.entityInfoHeader}>
              {getEntityType()} Information
            </div>
            <div className={styles.entityInfoContent}>
              <div className={styles.entityInfoRow}>
                <span className={styles.entityInfoLabel}>
                  {getEntityType()} Name:
                </span>
                <span className={styles.entityInfoValue}>
                  {getEntityTitle()}
                </span>
              </div>
              <div className={styles.entityInfoRow}>
                <span className={styles.entityInfoLabel}>Status:</span>
                <span className={styles.entityInfoValueDanger}>
                  {entityType === "user" ? "Suspended" : "Unlisted"}
                </span>
              </div>
            </div>
          </div>

          {hasPendingAppeal ? (
            <div className={styles.pendingAppealMessage}>
              <div className={styles.pendingAppealHeader}>
                Appeal Already Submitted
              </div>
              <p className={styles.pendingAppealText}>
                You have already submitted an appeal for this{" "}
                {getEntityType().toLowerCase()}. Your appeal is currently being
                reviewed. You will be notified once a decision has been made.
              </p>
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className={styles.cancelButton}
                >
                  Go Home
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.appealsForm}>
              <SettingsTextArea
                label="Appeal Reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you believe this content does not violate our guidelines..."
                height="medium"
                required
                hint={`${reason.length}/500 characters`}
                error={error}
                disabled={isSubmitting || hasAppealed}
              />

              {successMessage && (
                <div className={styles.successMessage}>{successMessage}</div>
              )}

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className={styles.cancelButton}
                  disabled={isSubmitting || hasAppealed}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || hasAppealed}
                >
                  Submit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(AppealsPage);
