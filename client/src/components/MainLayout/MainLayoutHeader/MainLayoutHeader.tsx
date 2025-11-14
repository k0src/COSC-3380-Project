import React, { memo } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import classNames from "classnames";

import { useAuth } from "@contexts";
import { MainLayoutSearchBar } from "@components";

import styles from "./MainLayoutHeader.module.css";
import {
  LuHouse,
  LuRss,
  LuBell,
  LuSettings,
  LuCircleUser,
} from "react-icons/lu";

const MainLayoutHeader: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const handleFeedClick = (
    event: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    if (isAuthenticated) {
      return;
    }

    event.preventDefault();
    navigate("/login", { state: { from: "/feed" } });
  };

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
          onClick={handleFeedClick}
        >
          <LuRss className={styles.navIcon} />
          <span>Feed</span>
        </NavLink>
      </nav>

      <MainLayoutSearchBar />

      <div className={styles.headerActions}>
        {isAuthenticated ? (
          <>
            <button
              className={classNames(
                styles.iconButton,
                styles.notificationButton
              )}
            >
              <LuBell className={styles.actionIcon} />
            </button>
            <Link to="/settings" className={styles.iconButton}>
              <LuSettings className={styles.actionIcon} />
            </Link>
            <Link to="/me" className={styles.iconButton} title={user?.username}>
              <LuCircleUser className={styles.actionIcon} />
            </Link>
          </>
        ) : (
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
