import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { userApi } from "@api";
import { useAuth } from "@contexts";
import type { AccessContext, UUID } from "@types";
import { useAsyncData } from "@hooks";
import {
  ErrorPage,
  PageLoader,
  LazyImg,
  UserInfoStats,
  UserInfoFollowers,
  UserInfoFollowing,
  UserInfoLiked,
} from "@components";
import styles from "./UserInfoPage.module.css";
import classNames from "classnames";
import userPlaceholder from "@assets/user-placeholder.webp";
import { LuArrowLeft } from "react-icons/lu";

type TabType = "followers" | "following" | "liked";

const UserInfoPage: React.FC = () => {
  const { user } = useAuth();
  const { id, tab } = useParams<{ id: UUID; tab?: string }>();
  const navigate = useNavigate();

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "owner",
  };

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (tab === "followers" || tab === "following") return tab;
    if (tab === "likes") return "liked";
    return "followers";
  });

  if (!id) {
    return (
      <ErrorPage
        title="User Not Found"
        message="The requested user does not exist."
      />
    );
  }

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
      pageUser: () => userApi.getUser(id, accessContext),
    },
    [id],
    {
      cacheKey: `user_info_${id}`,
      hasBlobUrl: true,
    }
  );

  const pageUser = data?.pageUser;

  const userImageUrl = useMemo(
    () => pageUser?.profile_picture_url || userPlaceholder,
    [pageUser]
  );

  const handleTabClick = useCallback(
    (tab: TabType) => {
      const urlTab = tab === "liked" ? "likes" : tab;
      navigate(`/users/${id}/info/${urlTab}`);
    },
    [id, navigate]
  );

  const tabTitle = useMemo(() => {
    if (!pageUser) return "";
    switch (activeTab) {
      case "followers":
        return `${pageUser.username}'s Followers`;
      case "following":
        return `Followed by ${pageUser.username}`;
      case "liked":
        return `Liked by ${pageUser.username}`;
      default:
        return "";
    }
  }, [activeTab, pageUser]);

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
        <title>{pageUser ? `${pageUser.username} - Info` : "User Info"}</title>
      </Helmet>

      {loading ? (
        <PageLoader />
      ) : !pageUser ? (
        <ErrorPage
          title="User Not Found"
          message="The requested user does not exist."
        />
      ) : (
        <div className={styles.userInfoLayout}>
          <div className={styles.headerContainer}>
            <Link to={`/users/${id}`} className={styles.backLink}>
              <LuArrowLeft /> Back to user page
            </Link>
            <header className={styles.userInfoHeader}>
              <LazyImg
                src={userImageUrl}
                blurHash={pageUser.pfp_blurhash}
                alt={`${pageUser.username} Image`}
                imgClassNames={[styles.userImage]}
                loading="eager"
              />
              <div className={styles.userInfo}>
                <h1 className={styles.userInfoTitle}>{tabTitle}</h1>
                <UserInfoStats userId={id} />
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
              <UserInfoFollowers userId={id} username={pageUser.username} />
            )}
            {activeTab === "following" && (
              <UserInfoFollowing userId={id} username={pageUser.username} />
            )}
            {activeTab === "liked" && <UserInfoLiked userId={id} />}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(UserInfoPage);
