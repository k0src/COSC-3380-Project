import { memo, useState, useCallback, useEffect, useMemo } from "react";
import { PuffLoader } from "react-spinners";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import { useAsyncData } from "@hooks";
import { dataApi } from "@api";
import type { DataReportParams } from "@types";
import styles from "./AdvancedFilterPanel.module.css";
import classNames from "classnames";

export interface AdvancedFilterPanelProps {
  params: DataReportParams;
  onParamsChange: (params: DataReportParams) => void;
}

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  params,
  onParamsChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingParams, setPendingParams] = useState<DataReportParams>(params);

  const { data, loading } = useAsyncData(
    {
      artists: () => dataApi.getArtistFilterOptions(),
      genres: () => dataApi.getGenreFilterOptions(),
      albums: () => dataApi.getAlbumFilterOptions(),
    },
    [isExpanded]
  );

  const filterOptions = {
    artists: data?.artists ?? [],
    genres: data?.genres ?? [],
    albums: data?.albums ?? [],
  };

  useEffect(() => {
    setPendingParams(params);
  }, [params]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (pendingParams.searchTerm?.trim()) count++;
    if (pendingParams.artistIds?.length) count++;
    if (pendingParams.genres?.length) count++;
    if (pendingParams.albumIds?.length) count++;
    if (pendingParams.showOnlyNew) count++;
    if (pendingParams.showOnlyTrending) count++;
    return count;
  }, [pendingParams]);

  const handleApplyFilters = useCallback(() => {
    onParamsChange({ ...pendingParams });
  }, [pendingParams, onParamsChange]);

  const handleClearAllFilters = useCallback(() => {
    const clearedParams = {
      ...pendingParams,
      searchTerm: undefined,
      artistIds: undefined,
      genres: undefined,
      albumIds: undefined,
      showOnlyNew: false,
      showOnlyTrending: false,
    };
    setPendingParams(clearedParams);
    onParamsChange(clearedParams);
  }, [pendingParams, onParamsChange]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(params) !== JSON.stringify(pendingParams);
  }, [params, pendingParams]);

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.headerLeft}>
          <span className={styles.title}>Advanced Filters</span>
          {activeFilterCount > 0 && (
            <span className={styles.filterBadge}>{activeFilterCount}</span>
          )}
        </div>
        <div className={styles.headerRight}>
          {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
        </div>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <PuffLoader color="var(--color-accent)" size={35} />
            </div>
          ) : (
            <>
              <div className={styles.section}>
                <label className={styles.sectionLabel}>Search</label>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search songs or artists..."
                  value={pendingParams.searchTerm || ""}
                  onChange={(e) =>
                    setPendingParams((prev) => ({
                      ...prev,
                      searchTerm: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.filterGrid}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Artists</label>
                  <select
                    multiple
                    className={styles.multiSelect}
                    value={pendingParams.artistIds || []}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      );
                      setPendingParams((prev) => ({
                        ...prev,
                        artistIds: selected,
                      }));
                    }}
                  >
                    {filterOptions.artists.map((artist) => (
                      <option key={artist.id} value={artist.id}>
                        {artist.name}
                      </option>
                    ))}
                  </select>
                  {pendingParams.artistIds &&
                    pendingParams.artistIds.length > 0 && (
                      <div className={styles.selectedCount}>
                        {pendingParams.artistIds.length} selected
                      </div>
                    )}
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Genres</label>
                  <select
                    multiple
                    className={styles.multiSelect}
                    value={pendingParams.genres || []}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      );
                      setPendingParams((prev) => ({
                        ...prev,
                        genres: selected,
                      }));
                    }}
                  >
                    {filterOptions.genres.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                  {pendingParams.genres && pendingParams.genres.length > 0 && (
                    <div className={styles.selectedCount}>
                      {pendingParams.genres.length} selected
                    </div>
                  )}
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Albums</label>
                  <select
                    multiple
                    className={styles.multiSelect}
                    value={pendingParams.albumIds || []}
                    onChange={(e) => {
                      const selected = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      );
                      setPendingParams((prev) => ({
                        ...prev,
                        albumIds: selected,
                      }));
                    }}
                  >
                    {filterOptions.albums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.title} - {album.artistName}
                      </option>
                    ))}
                  </select>
                  {pendingParams.albumIds &&
                    pendingParams.albumIds.length > 0 && (
                      <div className={styles.selectedCount}>
                        {pendingParams.albumIds.length} selected
                      </div>
                    )}
                </div>
              </div>

              <div className={styles.section}>
                <label className={styles.sectionLabel}>Show Only</label>
                <div className={styles.checkboxGrid}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={pendingParams.showOnlyNew || false}
                      onChange={(e) =>
                        setPendingParams((prev) => ({
                          ...prev,
                          showOnlyNew: e.target.checked,
                        }))
                      }
                    />
                    New Tracks (Last 30 Days)
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={pendingParams.showOnlyTrending || false}
                      onChange={(e) =>
                        setPendingParams((prev) => ({
                          ...prev,
                          showOnlyTrending: e.target.checked,
                        }))
                      }
                    />
                    Trending (&gt;20% Growth)
                  </label>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={classNames(styles.actionButton, styles.primary)}
                  onClick={handleApplyFilters}
                  disabled={!hasChanges}
                >
                  Apply Filters
                </button>
                <button
                  className={classNames(styles.actionButton, styles.secondary)}
                  onClick={handleClearAllFilters}
                  disabled={activeFilterCount === 0}
                >
                  Clear All
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(AdvancedFilterPanel);
