import { memo, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@contexts";
import { commentApi } from "@api";
import { CommentTable } from "@components";
import styles from "./ArtistDashboardCommentsPage.module.css";

const ArtistDashboardCommentsPage: React.FC = () => {
  const { user } = useAuth();
  const artistId = user?.artist_id;

  const fetchArtistComments = useCallback(
    (sortColumn: string, sortDirection: string) => {
      return commentApi.getCommentsByArtistId(
        artistId!,
        500,
        sortColumn,
        sortDirection as "ASC" | "DESC"
      );
    },
    [artistId]
  );

  return (
    <>
      <Helmet>
        <title>Comments - Artist Dashboard</title>
      </Helmet>

      <div className={styles.commentsLayout}>
        <header className={styles.commentsHeader}>
          <span className={styles.commentsTitle}>Comments</span>
        </header>

        <CommentTable
          title="Comments on Your Songs"
          viewAllLink={false}
          fetchData={fetchArtistComments}
          cacheKey={`artist_${artistId}_all_comments`}
          dependencies={[artistId]}
        />
      </div>
    </>
  );
};

export default memo(ArtistDashboardCommentsPage);
