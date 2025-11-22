import { memo, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@contexts";
import { userApi } from "@api";
import type { UUID, AccessContext } from "@types";
import { useAsyncData, useErrorCheck } from "@hooks";
import {
  ErrorPage,
  PageLoader,
  UserContainer,
  UserRecentActivity,
  UserRecentReleases,
  FollowProfiles,
  UserActions,
  UserPlaylists,
} from "@components";
import styles from "./UserPage.module.css";

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: UUID }>();

  const { user, isAuthenticated } = useAuth();

  if (!id) {
    return (
      <ErrorPage
        title="User Not Found"
        message="The requested user does not exist."
      />
    );
  }

  const { data, loading, error } = useAsyncData(
    {
      pageUser: () => userApi.getUserById(id),
    },
    [id],
    {
      cacheKey: `user_${id}`,
      hasBlobUrl: true,
    }
  );

  const pageUser = data?.pageUser;

  const isOwner = useMemo(() => {
    if (!user || !isAuthenticated || !pageUser) {
      return false;
    }
    return user.id === pageUser.id;
  }, [user, isAuthenticated, pageUser]);

  const { shouldShowError, errorTitle, errorMessage } = useErrorCheck([
    {
      condition: !!error,
      title: "Internal Server Error",
      message: "An unexpected error occurred. Please try again later.",
    },
    {
      condition: !pageUser && !loading,
      title: "User Not Found",
      message: "The requested user does not exist.",
    },
    {
      condition: pageUser?.status !== "ACTIVE",
      title: "User Not Found",
      message: "The requested user does not exist.",
    },
    {
      condition: pageUser?.status === "DEACTIVATED" && !isOwner,
      title: "User Not Found",
      message: "The requested user does not exist.",
    },
  ]);

  if (loading) {
    return <PageLoader />;
  }

  if (shouldShowError) {
    return <ErrorPage title={errorTitle} message={errorMessage} />;
  }

  const userIsArtist = pageUser.role === "ARTIST";
  const userIsAdmin = pageUser.role === "ADMIN";

  const accessContext: AccessContext = {
    role: user ? (user.role === "ADMIN" ? "admin" : "user") : "anonymous",
    userId: user?.id,
    scope: "globalList",
  };

  return (
    <>
      <Helmet>
        <title>{`${pageUser.username} - CoogMusic`}</title>
      </Helmet>

      <div className={styles.userLayout}>
        <UserContainer
          user={pageUser}
          userIsArtist={userIsArtist}
          userIsAdmin={userIsAdmin}
          artistId={pageUser.artist_id}
          isOwner={isOwner}
        />
        <div className={styles.userLayoutBottom}>
          <div className={styles.userLayoutLeft}>
            <UserRecentActivity
              userId={id}
              maxItems={20}
              accessContext={accessContext}
            />
            {userIsArtist && pageUser.artist_id && (
              <UserRecentReleases artistId={pageUser.artist_id} maxItems={8} />
            )}
          </div>
          <div className={styles.userLayoutRight}>
            <UserActions
              artistId={pageUser.artist_id}
              userId={id}
              userCreatedAt={pageUser.created_at}
              userIsArtist={userIsArtist}
              username={pageUser.username}
            />
            <FollowProfiles
              title="Followers"
              userId={pageUser.id}
              profileLimit={8}
              profileMin={4}
              following={false}
            />
            <FollowProfiles
              title="Following"
              userId={pageUser.id}
              profileMin={4}
              profileLimit={8}
            />
            <UserPlaylists userId={pageUser.id} username={pageUser.username} />
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(UserPage);
