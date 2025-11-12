import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { userApi } from "@api";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
import {
  ErrorPage,
  PageLoader,
  CoverLightbox,
  LazyImg,
  UserInfoStats,
  UserInfoFollowers,
  UserInfoFollowing,
  UserInfoLiked,
} from "@components";
import styles from "./UserInfoPage.module.css";
import userPlaceholder from "@assets/user-placeholder.webp";
import classNames from "classnames";
import { LuArrowLeft } from "react-icons/lu";

type TabType = "followers" | "following" | "liked";

const UserInfoPage: React.FC = () => {
  const { id, tab } = useParams<{ id: UUID; tab?: string }>();
  const navigate = useNavigate();

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (tab === "followers" || tab === "following") return tab;
    if (tab === "likes") return "liked";
    return "followers";
  });

  useEffect(() => {
    if (tab === "followers" || tab === "following") {
      setActiveTab(tab);
    } else if (tab === "likes") {
      setActiveTab("liked");
    } else if (!tab) {
      setActiveTab("followers");
    }
  }, [tab]);

  const { data, loading, error } = useAsyncData(
    {
      user: () => userApi.getUserById(id || ""),
    },
    [id],
    {
      cacheKey: `user_info_${id}`,
      hasBlobUrl: true,
    }
  );

  const user = data?.user;

  const userImageUrl = useMemo(
    () => user?.profile_picture_url || userPlaceholder,
    [user]
  );

  const handleLightboxClose = useCallback(() => setIsLightboxOpen(false), []);

  const handleImageClick = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  const handleTabClick = useCallback(
    (tab: TabType) => {
      const urlTab = tab === "liked" ? "likes" : tab;
      navigate(`/users/${id}/info/${urlTab}`);
    },
    [id, navigate]
  );

  const tabTitle = useMemo(() => {
    if (!user) return "";
    switch (activeTab) {
      case "followers":
        return `${user.username}'s Followers`;
      case "following":
        return `Followed by ${user.username}`;
      case "liked":
        return `Liked by ${user.username}`;
      default:
        return "";
    }
  }, [activeTab, user]);

  if (!id) {
    return (
      <ErrorPage
        title="User Not Found"
        message="The requested user does not exist."
      />
    );
  }

  if (error) {
    return (
      <ErrorPage
        title="Internal Server Error"
        message="An unexpected error occurred. Please try again later."
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{user ? `${user.username} - Info` : "User Info"}</title>
      </Helmet>

      {loading ? (
        <PageLoader />
      ) : !user ? (
        <ErrorPage
          title="User Not Found"
          message="The requested user does not exist."
        />
      ) : (
        <>
          <div className={styles.userInfoLayout}>
            <div className={styles.headerContainer}>
              <Link to={`/users/${id}`} className={styles.backLink}>
                <LuArrowLeft /> Back to user page
              </Link>
              <header className={styles.userInfoHeader}>
                <LazyImg
                  src={userImageUrl}
                  alt={`${user.username} Image`}
                  imgClassNames={[
                    styles.userImage,
                    userImageUrl !== userPlaceholder
                      ? styles.userImageClickable
                      : "",
                  ]}
                  loading="eager"
                  onClick={handleImageClick}
                />
                <div className={styles.userInfo}>
                  <h1 className={styles.userInfoTitle}>{tabTitle}</h1>
                  <UserInfoStats userId={id} />
                  {user.role === "ARTIST" && user.artist_id && (
                    <Link
                      to={`/artists/${user.artist_id}`}
                      className={styles.artistLink}
                    >
                      View Artist Page
                    </Link>
                  )}
                </div>
              </header>
            </div>

            <div className={styles.infoSection}>
              <div className={styles.switcherContainer}>
                <button
                  className={classNames(styles.switcherButton, {
                    [styles.switcherButtonActive]: activeTab === "followers",
                  })}
                  onClick={() => handleTabClick("followers")}
                >
                  Followers
                </button>
                <button
                  className={classNames(styles.switcherButton, {
                    [styles.switcherButtonActive]: activeTab === "following",
                  })}
                  onClick={() => handleTabClick("following")}
                >
                  Following
                </button>
                <button
                  className={classNames(styles.switcherButton, {
                    [styles.switcherButtonActive]: activeTab === "liked",
                  })}
                  onClick={() => handleTabClick("liked")}
                >
                  Liked
                </button>
              </div>
              {activeTab === "followers" && (
                <UserInfoFollowers userId={id} username={user.username} />
              )}
              {activeTab === "following" && (
                <UserInfoFollowing userId={id} username={user.username} />
              )}
              {activeTab === "liked" && <UserInfoLiked userId={id} />}
            </div>
          </div>

          {userImageUrl && (
            <CoverLightbox
              isOpen={isLightboxOpen}
              onClose={handleLightboxClose}
              imageUrl={userImageUrl}
              altText={`${user.username} Image`}
            />
          )}
        </>
      )}
    </>
  );
};

export default memo(UserInfoPage);
