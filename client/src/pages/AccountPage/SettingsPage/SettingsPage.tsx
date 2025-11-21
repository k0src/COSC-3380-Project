import { memo, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  SettingsSection,
  SettingsInput,
  SettingsToggle,
  SettingsColorSchemeSelector,
  SettingsDropdown,
  SettingsRadio,
  SettingsImageUpload,
  ChangePasswordModal,
  ConfirmationModal,
} from "@components";
import { useAuth, useSettings } from "@contexts";
import styles from "./SettingsPage.module.css";
import { userApi } from "@api";

interface AccountFormData {
  username: string;
  email: string;
  privacy: boolean;
  profilePicture?: File | null;
  removeProfilePicture?: boolean;
}

interface ArtistFormData {
  likeNotifications: boolean;
  commentNotifications: boolean;
  discoverability: boolean;
}

interface NotificationFormData {
  releases: boolean;
  playlistLikes: boolean;
  followers: boolean;
  commentMentions: boolean;
}

interface AppearanceFormData {
  colorScheme: "system" | "light" | "dark";
  theme: string;
  zoomLevel: number;
}

const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, updateUser, logout, clearAuthState } =
    useAuth();
  const { settings, updateSettings, getAvailableThemes } = useSettings();
  const navigate = useNavigate();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Account form state
  const [accountForm, setAccountForm] = useState<AccountFormData>({
    username: "",
    email: "",
    privacy: false,
    profilePicture: null,
  });
  const [initialAccountForm, setInitialAccountForm] = useState<AccountFormData>(
    {
      username: "",
      email: "",
      privacy: false,
      profilePicture: null,
    }
  );
  const [isAccountDirty, setIsAccountDirty] = useState(false);
  const [isAccountSaving, setIsAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState("");

  // Artist form state
  const [artistForm, setArtistForm] = useState<ArtistFormData>({
    likeNotifications: true,
    commentNotifications: true,
    discoverability: true,
  });
  const [initialArtistForm, setInitialArtistForm] = useState<ArtistFormData>({
    likeNotifications: true,
    commentNotifications: true,
    discoverability: true,
  });
  const [isArtistDirty, setIsArtistDirty] = useState(false);
  const [isArtistSaving, setIsArtistSaving] = useState(false);
  const [artistError, setArtistError] = useState("");

  // Notification form state
  const [notificationForm, setNotificationForm] =
    useState<NotificationFormData>({
      releases: true,
      playlistLikes: false,
      followers: true,
      commentMentions: true,
    });
  const [initialNotificationForm, setInitialNotificationForm] =
    useState<NotificationFormData>({
      releases: true,
      playlistLikes: false,
      followers: true,
      commentMentions: true,
    });
  const [isNotificationDirty, setIsNotificationDirty] = useState(false);
  const [isNotificationSaving, setIsNotificationSaving] = useState(false);
  const [notificationError, setNotificationError] = useState("");

  // Appearance form state
  const [appearanceForm, setAppearanceForm] = useState<AppearanceFormData>({
    colorScheme: "system",
    theme: "default",
    zoomLevel: 100,
  });
  const [initialAppearanceForm, setInitialAppearanceForm] =
    useState<AppearanceFormData>({
      colorScheme: "system",
      theme: "default",
      zoomLevel: 100,
    });
  const [isAppearanceDirty, setIsAppearanceDirty] = useState(false);
  const [isAppearanceSaving, setIsAppearanceSaving] = useState(false);
  const [appearanceError, setAppearanceError] = useState("");

  useEffect(() => {
    if (user && settings) {
      const formData: AccountFormData = {
        username: user.username,
        email: user.email,
        privacy: user.is_private,
        profilePicture: null,
      };
      setAccountForm(formData);
      setInitialAccountForm(formData);
    }
  }, [user, settings]);

  useEffect(() => {
    if (settings) {
      const formData: ArtistFormData = {
        likeNotifications: settings.artist_like_notifications,
        commentNotifications: settings.song_comment_notifications,
        discoverability: settings.songs_discoverable,
      };
      setArtistForm(formData);
      setInitialArtistForm(formData);
    }
  }, [settings]);

  useEffect(() => {
    const isDirty =
      accountForm.username !== initialAccountForm.username ||
      accountForm.email !== initialAccountForm.email ||
      accountForm.privacy !== initialAccountForm.privacy ||
      accountForm.profilePicture !== null ||
      accountForm.removeProfilePicture === true;
    setIsAccountDirty(isDirty);
  }, [accountForm, initialAccountForm]);

  useEffect(() => {
    if (settings) {
      const formData: NotificationFormData = {
        releases: settings.release_notifications,
        playlistLikes: settings.playlist_like_notifications,
        followers: settings.follower_notifications,
        commentMentions: settings.comment_tag_notifications,
      };
      setNotificationForm(formData);
      setInitialNotificationForm(formData);
    }
  }, [settings]);

  useEffect(() => {
    const isDirty =
      artistForm.likeNotifications !== initialArtistForm.likeNotifications ||
      artistForm.commentNotifications !==
        initialArtistForm.commentNotifications ||
      artistForm.discoverability !== initialArtistForm.discoverability;
    setIsArtistDirty(isDirty);
  }, [artistForm, initialArtistForm]);

  useEffect(() => {
    if (settings) {
      const formData: AppearanceFormData = {
        colorScheme: settings.color_scheme as "system" | "light" | "dark",
        theme: settings.color_theme,
        zoomLevel: settings.zoom_level,
      };
      setAppearanceForm(formData);
      setInitialAppearanceForm(formData);
    }
  }, [settings]);

  useEffect(() => {
    const isDirty =
      notificationForm.releases !== initialNotificationForm.releases ||
      notificationForm.playlistLikes !==
        initialNotificationForm.playlistLikes ||
      notificationForm.followers !== initialNotificationForm.followers ||
      notificationForm.commentMentions !==
        initialNotificationForm.commentMentions;
    setIsNotificationDirty(isDirty);
  }, [notificationForm, initialNotificationForm]);

  useEffect(() => {
    const isDirty =
      appearanceForm.colorScheme !== initialAppearanceForm.colorScheme ||
      appearanceForm.theme !== initialAppearanceForm.theme ||
      appearanceForm.zoomLevel !== initialAppearanceForm.zoomLevel;
    setIsAppearanceDirty(isDirty);
  }, [appearanceForm, initialAppearanceForm]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleAccountFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setAccountForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    if (accountError) {
      setAccountError("");
    }
  };

  const handleAccountPrivacyChange = (checked: boolean) => {
    setAccountForm((prev) => ({ ...prev, privacy: checked }));
    if (accountError) {
      setAccountError("");
    }
  };

  const handleProfilePictureChange = (file: File | null) => {
    if (file === null) {
      setAccountForm((prev) => ({
        ...prev,
        profilePicture: null,
        removeProfilePicture: true,
      }));
    } else {
      setAccountForm((prev) => ({
        ...prev,
        profilePicture: file,
        removeProfilePicture: false,
      }));
    }
    if (accountError) {
      setAccountError("");
    }
  };

  const handleArtistFieldChange = (name: string, checked: boolean) => {
    setArtistForm((prev) => ({ ...prev, [name]: checked }));
    if (artistError) {
      setArtistError("");
    }
  };

  const handleNotificationFieldChange = (name: string, checked: boolean) => {
    setNotificationForm((prev) => ({ ...prev, [name]: checked }));
    if (notificationError) {
      setNotificationError("");
    }
  };

  const handleAppearanceFieldChange = (
    name: string,
    value: string | number
  ) => {
    setAppearanceForm((prev) => ({ ...prev, [name]: value }));
    if (appearanceError) {
      setAppearanceError("");
    }
  };

  const handleAccountSave = async () => {
    if (!user?.id) return;

    if (!accountForm.username.trim()) {
      setAccountError("Username cannot be empty");
      return;
    }

    if (!accountForm.email.trim()) {
      setAccountError("Email cannot be empty");
      return;
    }

    setIsAccountSaving(true);
    setAccountError("");

    try {
      const updateData: any = {
        username: accountForm.username.trim(),
        email: accountForm.email.trim(),
        is_private: accountForm.privacy,
      };

      if (accountForm.removeProfilePicture) {
        updateData.profile_picture_url = null;
      } else if (accountForm.profilePicture) {
        updateData.profile_picture_url = accountForm.profilePicture;
      }

      const updatedUser = await userApi.update(user.id, updateData);
      updateUser(updatedUser);

      const newInitialForm = {
        ...accountForm,
        profilePicture: null,
        removeProfilePicture: false,
      };
      setInitialAccountForm(newInitialForm);
      setAccountForm(newInitialForm);
      setIsAccountDirty(false);
    } catch (error: any) {
      console.error("Error saving account settings:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to save account settings";
      setAccountError(errorMessage);
    } finally {
      setIsAccountSaving(false);
    }
  };

  const handleArtistSave = async () => {
    if (!user?.id) return;

    setIsArtistSaving(true);
    setArtistError("");

    try {
      await updateSettings({
        artist_like_notifications: artistForm.likeNotifications,
        song_comment_notifications: artistForm.commentNotifications,
        songs_discoverable: artistForm.discoverability,
      });

      setInitialArtistForm(artistForm);
      setIsArtistDirty(false);
    } catch (error: any) {
      console.error("Error saving artist settings:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to save artist settings";
      setArtistError(errorMessage);
    } finally {
      setIsArtistSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    if (!user?.id) return;

    setIsNotificationSaving(true);
    setNotificationError("");

    try {
      await updateSettings({
        release_notifications: notificationForm.releases,
        playlist_like_notifications: notificationForm.playlistLikes,
        follower_notifications: notificationForm.followers,
        comment_tag_notifications: notificationForm.commentMentions,
      });

      setInitialNotificationForm(notificationForm);
      setIsNotificationDirty(false);
    } catch (error: any) {
      console.error("Error saving notification settings:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to save notification settings";
      setNotificationError(errorMessage);
    } finally {
      setIsNotificationSaving(false);
    }
  };

  const handleAppearanceSave = async () => {
    if (!user?.id) return;

    setIsAppearanceSaving(true);
    setAppearanceError("");

    try {
      await updateSettings({
        color_scheme: appearanceForm.colorScheme,
        color_theme: appearanceForm.theme,
        zoom_level: appearanceForm.zoomLevel,
      });

      setInitialAppearanceForm(appearanceForm);
      setIsAppearanceDirty(false);
    } catch (error: any) {
      console.error("Error saving appearance settings:", error);
      const errorMessage =
        error.response?.data?.error || "Failed to save appearance settings";
      setAppearanceError(errorMessage);
    } finally {
      setIsAppearanceSaving(false);
    }
  };

  const handleArtistDashboardNavigate = () => {
    navigate("/artist-dashboard");
  };

  const handleDeactivateAccount = async () => {
    if (!user?.id) return;

    await userApi.update(user.id, {
      status: "DEACTIVATED",
    });

    await logout();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    try {
      await userApi.delete(user.id);
      clearAuthState();

      navigate("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      await logout();
      navigate("/login");
    }
  };

  const themeOptions = getAvailableThemes();

  const zoomOptions = useMemo(() => {
    return [
      { value: "80", label: "80%" },
      { value: "90", label: "90%" },
      { value: "100", label: "100%" },
      { value: "110", label: "110%" },
      { value: "120", label: "120%" },
    ];
  }, []);

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
          onSave={handleAccountSave}
          isDirty={isAccountDirty}
          isSaving={isAccountSaving}
          saveError={accountError}
        >
          <SettingsImageUpload
            label="Profile Picture"
            currentImage={user?.profile_picture_url}
            onImageChange={handleProfilePictureChange}
            disabled={isAccountSaving}
            hint="Change your profile picture (max 5MB)"
          />
          <SettingsInput
            label="Username"
            name="username"
            value={accountForm.username}
            onChange={handleAccountFieldChange}
            placeholder="Change username"
            disabled={isAccountSaving}
          />
          <SettingsInput
            label="Email Address"
            name="email"
            value={accountForm.email}
            onChange={handleAccountFieldChange}
            placeholder="Change email address"
            disabled={isAccountSaving}
          />
          <SettingsToggle
            label="Account Privacy"
            name="privacy"
            checked={accountForm.privacy}
            onChange={handleAccountPrivacyChange}
            values={{ on: "Private", off: "Public" }}
            hint="Control whether your profile is visible to other users"
            disabled={isAccountSaving}
          />
          <button
            className={styles.settingsButton}
            type="button"
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Change Password
          </button>
        </SettingsSection>

        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          userId={user?.id || ""}
          onPasswordChanged={() => {
            if (user?.id) {
              userApi
                .getUserById(user.id)
                .then((updatedUser) => {
                  updateUser(updatedUser);
                })
                .catch((error) => {
                  console.error("Failed to refresh user data:", error);
                });
            }
          }}
        />

        {user && (user.role === "ARTIST" || user.role === "ADMIN") && (
          <SettingsSection
            title="Artist Settings"
            description="Manage your artist preferences."
            onSave={handleArtistSave}
            isDirty={isArtistDirty}
            isSaving={isArtistSaving}
            saveError={artistError}
          >
            <div className={styles.artistToggleGrid}>
              <SettingsToggle
                label="Like Notifications"
                name="likeNotifications"
                checked={artistForm.likeNotifications}
                onChange={(checked) =>
                  handleArtistFieldChange("likeNotifications", checked)
                }
                values={{ on: "All", off: "None" }}
                hint="Get notified when someone likes your albums or songs"
                disabled={isArtistSaving}
              />
              <SettingsToggle
                label="Comment Notifications"
                name="commentNotifications"
                checked={artistForm.commentNotifications}
                onChange={(checked) =>
                  handleArtistFieldChange("commentNotifications", checked)
                }
                values={{ on: "All", off: "None" }}
                hint="Get notified when someone comments on your song"
                disabled={isArtistSaving}
              />
              <SettingsToggle
                label="Discoverability"
                name="discoverability"
                checked={artistForm.discoverability}
                onChange={(checked) =>
                  handleArtistFieldChange("discoverability", checked)
                }
                values={{ on: "Shown", off: "Unlisted" }}
                hint="Control whether your profile is discoverable in searches and recommendations"
                disabled={isArtistSaving}
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
          onSave={handleNotificationsSave}
          isDirty={isNotificationDirty}
          isSaving={isNotificationSaving}
          saveError={notificationError}
        >
          <div className={styles.notificationsToggleGrid}>
            <SettingsToggle
              label="New Releases"
              name="releases"
              checked={notificationForm.releases}
              onChange={(checked) =>
                handleNotificationFieldChange("releases", checked)
              }
              values={{ on: "All", off: "None" }}
              hint="Get notified when artists you follow release new music"
              disabled={isNotificationSaving}
            />
            <SettingsToggle
              label="Playlist Likes"
              name="playlistLikes"
              checked={notificationForm.playlistLikes}
              onChange={(checked) =>
                handleNotificationFieldChange("playlistLikes", checked)
              }
              values={{ on: "All", off: "None" }}
              hint="Get notified when someone likes your public playlists"
              disabled={isNotificationSaving}
            />
            <SettingsToggle
              label="New Followers"
              name="followers"
              checked={notificationForm.followers}
              onChange={(checked) =>
                handleNotificationFieldChange("followers", checked)
              }
              values={{ on: "All", off: "None" }}
              hint="Get notified when someone follows you"
              disabled={isNotificationSaving}
            />
            <SettingsToggle
              label="Comment Mentions"
              name="commentMentions"
              checked={notificationForm.commentMentions}
              onChange={(checked) =>
                handleNotificationFieldChange("commentMentions", checked)
              }
              values={{ on: "All", off: "None" }}
              hint="Get notified when someone mentions you in a comment"
              disabled={isNotificationSaving}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Appearance Settings"
          description="Customize the look and feel of CoogMusic."
          onSave={handleAppearanceSave}
          isDirty={isAppearanceDirty}
          isSaving={isAppearanceSaving}
          saveError={appearanceError}
        >
          <SettingsColorSchemeSelector
            label="Color Scheme"
            value={appearanceForm.colorScheme}
            onChange={(value) =>
              handleAppearanceFieldChange("colorScheme", value)
            }
            name="colorScheme"
            disabled={isAppearanceSaving}
          />
          <SettingsDropdown
            label="Theme"
            name="theme"
            value={appearanceForm.theme}
            options={themeOptions}
            onChange={(value) => handleAppearanceFieldChange("theme", value)}
            hint="Select your preferred application theme"
            placeholder="Select Theme"
            disabled={isAppearanceSaving}
          />
          <SettingsRadio
            label="Zoom Level"
            name="zoomLevel"
            value={appearanceForm.zoomLevel.toString()}
            onChange={(value) =>
              handleAppearanceFieldChange("zoomLevel", parseInt(value))
            }
            options={zoomOptions}
            disabled={isAppearanceSaving}
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
            <button
              className={styles.dangerButton}
              onClick={() => setIsDeactivateModalOpen(true)}
              type="button"
            >
              Deactivate Account
            </button>
            <button
              className={styles.dangerButton}
              onClick={() => setIsDeleteModalOpen(true)}
              type="button"
            >
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

        <ConfirmationModal
          isOpen={isDeactivateModalOpen}
          onClose={() => setIsDeactivateModalOpen(false)}
          onConfirm={handleDeactivateAccount}
          title="Deactivate Account"
          message="Are you sure you want to deactivate your account? Your profile will be disabled and your presence will be removed from CoogMusic. You can reactivate your account by logging in again."
          confirmButtonText="Deactivate Account"
          isDangerous={true}
        />

        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          message="Are you sure you want to permanently delete your account? This will erase all your data including playlists, likes, and history."
          warningMessage="This action is permanent and cannot be undone. All your data will be permanently deleted."
          confirmButtonText="Delete Account"
          isDangerous={true}
        />
      </div>
    </>
  );
};

export default memo(SettingsPage);
