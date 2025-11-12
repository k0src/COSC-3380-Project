import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import styles from "./Settings.module.css";

const Settings: React.FC = () => {
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const changeFirstRef = useRef<HTMLInputElement | null>(null);
  const changeOverlayRef = useRef<HTMLDivElement | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const yesRef = useRef<HTMLButtonElement | null>(null);
  const noRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  
  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);

  // Manage focus when dialog opens
  useEffect(() => {
    if (confirmOpen) {
      // focus the Yes button when dialog opens
      setTimeout(() => yesRef.current?.focus(), 0);
    }
  }, [confirmOpen]);

  useEffect(() => {
    if (changeOpen) {
      // focus the first input when dialog opens
      setTimeout(() => changeFirstRef.current?.focus(), 0);
    }
  }, [changeOpen]);

  // trap focus and handle Escape
  useEffect(() => {
    if (!confirmOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConfirmOpen(false);
        return;
      }

      if (e.key === "Tab") {
        const focusable = overlayRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

  // trap focus and handle Escape for change password dialog
  useEffect(() => {
    if (!changeOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setChangeOpen(false);
        return;
      }

      if (e.key === "Tab") {
        const focusable = changeOverlayRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [changeOpen]);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/users/settings", {
          method: "GET",
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications ?? true);
          setIsPrivate(data.isPrivate ?? false);
        }
      } catch (err) {
        console.warn("Failed to load settings:", err);
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = async (setting: string, value: boolean) => {
    try {
      const body: any = {};
      body[setting] = value;

      const res = await fetch("/api/users/settings", {
        method: "POST",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        if (setting === "notifications") setNotifications(value);
        if (setting === "isPrivate") setIsPrivate(value);
      } else {
        alert("Failed to update setting");
      }
    } catch (err) {
      console.error("Error updating setting:", err);
      alert("Network error while updating setting");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch("/api/users/account", {
        method: "DELETE",
        credentials: 'include',
      });

      if (res.ok) {
        setConfirmOpen(false);
        alert("Account deleted successfully!");
        // Redirect to login or home page
        window.location.href = "/";
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Failed to delete account");
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Network error while deleting account");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      alert("Please fill all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters.");
      return;
    }

    try {
      // attempt to call backend change-password endpoint
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setChangeOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        alert("Password changed successfully.");
      } else {
        const data = await res.json().catch(() => null);
        alert((data && data.error) || "Failed to change password.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error while changing password.");
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings</title>
      </Helmet>

      <main className={styles.contentWrapper}>
        <header className={styles.header}>
          <h1 className={styles.headingPrimary}>Settings</h1>
        </header>

        <div className={styles.settingsGrid}>
          <section className={styles.card}>
            <div className={styles.sectionTitle}>Account</div>
            <div className={styles.listItem}>
              <span>Change Password</span>
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.preventDefault();
                  setChangeOpen(true);
                }}
              >
                Change
              </button>
            </div>
            <div className={styles.listItem}>
              <span>Delete Account</span>
              <button
                className={styles.deleteBtn}
                onClick={() => setConfirmOpen(true)}
              >
                Delete Account
              </button>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionTitle}>Notification</div>
            <div className={styles.listItem}>
              <span>Notify when artist releases a song</span>
              <input 
                type="checkbox" 
                checked={notifications}
                onChange={(e) => handleSettingChange("notifications", e.target.checked)}
              />
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionTitle}>Privacy</div>
            <div className={styles.listItem}>
              <span>Make account private/public</span>
              <input 
                type="checkbox" 
                checked={isPrivate}
                onChange={(e) => handleSettingChange("isPrivate", e.target.checked)}
              />
            </div>
            <div style={{ marginTop: 12, color: "#fff" }}>
              Makes account invisible to other users
            </div>
          </section>
        </div>
      </main>

      {confirmOpen && (
        <div
          className={styles.confirmOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          ref={overlayRef}
          onClick={(e) => {
            // clicking on the overlay (outside the box) closes the dialog
            if (e.target === overlayRef.current) setConfirmOpen(false);
          }}
        >
          <div className={styles.confirmBox}>
            <p id="confirm-title">Are you sure you want to delete your account?</p>
            <div className={styles.confirmButtons}>
              <button
                ref={yesRef}
                className={styles.btnPrimary}
                onClick={handleDelete}
              >
                Yes
              </button>
              <button
                ref={noRef}
                className={styles.btnSecondary}
                onClick={() => setConfirmOpen(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {changeOpen && (
        <div
          className={styles.confirmOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-title"
          ref={changeOverlayRef}
          onClick={(e) => {
            if (e.target === changeOverlayRef.current) setChangeOpen(false);
          }}
        >
          <div className={styles.confirmBox}>
            <p id="change-title">Change your password</p>

            <div style={{ textAlign: "left", marginBottom: 8 }}>
              <label style={{ display: "block", fontSize: 13, color: "#ccc" }}>
                Current password
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, marginBottom: 10 }}>
                <input
                  ref={changeFirstRef}
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(0,0,0,0.45)",
                    color: "#fff",
                  }}
                />
                <button
                  type="button"
                  aria-pressed={showCurrent}
                  aria-label={showCurrent ? "Hide current password" : "Show current password"}
                  onClick={() => setShowCurrent((s) => !s)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    padding: "6px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {showCurrent ? "Hide" : "Show"}
                </button>
              </div>

              <label style={{ display: "block", fontSize: 13, color: "#ccc" }}>
                New password
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6, marginBottom: 10 }}>
                <input
                  type={showNewPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(0,0,0,0.45)",
                    color: "#fff",
                  }}
                />
                <button
                  type="button"
                  aria-pressed={showNewPass}
                  aria-label={showNewPass ? "Hide new password" : "Show new password"}
                  onClick={() => setShowNewPass((s) => !s)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    padding: "6px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {showNewPass ? "Hide" : "Show"}
                </button>
              </div>

              <label style={{ display: "block", fontSize: 13, color: "#ccc" }}>
                Confirm new password
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(0,0,0,0.45)",
                    color: "#fff",
                  }}
                />
                <button
                  type="button"
                  aria-pressed={showConfirmPass}
                  aria-label={showConfirmPass ? "Hide confirm password" : "Show confirm password"}
                  onClick={() => setShowConfirmPass((s) => !s)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    padding: "6px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  {showConfirmPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className={styles.confirmButtons}>
              <button className={styles.btnPrimary} onClick={handleChangePassword}>
                Change password
              </button>
              <button
                className={styles.btnSecondary}
                onClick={() => setChangeOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;
