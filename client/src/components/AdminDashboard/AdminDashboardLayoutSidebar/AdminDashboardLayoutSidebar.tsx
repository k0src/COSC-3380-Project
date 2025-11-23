import { memo, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts";
import { LazyImg } from "@components";
import styles from "./AdminDashboardLayoutSidebar.module.css";
import {
  LuListMusic,
  LuLogOut,
  LuHouse,
  LuChartLine,
  LuShield,
  LuUserRound,
  LuCircleAlert,
  LuFileText,
  LuBell,
} from "react-icons/lu";
import Logo from "@assets/logo.svg?react";
import userPlaceholder from "@assets/user-placeholder.webp";

const AdminDashboardLayoutSidebar: React.FC = () => {
  const { logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, navigate]);

  if (!user || !isAuthenticated || user.role !== "ADMIN") {
    navigate("/login");
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <div className={styles.pfpContainer}>
          <LazyImg
            src={user?.profile_picture_url || userPlaceholder}
            alt={`${user?.username} Image`}
            imgClassNames={[styles.pfpImage]}
            blurHash={user?.pfp_blurhash}
          />

          <div className={styles.usernameContainer}>
            <span className={styles.username}>{user?.username ?? "Admin"}</span>
            <LuShield className={styles.adminIcon} />
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuHouse className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Dashboard</span>
          </NavLink>
          <NavLink
            to="/admin/manage-users"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuUserRound className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Manage Users</span>
          </NavLink>
          <NavLink
            to="/admin/manage-content"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuListMusic className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Manage Site Content</span>
          </NavLink>
          <NavLink
            to="/admin/reports"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuCircleAlert className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Reports & Appeals</span>
          </NavLink>
          <NavLink
            to="/admin/stats"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuChartLine className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Site Statistics</span>
          </NavLink>
          <NavLink
            to="/admin/data-reports"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuFileText className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Data Reports</span>
          </NavLink>
          <NavLink
            to="/admin/notifications"
            className={({ isActive }) =>
              isActive ? styles.sidebarLinkActive : styles.sidebarLink
            }
          >
            <LuBell className={styles.sidebarIcon} />
            <span className={styles.sidebarText}>Site Notifications</span>
          </NavLink>
        </nav>
      </div>
      <div className={styles.sidebarBottom}>
        <div className={styles.sidebarLogo}>
          <Logo className={styles.logoImage} />
          <span className={styles.logoText}>Admin</span>
        </div>
        {isAuthenticated && (
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LuLogOut className={styles.sidebarIcon} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default memo(AdminDashboardLayoutSidebar);
