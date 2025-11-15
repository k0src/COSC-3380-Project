import { memo, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import type { UUID } from "@types";
import { LazyImg, CoverLightbox } from "@components";
import styles from "./UserContainer.module.css";
import userPlaceholder from "@assets/user-placeholder.webp";
import { LuMicVocal, LuShield } from "react-icons/lu";

export interface UserContainerProps {
  username: string;
  profilePictureUrl?: string;
  profilePictureBlurHash?: string;
  userIsArtist: boolean;
  userIsAdmin: boolean;
  artistId?: UUID;
}

const UserContainer: React.FC<UserContainerProps> = ({
  username,
  profilePictureUrl,
  profilePictureBlurHash,
  userIsArtist,
  userIsAdmin,
  artistId,
}) => {
  if (userIsArtist && !artistId) {
    throw new Error("artistId is required when userIsArtist is true");
  }

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleLightboxClose = useCallback(() => setIsLightboxOpen(false), []);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  return (
    <>
      <div className={styles.userContainer}>
        <LazyImg
          src={profilePictureUrl || userPlaceholder}
          blurHash={profilePictureBlurHash}
          alt={`${username} Profile Picture`}
          imgClassNames={[
            styles.userImage,
            profilePictureUrl && profilePictureUrl !== userPlaceholder
              ? styles.userImageClickable
              : "",
          ]}
          loading="eager"
          onClick={handleImageClick}
        />

        <div className={styles.userHeader}>
          <div className={styles.usernameContainer}>
            <h1 className={styles.username}>{username}</h1>
            {userIsArtist && <LuMicVocal className={styles.userRoleIcon} />}
            {userIsAdmin && <LuShield className={styles.userRoleIcon} />}
          </div>
          {userIsArtist && (
            <Link to={`/artists/`} className={styles.artistLink}>
              View Artist Page
            </Link>
          )}
        </div>
      </div>

      {profilePictureUrl && (
        <CoverLightbox
          isOpen={isLightboxOpen}
          onClose={handleLightboxClose}
          imageUrl={profilePictureUrl}
          altText={`${username} Profile Picture`}
        />
      )}
    </>
  );
};

export default memo(UserContainer);
