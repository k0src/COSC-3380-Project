import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import styles from "./Settings.module.css";

import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";

const Settings: React.FC = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const changeFirstRef = useRef<HTMLInputElement | null>(null);
  const changeOverlayRef = useRef<HTMLDivElement | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const yesRef = useRef<HTMLButtonElement | null>(null);
  const noRef = useRef<HTMLButtonElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

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

  const handleDelete = () => {
    // TODO: wire up real delete logic to backend
    setConfirmOpen(false);
    // small UX: give visual confirmation
    alert("Account deleted!"); // placeholder
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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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

      <Topbar />
      <Sidebar />

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
              <input type="checkbox" />
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.sectionTitle}>Privacy</div>
            <div className={styles.listItem}>
              <span>Make account private/public</span>
              <input type="checkbox" />
            </div>
            <div style={{ marginTop: 12, color: "#fff" }}>
              Makes account invisible to other users
            </div>
          </section>
        </div>
      </main>

      <PlayerBar />

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
              <input
                ref={changeFirstRef}
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: 6,
                  marginBottom: 10,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.45)",
                  color: "#fff",
                }}
              />

              <label style={{ display: "block", fontSize: 13, color: "#ccc" }}>
                New password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: 6,
                  marginBottom: 10,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.45)",
                  color: "#fff",
                }}
              />

              <label style={{ display: "block", fontSize: 13, color: "#ccc" }}>
                Confirm new password
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginTop: 6,
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.45)",
                  color: "#fff",
                }}
              />

              <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                />
                <span style={{ fontSize: 13, color: "#ccc" }}>Show passwords</span>
              </label>
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
