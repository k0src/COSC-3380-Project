import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import api from "@api/api";
import styles from "./Settings.module.css";

const Settings: React.FC = () => {
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
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
  const [songsDiscoverable, setSongsDiscoverable] = useState(true);

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
        const response = await api.get("/users/settings");
        setSongsDiscoverable(response.data.songs_discoverable ?? true);
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

      await api.post("/users/settings", body);

      if (setting === "songs_discoverable") setSongsDiscoverable(value);
    } catch (err) {
      console.error("Error updating setting:", err);
      alert("Failed to update setting");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete("/users/account");
      setConfirmOpen(false);
      setShowDeleteSuccess(true);
      
      // Redirect after 3 seconds to let user see the modal
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    } catch (err: any) {
      console.error("Error deleting account:", err);
      const errorMessage = err.response?.data?.error || err.message || "Failed to delete account";
      alert(errorMessage);
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
      await api.post("/users/change-password", { currentPassword, newPassword });
      setShowPasswordSuccess(true);
      setChangeOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      alert("Failed to change password.");
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

          {/* Notification section commented out for future use
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
          */}

          <section className={styles.card}>
            <div className={styles.sectionTitle}>Privacy</div>
            <div className={styles.listItem}>
              <span>Make songs discoverable</span>
              <input 
                type="checkbox" 
                checked={songsDiscoverable}
                onChange={(e) => handleSettingChange("songs_discoverable", e.target.checked)}
              />
            </div>
            <div style={{ marginTop: 12, color: "#fff" }}>
              (Makes your songs visible to other users)
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

      {showPasswordSuccess && (
        <div
          className={styles.successOverlay}
          onClick={() => setShowPasswordSuccess(false)}
        >
          <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.successTitle}>Password Changed!</h2>
            <p className={styles.successMessage}>
              Your password has been updated successfully.
            </p>
            <button
              className={styles.successButton}
              onClick={() => setShowPasswordSuccess(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showDeleteSuccess && (
        <div
          className={styles.deleteSuccessOverlay}
          onClick={() => {}}
        >
          <div className={styles.deleteSuccessModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteSuccessIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.deleteSuccessTitle}>Account Deleted</h2>
            <p className={styles.deleteSuccessMessage}>
              Your account has been successfully deleted. We hope to see you again soon!
            </p>
            <p className={styles.deleteCountdown}>
              Redirecting in a moment...
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;
