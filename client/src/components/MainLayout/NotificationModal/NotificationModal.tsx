import { memo, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { formatRelativeDate } from "@util";
import { useAsyncData } from "@hooks";
import type { UUID, Notification } from "@types";
import { notificationsApi } from "@api";
import styles from "./NotificationModal.module.css";
import {
  LuX,
  LuArchive,
  LuCheckCheck,
  LuSettings,
  LuThumbsUp,
  LuMessageSquareText,
  LuAtSign,
  LuUserRoundPlus,
  LuTrendingUp,
  LuChartLine,
  LuCircleAlert,
  LuInfo,
  LuTriangleAlert,
} from "react-icons/lu";
import classNames from "classnames";

const NotificationItem = memo(
  ({
    notification,
    userId,
    onClose,
    onRefetch,
    onNotificationUpdate,
  }: {
    notification: Notification;
    userId: UUID;
    onClose: () => void;
    onRefetch: () => void;
    onNotificationUpdate?: () => void;
  }) => {
    const navigate = useNavigate();

    const NotificationIcon: React.ElementType = useMemo(() => {
      switch (notification.type) {
        case "LIKE":
          return LuThumbsUp;
        case "COMMENT":
          return LuMessageSquareText;
        case "MENTION":
          return LuAtSign;
        case "FOLLOW":
          return LuUserRoundPlus;
        case "TRENDING":
          return LuTrendingUp;
        case "STATS":
          return LuChartLine;
        case "ALERT":
          return LuCircleAlert;
        case "INFO":
          return LuInfo;
        case "DANGER":
          return LuTriangleAlert;
        default:
          return LuInfo;
      }
    }, [notification.type]);

    //! fix db - one link per notification
    const notificationLink = useMemo(() => {
      return notification.links?.[0]?.url || null;
    }, [notification.links]);

    const handleNotificationClick = useCallback(async () => {
      try {
        await notificationsApi.markAsRead(userId, notification.id);
        onRefetch();
        onNotificationUpdate?.();
        if (notificationLink) {
          onClose();
          navigate(notificationLink);
        }
      } catch (error) {
        console.error("Error handling notification click:", error);
      }
    }, [
      userId,
      notification.id,
      notificationLink,
      navigate,
      onRefetch,
      onNotificationUpdate,
    ]);

    const handleArchive = useCallback(
      async (event: React.MouseEvent) => {
        event.stopPropagation();
        try {
          await notificationsApi.archive(userId, notification.id);
          onRefetch();
          onNotificationUpdate?.();
        } catch (error) {
          console.error("Error archiving notification:", error);
        }
      },
      [userId, notification.id, onRefetch, onNotificationUpdate]
    );

    return (
      <div
        className={styles.notificationItem}
        onClick={handleNotificationClick}
      >
        <div className={styles.notificationLeft}>
          <div className={styles.notificationIconWrapper}>
            <NotificationIcon className={styles.notificationIcon} />
          </div>
          <div className={styles.notificationContent}>
            <span className={styles.notificationText}>
              {notification.notification_text}
            </span>
            <span className={styles.notificationDate}>
              {formatRelativeDate(notification.notified_at)}
            </span>
          </div>
        </div>

        {!notification.is_read ? (
          <div className={styles.statusDot}></div>
        ) : (
          <button className={styles.archiveButton} onClick={handleArchive}>
            <LuArchive />
          </button>
        )}
      </div>
    );
  }
);

type TabType = "all" | "unread";

export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  onNotificationUpdate?: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  buttonRef,
  onNotificationUpdate,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const hasRefetchedRef = useRef<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("unread");

  const { data, loading, error, refetch } = useAsyncData(
    { notifications: () => notificationsApi.getNotifications(user!.id, true) },
    [user!.id],
    {
      cacheKey: `notifications_${user!.id}`,
      enabled: !!user,
    }
  );

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isOpen && user && !hasRefetchedRef.current) {
      refetch();
      hasRefetchedRef.current = true;
    } else if (!isOpen) {
      hasRefetchedRef.current = false;
    }
  }, [isOpen, user]);

  const notifications = data?.notifications ?? [];

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, buttonRef]);

  const handleSettings = useCallback(() => {
    navigate("/me/settings");
    onClose();
  }, [navigate]);

  const handleTabClick = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead(user!.id);
      refetch();
      onNotificationUpdate?.();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [user!.id, refetch, onNotificationUpdate]);

  const handleArchiveAll = useCallback(async () => {
    try {
      await notificationsApi.archiveAll(user!.id);
      refetch();
      onNotificationUpdate?.();
    } catch (error) {
      console.error("Error archiving all notifications:", error);
    }
  }, [user!.id, refetch, onNotificationUpdate]);

  const unreadNotifications = useMemo(
    () => notifications.filter((notif) => !notif.is_read),
    [notifications]
  );

  if (!isOpen || !user) return null;

  return (
    <div ref={modalRef} className={styles.notificationsModal}>
      <div className={styles.header}>
        <span className={styles.title}>Notifications</span>
        <div className={styles.headerButtons}>
          <button className={styles.headerButton} onClick={handleSettings}>
            <LuSettings />
          </button>
          <button className={styles.headerButton} onClick={onClose}>
            <LuX />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.loaderContainer}>
          <PuffLoader color="var(--color-accent)" size={35} />
        </div>
      ) : error ? (
        <div className={styles.error}>Error loading notifications.</div>
      ) : (
        <>
          <div className={styles.tabs}>
            <button
              className={classNames(styles.tab, {
                [styles.activeTab]: activeTab === "all",
              })}
              onClick={() => handleTabClick("all")}
            >
              All
            </button>
            <button
              className={classNames(styles.tab, {
                [styles.activeTab]: activeTab === "unread",
              })}
              onClick={() => handleTabClick("unread")}
            >
              {`Unread (${unreadNotifications.length})`}
            </button>
          </div>

          <div className={styles.notificationsContainer}>
            {activeTab === "all" ? (
              notifications.length === 0 ? (
                <div className={styles.noNotifications}>No notifications</div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    userId={user.id}
                    onClose={onClose}
                    onRefetch={refetch}
                    onNotificationUpdate={onNotificationUpdate}
                  />
                ))
              )
            ) : unreadNotifications.length === 0 ? (
              <div className={styles.noNotifications}>
                No unread notifications
              </div>
            ) : (
              unreadNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  userId={user.id}
                  onClose={onClose}
                  onRefetch={refetch}
                  onNotificationUpdate={onNotificationUpdate}
                />
              ))
            )}
          </div>

          <div className={styles.footer}>
            <button
              className={styles.footerButton}
              onClick={handleMarkAllAsRead}
              disabled={unreadNotifications.length === 0}
            >
              <LuCheckCheck /> Mark all as read
            </button>
            <button
              className={styles.footerButton}
              onClick={handleArchiveAll}
              disabled={notifications.length === 0}
            >
              <LuArchive /> Archive all
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default memo(NotificationModal);
