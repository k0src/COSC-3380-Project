import { memo } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { userApi } from "@api";
import type { UUID } from "@types";
import { useAsyncData } from "@hooks";
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
      user: () => userApi.getUserById(id),
    },
    [id],
    {
      cacheKey: `user_${id}`,
      hasBlobUrl: true,
    }
  );

  const user = data?.user;

  if (error) {
    return (
      <ErrorPage
        title="Internal Server Error"
        message="An unexpected error occurred. Please try again later."
      />
    );
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <ErrorPage
        title="User Not Found"
        message="The requested user does not exist."
      />
    );
  }

  if (user.status !== "ACTIVE") {
    return (
      <ErrorPage
        title="User Not Found"
        message="The requested user does not exist."
      />
    );
  }

  const userIsArtist = user.role === "ARTIST";
  const userIsAdmin = user.role === "ADMIN";

  return (
    <>
      <Helmet>
        <title>{`${user.username} - CoogMusic`}</title>
      </Helmet>

      <div className={styles.userLayout}>
        <UserContainer
          username={user.username}
          profilePictureUrl={user.profile_picture_url}
          profilePictureBlurHash={user.pfp_blurhash}
          userIsArtist={userIsArtist}
          userIsAdmin={userIsAdmin}
          artistId={user.artist_id}
        />
        <div className={styles.userLayoutBottom}>
          <div className={styles.userLayoutLeft}>
            <UserRecentActivity userId={id} maxItems={20} />
            {userIsArtist && user.artist_id && (
              <UserRecentReleases artistId={user.artist_id} maxItems={8} />
            )}
          </div>
          <div className={styles.userLayoutRight}>
            <UserActions
              artistId={user.artist_id}
              userId={id}
              userCreatedAt={user.created_at}
              userIsArtist={userIsArtist}
            />
            <FollowProfiles
              title="Followers"
              userId={user.id}
              profileLimit={8}
              profileMin={4}
              following={false}
            />
            <FollowProfiles
              title="Following"
              userId={user.id}
              profileMin={4}
              profileLimit={8}
            />
            <UserPlaylists userId={user.id} username={user.username} />
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(UserPage);
