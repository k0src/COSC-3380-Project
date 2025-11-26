import { memo, useCallback, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { useAsyncData } from "@hooks";
import { songApi, albumApi, playlistApi, userApi, adminApi } from "@api";
import { ErrorPage, PageLoader, SettingsTextArea } from "@components";
import { capitalize } from "@util";
import styles from "./AdminAppealDetailPage.module.css";
import type {
  Song,
  Album,
  Playlist,
  User,
  AccessContext,
  Appeal,
  ReportableEntityType,
  UUID,
} from "@types";
import classNames from "classnames";

const AdminAppealDetailPage: React.FC = () => {
  const { entityType, entityId } = useParams<{
    entityType: ReportableEntityType;
    entityId: string;
  }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    navigate("/login");
    return null;
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
    role: "admin",
    userId: user.id,
    scope: "owner",
  };

  const { data, loading, error } = useAsyncData(
    {
      entity: async () => {
        switch (entityType) {
          case "song":
            return await songApi.getSongDetails(entityId, accessContext);
          case "album":
            return await albumApi.getAlbumDetails(entityId, accessContext);
          case "playlist":
            return await playlistApi.getPlaylistDetails(
              entityId,
              accessContext
            );
          case "user":
            return await userApi.getUserById(entityId);
          default:
            return null;
        }
      },
      appeals: () => adminApi.getAppealsForEntity(entityType, entityId),
    },
    [entityType, entityId],
    {
      cacheKey: `admin_appeal_${entityType}_${entityId}`,
      hasBlobUrl: true,
    }
  );

  const entity = data?.entity as Song | Album | Playlist | User | null;
  const appeals = (data?.appeals as Appeal[]) || [];

  const handleResolve = useCallback(
    async (id: UUID) => {
      setIsProcessing(true);
      try {
        await adminApi.resolveAppeal(id, entityType, entityId, user.id);
        navigate("/admin/reports-appeals");
      } catch (error: any) {
        console.error("Failed to resolve appeal:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [entityType, entityId, user.id, navigate]
  );

  const handleDismiss = useCallback(
    async (id: UUID) => {
      setIsProcessing(true);
      try {
        await adminApi.dismissAppeal(id, entityType, entityId, user.id);
        navigate("/admin/reports-appeals");
      } catch (error: any) {
        console.error("Failed to dismiss appeal:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [entityType, entityId, user.id, navigate]
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

  if (error) {
    return (
      <ErrorPage
        title="Error Loading Appeal"
        message="An error occurred while loading the appeal details."
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

  const isUnlisted =
    entityType === "user"
      ? (entity as User).status === "SUSPENDED"
      : (entity as Song | Album | Playlist).visibility_status === "UNLISTED";

  const hasAppeals = appeals.length > 0;

  const allResolved = appeals.every(
    (appeal) => appeal.appeal_status === "RESOLVED"
  );

  const allDismissed = appeals.every(
    (appeal) => appeal.appeal_status === "DISMISSED"
  );

  return (
    <>
      <Helmet>
        <title>Review Appeal - Admin - CoogMusic</title>
      </Helmet>

      <div className={styles.appealsLayout}>
        <div className={styles.appealsContainer}>
          <header className={styles.appealsHeader}>
            <h1 className={styles.appealsTitle}>Review Appeal</h1>
            <p className={styles.appealsSubtitle}>
              Review the appeal(s) submitted for this{" "}
              {getEntityType().toLowerCase()}.
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
                <span
                  className={classNames(styles.entityInfoValue, {
                    [styles.entityInfoValueDanger]: isUnlisted,
                    [styles.entityInfoValueSuccess]: !isUnlisted,
                  })}
                >
                  {isUnlisted
                    ? entityType === "user"
                      ? "Suspended"
                      : "Unlisted"
                    : entityType === "user"
                    ? "Active"
                    : "Public"}
                </span>
              </div>
            </div>
          </div>

          {!hasAppeals ? (
            <div className={styles.noAppealsMessage}>
              <div className={styles.noAppealsHeader}>No Appeals Submitted</div>
              <p className={styles.noAppealsText}>
                There are no appeals submitted for this{" "}
                {getEntityType().toLowerCase()}.
              </p>
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => navigate("/admin/reports-appeals")}
                  className={styles.cancelButton}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.appealsSection}>
              {appeals.map((appeal, index) => (
                <div key={appeal.id} className={styles.appealCard}>
                  <div className={styles.appealHeader}>
                    Appeal #{index + 1}
                    <span
                      className={classNames(styles.appealStatusBadge, {
                        [styles.appealStatusPending]:
                          appeal.appeal_status === "PENDING",
                        [styles.appealStatusResolved]:
                          appeal.appeal_status === "RESOLVED",
                        [styles.appealStatusDismissed]:
                          appeal.appeal_status === "DISMISSED",
                      })}
                    >
                      {appeal.appeal_status}
                    </span>
                  </div>
                  <div className={styles.appealInfo}>
                    <div className={styles.appealInfoRow}>
                      <span className={styles.appealInfoLabel}>
                        Submitted by:
                      </span>
                      <span className={styles.appealInfoValue}>
                        {appeal.username}
                      </span>
                    </div>
                    <div className={styles.appealInfoRow}>
                      <span className={styles.appealInfoLabel}>
                        Submitted at:
                      </span>
                      <span className={styles.appealInfoValue}>
                        {new Date(appeal.submitted_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <SettingsTextArea
                    label="Appeal Reason"
                    name={`reason-${index}`}
                    value={appeal.reason}
                    onChange={() => {}}
                    height="medium"
                    disabled
                  />
                </div>
              ))}

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={() => navigate("/admin/reports-appeals")}
                  className={styles.cancelButton}
                  disabled={isProcessing}
                >
                  Back to Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => handleDismiss(appeals[0].id)}
                  className={styles.dismissButton}
                  disabled={isProcessing || allDismissed}
                >
                  Dismiss Appeal
                </button>
                <button
                  type="button"
                  onClick={() => handleResolve(appeals[0].id)}
                  className={styles.resolveButton}
                  disabled={isProcessing || allResolved}
                >
                  Resolve Appeal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default memo(AdminAppealDetailPage);
