import { memo, useState, useRef, useCallback, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "@contexts";
import { useAsyncData } from "@hooks";
import { notificationsApi } from "@api";
import { MainLayoutSearchBar, NotificationModal } from "@components";
import styles from "./MainLayoutHeader.module.css";
import classNames from "classnames";
import {
  LuHouse,
  LuRss,
  LuBell,
  LuSettings,
  LuCircleUser,
} from "react-icons/lu";

const MainLayoutHeader: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement | null>(null);

  const { data, refetch: refetchUnreadStatus } = useAsyncData(
    {
      hasUnreadNotifications: () =>
        notificationsApi.hasUnreadNotifications(user!.id),
    },
    [user?.id],
    {
      cacheKey: `has_unread_notifications_${user?.id}`,
      enabled: !!user?.id,
    }
  );

  const hasUnreadNotifications = data?.hasUnreadNotifications;

  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      refetchUnreadStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id, refetchUnreadStatus]);

  const handleNotifications = useCallback(() => {
    setNotificationModalOpen((prev) => !prev);
  }, []);

  return (
    <header className={styles.header}>
      <nav className={styles.headerNav}>
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? styles.navbarLinkActive : styles.navbarLink
          }
        >
          <LuHouse className={styles.navIcon} />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            isActive ? styles.navbarLinkActive : styles.navbarLink
          }
        >
          <LuRss className={styles.navIcon} />
          <span>Feed</span>
        </NavLink>
      </nav>

      <MainLayoutSearchBar />

      <div className={styles.headerActions}>
        {isAuthenticated ? (
          <>
            {/* Notification Section */}
            <div className={styles.notificationButtonWrapper}>
              <button
                onClick={handleNotifications}
                ref={notificationButtonRef}
                className={classNames(
                  styles.iconButton,
                  styles.notificationButton
                )}
              >
                <LuBell className={styles.actionIcon} />
              </button>
              {hasUnreadNotifications && (
                <div className={styles.unreadDot}></div>
              )}
              <NotificationModal
                isOpen={notificationModalOpen}
                onClose={() => setNotificationModalOpen(false)}
                buttonRef={notificationButtonRef}
                onNotificationUpdate={refetchUnreadStatus}
              />
            </div>

            {/* Settings Section */}
            <Link to="/settings" className={styles.iconButton}>
              <LuSettings className={styles.actionIcon} />
            </Link>

            {/* Profile Section */}
            <Link
              to="/me"
              className={styles.iconButton}
              title={user?.username}
            >
              <LuCircleUser className={styles.actionIcon} />
            </Link>
          </>
        ) : (
          /* Guest Section */
          <>
            <Link to="/login" className={styles.navbarLink}>
              <span>Sign In</span>
            </Link>
            <Link to="/signup" className={styles.navbarLink}>
              <span>Sign Up</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default memo(MainLayoutHeader);