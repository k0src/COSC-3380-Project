import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import styles from "./Settings.module.css";

import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";

const Settings: React.FC = () => {
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  const handleDelete = () => {
    // TODO: wire up real delete logic to backend
    setConfirmOpen(false);
    // small UX: give visual confirmation
    alert("Account deleted!"); // placeholder
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
              <a className={styles.link} href="#">
                Change
              </a>
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
    </>
  );
};

export default Settings;
