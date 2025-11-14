import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  SettingsSection,
  SettingsInput,
  SettingsToggle,
  SettingsColorSchemeSelector,
  SettingsDropdown,
  SettingsRadio,
} from "@components";
import { useAuth } from "@contexts";
import styles from "./SettingsPage.module.css";
import classNames from "classnames";

const SettingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate("/login");
    return;
  }

  const handleArtistDashboardNavigate = () => {
    navigate("/artist-dashboard");
  };

  const themeOptions = [
    { value: "default", label: "Default" },
    { value: "nord", label: "Nord" },
    { value: "dracula", label: "Dracula" },
    { value: "gruvbox", label: "Gruvbox" },
    { value: "everforest", label: "Everforest" },
    { value: "atom", label: "Atom" },
    { value: "one-dark", label: "One Dark" },
    { value: "rose-pine", label: "Rose Pine" },
    { value: "github", label: "GitHub" },
  ];

  const zoomOptions = [
    { value: "80", label: "80%" },
    { value: "90", label: "90%" },
    { value: "100", label: "100%" },
    { value: "110", label: "110%" },
    { value: "120", label: "120%" },
  ];

  return (
    <>
      <Helmet>
        <title>Settings - CoogMusic</title>
      </Helmet>

      <div className={styles.settingsLayout}>
        <span className={styles.settingsTitle}>Settings</span>
        <SettingsSection
          title="Account Settings"
          description="Manage your account information and preferences."
        >
          {/* img */}
          <SettingsInput
            label="Username"
            name="username"
            value={user?.username || ""}
            onChange={() => {}}
            placeholder="Change username"
          />
          <SettingsInput
            label="Email Address"
            name="email"
            value={user?.email || ""}
            onChange={() => {}}
            placeholder="Change email address"
          />
          <SettingsToggle
            label="Account Privacy"
            name="privacy"
            checked={false}
            onChange={() => {}}
            values={{ on: "Private", off: "Public" }}
            hint="Control whether your profile is visible to other users"
          />
          <button className={styles.settingsButton}>Change Password</button>
        </SettingsSection>

        {user && (user.role === "ARTIST" || user.role === "ADMIN") && (
          <SettingsSection
            title="Artist Settings"
            description="Manage your artist preferences."
          >
            <div className={styles.artistToggleGrid}>
              <SettingsToggle
                label="Like Notifications"
                name="artist-like-notifications"
                checked={true}
                onChange={() => {}}
                values={{ on: "All", off: "None" }}
                hint="Get notified when someone likes your albums or songs"
              />
              <SettingsToggle
                label="Comment Notifications"
                name="artist-comment-notifications"
                checked={true}
                onChange={() => {}}
                values={{ on: "All", off: "None" }}
                hint="Get notified when someone comments on your song"
              />
              <SettingsToggle
                label="Discoverability"
                name="artist-discoverability"
                checked={true}
                onChange={() => {}}
                values={{ on: "Shown", off: "Unlisted" }}
                hint="Control whether your profile is discoverable in searches and recommendations"
              />
            </div>
            <button
              className={styles.settingsButton}
              onClick={handleArtistDashboardNavigate}
            >
              Go to Artist Dashboard
            </button>
          </SettingsSection>
        )}

        <SettingsSection
          title="Notification Settings"
          description="Manage your notification preferences."
        >
          <div className={styles.notificationsToggleGrid}>
            <SettingsToggle
              label="New Releases"
              name="release-notifications"
              checked={true}
              onChange={() => {}}
              values={{ on: "All", off: "None" }}
              hint="Get notified when artists you follow release new music"
            />
            <SettingsToggle
              label="Playlist Likes"
              name="playlist-notifications"
              checked={false}
              onChange={() => {}}
              values={{ on: "All", off: "None" }}
              hint="Get notified when someone likes your public playlists"
            />
            <SettingsToggle
              label="New Followers"
              name="follower-notifications"
              checked={true}
              onChange={() => {}}
              values={{ on: "All", off: "None" }}
              hint="Get notified when someone follows you"
            />
            <SettingsToggle
              label="Comment Mentions"
              name="comment-notifications"
              checked={true}
              onChange={() => {}}
              values={{ on: "All", off: "None" }}
              hint="Get notified when someone mentions you in a comment"
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Appearance Settings"
          description="Customize the look and feel of CoogMusic."
        >
          <SettingsColorSchemeSelector
            label="Color Scheme"
            value="system"
            onChange={() => {}}
            name="color-scheme"
            disabled={false}
          />
          <SettingsDropdown
            label="Theme"
            name="theme"
            value="default"
            options={themeOptions}
            onChange={() => {}}
            hint="Select your preferred application theme"
            placeholder="Select Theme"
            disabled={false}
          />
          <SettingsRadio
            label="Zoom Level"
            name="zoom-level"
            value="100"
            onChange={() => {}}
            options={zoomOptions}
            disabled={false}
            hint="Adjust the overall zoom level of the application"
          />
        </SettingsSection>

        <SettingsSection
          title="Danger Zone"
          danger={true}
          showDivider={false}
          hasForm={false}
        >
          <div className={styles.dangerButtonContainer}>
            <button className={styles.dangerButton} onClick={() => {}}>
              Deactivate Account
            </button>
            <button className={styles.dangerButton} onClick={() => {}}>
              Delete Account
            </button>
          </div>
          <div className={styles.dangerZoneHint}>
            <span>
              Deactivating your account will{" "}
              <strong>disable your profile</strong> and{" "}
              <strong>remove your presence</strong> from CoogMusic.
            </span>
            <span>
              Deletion is <strong>permanent</strong> and will erase all your
              data. This action <strong>cannot be undone</strong>.
            </span>
          </div>
        </SettingsSection>
      </div>
    </>
  );
};

export default memo(SettingsPage);
