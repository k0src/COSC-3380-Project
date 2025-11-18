import { memo, useCallback, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { UUID, User } from "@types";
import { LazyImg, CoverLightbox } from "@components";
import styles from "./UserContainer.module.css";
import userPlaceholder from "@assets/user-placeholder.webp";
import { LuMicVocal, LuPencil, LuShield } from "react-icons/lu";

export interface UserContainerProps {
  user: User;
  userIsArtist: boolean;
  userIsAdmin: boolean;
  artistId?: UUID;
  isOwner?: boolean;
}

const UserContainer: React.FC<UserContainerProps> = ({
  user,
  userIsArtist,
  userIsAdmin,
  artistId,
  isOwner,
}) => {
  if (userIsArtist && !artistId) {
    throw new Error("artistId is required when userIsArtist is true");
  }

  const navigate = useNavigate();
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const userProfilePicture = useMemo(() => {
    return user.profile_picture_url || userPlaceholder;
  }, [user.profile_picture_url]);

  const handleLightboxClose = useCallback(() => setIsLightboxOpen(false), []);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const handleEditUser = useCallback(() => {
    navigate("/me/settings");
  }, [navigate]);

  return (
    <>
      <div className={styles.userContainer}>
        <div className={styles.userInfoWrapper}>
          <LazyImg
            src={userProfilePicture}
            blurHash={user.pfp_blurhash}
            alt={`${user.username} Profile Picture`}
            imgClassNames={[
              styles.userImage,
              userProfilePicture && userProfilePicture !== userPlaceholder
                ? styles.userImageClickable
                : "",
            ]}
            loading="eager"
            onClick={handleImageClick}
          />

          <div className={styles.userHeader}>
            <div className={styles.usernameContainer}>
              <h1 className={styles.username}>{user.username}</h1>
              {userIsArtist && <LuMicVocal className={styles.userRoleIcon} />}
              {userIsAdmin && <LuShield className={styles.userRoleIcon} />}
            </div>
            {userIsArtist && (
              <Link to={`/artists/${artistId}`} className={styles.artistLink}>
                View Artist Page
              </Link>
            )}
          </div>
        </div>
        {isOwner && (
          <button className={styles.ownerButton} onClick={handleEditUser}>
            <LuPencil />
          </button>
        )}
      </div>

      {userProfilePicture && (
        <CoverLightbox
          isOpen={isLightboxOpen}
          onClose={handleLightboxClose}
          imageUrl={userProfilePicture}
          altText={`${user.username} Profile Picture`}
        />
      )}
    </>
  );
};

export default memo(UserContainer);
