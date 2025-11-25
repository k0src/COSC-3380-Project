import { memo, useState, useCallback, useMemo } from "react";
// import { PuffLoader } from "react-spinners";
// import { BarChart } from "@mui/x-charts/BarChart";
// import { LineChart } from "@mui/x-charts/LineChart";
// import { chartsTooltipClasses } from "@mui/x-charts";
// import { useAsyncData } from "@hooks";
// import { dataApi } from "@api";
// import type { DataReportParams } from "@types";
// import DataReportStoryPanel from "@components/DataReports/DataReportStoryPanel";
// import DataReportParameterPanel from "@components/DataReports/DataReportParameterPanel";
// import DataReportsTabNav from "@components/DataReports/DataReportsTabNav";
// import DataReportDetailTable from "@components/DataReports/DataReportDetailTable";
// import AdvancedFilterPanel from "@components/DataReports/AdvancedFilterPanel";
// import GenreBreakdown from "@components/DataReports/GenreBreakdown";
// import UserAnalyticsFilterPanel from "../../../components/DataReports/UserAnalyticsFilterPanel";
// import MiniStatPanel from "../../../components/DataReports/MiniStatPanel";
// import BigStatPanel from "../../../components/DataReports/BigStatPanel";
// import type { DataReportDetailColumn } from "@components/DataReports/DataReportDetailTable";
// import { formatNumber, formatPercentage } from "@util";
// import styles from "./DataReportEngagement.module.css";
// import { LuChevronLeft, LuChevronRight, LuChevronDown } from "react-icons/lu";
// import { TableDropdown } from "@components";

const DataReportEngagement: React.FC = () => {
  //   const [params, setParams] = useState<DataReportParams>({
  //     timeRange: {
  //       startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  //       endDate: new Date().toISOString(),
  //     },
  //     limit: 50,
  //     offset: 0,
  //     minStreams: 1,
  //   });
  //   const [userParams, setUserParams] = useState<DataReportParams>({
  //     timeRange: {
  //       startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  //       endDate: new Date().toISOString(),
  //     },
  //     limit: 50,
  //     offset: 0,
  //     sortBy: "totalStreams",
  //     sortDirection: "DESC",
  //   });
  //   const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);
  //   const [currentPage, setCurrentPage] = useState(0);
  //   const [userCurrentPage, setUserCurrentPage] = useState(0);

  //   // Calculate active advanced filters
  //   const activeFilters = useMemo(() => {
  //     const filters: Array<{ key: string; label: string; value: string }> = [];

  //     if (params.searchTerm?.trim()) {
  //       filters.push({
  //         key: "searchTerm",
  //         label: "Search",
  //         value: `"${params.searchTerm}"`,
  //       });
  //     }

  //     if (params.artistIds?.length) {
  //       filters.push({
  //         key: "artistIds",
  //         label: "Artists",
  //         value: `${params.artistIds.length} selected`,
  //       });
  //     }

  //     if (params.genres?.length) {
  //       filters.push({
  //         key: "genres",
  //         label: "Genres",
  //         value: `${params.genres.length} selected`,
  //       });
  //     }

  //     if (params.albumIds?.length) {
  //       filters.push({
  //         key: "albumIds",
  //         label: "Albums",
  //         value: `${params.albumIds.length} selected`,
  //       });
  //     }

  //     if (params.showOnlyNew) {
  //       filters.push({
  //         key: "showOnlyNew",
  //         label: "New Tracks",
  //         value: "Last 30 days",
  //       });
  //     }

  //     if (params.showOnlyTrending) {
  //       filters.push({
  //         key: "showOnlyTrending",
  //         label: "Trending",
  //         value: ">20% growth",
  //       });
  //     }

  //     if (params.sortBy && params.sortBy !== "streams") {
  //       filters.push({
  //         key: "sortBy",
  //         label: "Sort",
  //         value: `${params.sortBy} ${params.sortDirection === "ASC" ? "↑" : "↓"}`,
  //       });
  //     }

  //     return filters;
  //   }, [params]);

  //   const { data, loading, error } = useAsyncData(
  //     {
  //       engagement: () => dataApi.getEngagementMetrics(params),
  //       artists: () => dataApi.getArtistPerformance(params),
  //       pareto: () => dataApi.getParetoData(params),
  //       timeseries: () => dataApi.getEngagementTimeSeries(params),
  //       enhancedTracks: () => dataApi.getEnhancedTrackPerformance(params),
  //       genre: () => dataApi.getGenreBreakdown(params),
  //       userAnalytics: () => dataApi.getUserAnalytics(userParams),
  //     },
  //     [params, userParams],
  //     {
  //       cacheKey: `engagement_${JSON.stringify(params)}_${JSON.stringify(
  //         userParams
  //       )}`,
  //     }
  //   );

  //   const enhancedTrackColumns: DataReportDetailColumn[] = useMemo(
  //     () => [
  //       {
  //         key: "title",
  //         header: "Song Title",
  //         sortable: false,
  //       },
  //       {
  //         key: "artistName",
  //         header: "Artist",
  //         sortable: false,
  //       },
  //       {
  //         key: "albumTitle",
  //         header: "Album",
  //         sortable: false,
  //       },
  //       {
  //         key: "streams",
  //         header: "Streams",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "uniqueListeners",
  //         header: "Unique Listeners",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "likes",
  //         header: "Likes",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "comments",
  //         header: "Comments",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "engagementRate",
  //         header: "Engagement Rate",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatPercentage(value),
  //       },
  //       {
  //         key: "growthPercent",
  //         header: "Growth %",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => (
  //           <span
  //             style={{
  //               color:
  //                 value > 0
  //                   ? "var(--color-green)"
  //                   : value < 0
  //                   ? "var(--color-red-ui)"
  //                   : "inherit",
  //             }}
  //           >
  //             {value > 0 ? "+" : ""}
  //             {value.toFixed(1)}%
  //           </span>
  //         ),
  //       },
  //       {
  //         key: "firstStreamedDate",
  //         header: "First Streamed",
  //         sortable: false,
  //         render: (value: string) =>
  //           new Date(value).toLocaleDateString(undefined, {
  //             month: "short",
  //             day: "numeric",
  //             year: "numeric",
  //           }),
  //       },
  //     ],
  //     []
  //   );

  //   const artistColumns: DataReportDetailColumn[] = useMemo(
  //     () => [
  //       {
  //         key: "displayName",
  //         header: "Artist",
  //         sortable: false,
  //       },
  //       {
  //         key: "totalStreams",
  //         header: "Total Streams",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "uniqueListeners",
  //         header: "Unique Listeners",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "avgStreamsPerListener",
  //         header: "Avg Streams/Listener",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => value.toFixed(1),
  //       },
  //       {
  //         key: "growthPercent",
  //         header: "Growth %",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => (
  //           <span
  //             style={{
  //               color:
  //                 value > 0
  //                   ? "var(--color-green)"
  //                   : value < 0
  //                   ? "var(--color-red-ui)"
  //                   : "inherit",
  //             }}
  //           >
  //             {value > 0 ? "+" : ""}
  //             {value.toFixed(1)}%
  //           </span>
  //         ),
  //       },
  //     ],
  //     []
  //   );

  //   const userAnalyticsColumns: DataReportDetailColumn[] = useMemo(
  //     () => [
  //       {
  //         key: "username",
  //         header: "Username",
  //         sortable: false,
  //       },
  //       {
  //         key: "displayName",
  //         header: "Display Name",
  //         sortable: false,
  //       },
  //       {
  //         key: "totalStreams",
  //         header: "Total Streams",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "uniqueSongsPlayed",
  //         header: "Unique Songs",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "uniqueArtistsPlayed",
  //         header: "Unique Artists",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "totalLikes",
  //         header: "Likes",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "totalComments",
  //         header: "Comments",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "totalFollowing",
  //         header: "Following",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "totalFollowers",
  //         header: "Followers",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "playlistsCreated",
  //         header: "Playlists",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "avgStreamsPerDay",
  //         header: "Avg Streams/Day",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => value.toFixed(1),
  //       },
  //       {
  //         key: "engagementScore",
  //         header: "Engagement Score",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(Math.round(value)),
  //       },
  //       {
  //         key: "daysSinceJoined",
  //         header: "Days Since Joined",
  //         sortable: false,
  //         align: "right",
  //         render: (value: number) => formatNumber(value),
  //       },
  //       {
  //         key: "lastActiveAt",
  //         header: "Last Active",
  //         sortable: false,
  //         render: (value: string) =>
  //           new Date(value).toLocaleDateString(undefined, {
  //             month: "short",
  //             day: "numeric",
  //             year: "numeric",
  //           }),
  //       },
  //     ],
  //     []
  //   );

  //   const handleParamsChange = useCallback((newParams: DataReportParams) => {
  //     setParams({ ...newParams });
  //   }, []);

  //   const handleUserParamsChange = useCallback((newParams: DataReportParams) => {
  //     setUserParams({ ...newParams });
  //     setUserCurrentPage(0);
  //   }, []);

  //   const handleRemoveFilter = useCallback(
  //     (filterKey: string) => {
  //       const newParams = { ...params };

  //       switch (filterKey) {
  //         case "searchTerm":
  //           newParams.searchTerm = undefined;
  //           break;
  //         case "artistIds":
  //           newParams.artistIds = undefined;
  //           break;
  //         case "genres":
  //           newParams.genres = undefined;
  //           break;
  //         case "albumIds":
  //           newParams.albumIds = undefined;
  //           break;
  //         case "showOnlyNew":
  //           newParams.showOnlyNew = false;
  //           break;
  //         case "showOnlyTrending":
  //           newParams.showOnlyTrending = false;
  //           break;
  //         case "sortBy":
  //           newParams.sortBy = "streams";
  //           newParams.sortDirection = "DESC";
  //           break;
  //       }

  //       setParams(newParams);
  //     },
  //     [params]
  //   );

  //   const handleClearAllFilters = useCallback(() => {
  //     setParams({
  //       ...params,
  //       searchTerm: undefined,
  //       artistIds: undefined,
  //       genres: undefined,
  //       albumIds: undefined,
  //       showOnlyNew: false,
  //       showOnlyTrending: false,
  //       sortBy: "streams",
  //       sortDirection: "DESC",
  //       offset: 0,
  //     });
  //     setCurrentPage(0);
  //   }, [params]);

  //   const handleRowsPerPageChange = useCallback(
  //     (newLimit: number) => {
  //       setParams({ ...params, limit: newLimit, offset: 0 });
  //       setCurrentPage(0);
  //     },
  //     [params]
  //   );

  //   const handlePrevPage = useCallback(() => {
  //     const newPage = currentPage - 1;
  //     const newOffset = newPage * (params.limit || 50);
  //     setParams({ ...params, offset: newOffset });
  //     setCurrentPage(newPage);
  //   }, [params, currentPage]);

  //   const handleNextPage = useCallback(() => {
  //     const newPage = currentPage + 1;
  //     const newOffset = newPage * (params.limit || 50);
  //     setParams({ ...params, offset: newOffset });
  //     setCurrentPage(newPage);
  //   }, [params, currentPage]);

  //   const handleUserRowsPerPageChange = useCallback(
  //     (newLimit: number) => {
  //       setUserParams({ ...userParams, limit: newLimit, offset: 0 });
  //       setUserCurrentPage(0);
  //     },
  //     [userParams]
  //   );

  //   const handleUserPrevPage = useCallback(() => {
  //     const newPage = userCurrentPage - 1;
  //     const newOffset = newPage * (userParams.limit || 50);
  //     setUserParams({ ...userParams, offset: newOffset });
  //     setUserCurrentPage(newPage);
  //   }, [userParams, userCurrentPage]);

  //   const handleUserNextPage = useCallback(() => {
  //     const newPage = userCurrentPage + 1;
  //     const newOffset = newPage * (userParams.limit || 50);
  //     setUserParams({ ...userParams, offset: newOffset });
  //     setUserCurrentPage(newPage);
  //   }, [userParams, userCurrentPage]);

  //   if (error) {
  //     return (
  //       <div className={styles.container}>
  //         <DataReportsTabNav />
  //         <div className={styles.header}>
  //           <h1 className={styles.title}>Listening & Engagement</h1>
  //         </div>
  //         <div className={styles.errorContainer}>
  //           <span className={styles.errorText}>
  //             Failed to load engagement data
  //           </span>
  //         </div>
  //       </div>
  //     );
  //   }

  return (
    <div>sw</div>
    // <div className={styles.container}>
    //   <DataReportsTabNav />
    //   <div className={styles.header}>
    //     <h1 className={styles.title}>Listening & Engagement</h1>
    //     <p className={styles.description}>
    //       Top performing content, listener behavior, and platform engagement
    //       metrics
    //     </p>
    //   </div>

    //   <DataReportParameterPanel
    //     params={params}
    //     onParamsChange={handleParamsChange}
    //     showGranularity={false}
    //     showCompareTo={false}
    //     showLimit={true}
    //     showMinThresholds={true}
    //   />

    //   <AdvancedFilterPanel
    //     params={params}
    //     onParamsChange={handleParamsChange}
    //     isExpanded={isAdvancedExpanded}
    //     onToggleExpanded={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
    //   />

    //   {/* Active Filters Display */}
    //   {activeFilters.length > 0 && (
    //     <div className={styles.activeFiltersContainer}>
    //       <div className={styles.activeFiltersHeader}>
    //         <span className={styles.activeFiltersLabel}>
    //           Active Filters ({activeFilters.length})
    //         </span>
    //         <button
    //           className={styles.clearAllButton}
    //           onClick={handleClearAllFilters}
    //         >
    //           Clear All
    //         </button>
    //       </div>
    //       <div className={styles.filterChips}>
    //         {activeFilters.map((filter) => (
    //           <div key={filter.key} className={styles.filterChip}>
    //             <span className={styles.filterChipLabel}>{filter.label}:</span>
    //             <span className={styles.filterChipValue}>{filter.value}</span>
    //             <button
    //               className={styles.filterChipRemove}
    //               onClick={() => handleRemoveFilter(filter.key)}
    //               aria-label={`Remove ${filter.label} filter`}
    //             >
    //               ×
    //             </button>
    //           </div>
    //         ))}
    //       </div>
    //     </div>
    //   )}

    //   {loading ? (
    //     <div className={styles.loaderContainer}>
    //       <PuffLoader color="var(--color-accent)" size={50} />
    //     </div>
    //   ) : (
    //     <>
    //       {/* Enhanced Track Performance Table */}
    //       {data?.enhancedTracks && (
    //         <div className={styles.tableSection}>
    //           <div className={styles.tableSectionHeader}>
    //             <div>
    //               <h2 className={styles.sectionTitle}>
    //                 Detailed Track Performance
    //               </h2>
    //               <p className={styles.tableSectionDescription}>
    //                 Comprehensive track metrics with engagement, growth, and
    //                 listener data. Use advanced filters to refine results.
    //               </p>
    //             </div>
    //             {data.enhancedTracks.length > 0 && (
    //               <div className={styles.resultCount}>
    //                 Showing {data.enhancedTracks.length} track
    //                 {data.enhancedTracks.length !== 1 ? "s" : ""}
    //               </div>
    //             )}
    //           </div>
    //           <DataReportDetailTable
    //             data={data.enhancedTracks}
    //             columns={enhancedTrackColumns}
    //             loading={false}
    //           />
    //           {data.enhancedTracks.length === 0 && (
    //             <div className={styles.emptyState}>
    //               No tracks found matching the current filters. Try adjusting
    //               your parameters or clearing filters.
    //             </div>
    //           )}
    //           {/* Pagination Controls */}
    //           {data.enhancedTracks.length > 0 && (
    //             <div className={styles.paginationContainer}>
    //               <div className={styles.paginationLeft}>
    //                 <span className={styles.paginationInfo}>
    //                   Page {currentPage + 1}
    //                 </span>
    //               </div>
    //               <div className={styles.paginationRight}>
    //                 <div className={styles.rowsPerPageContainer}>
    //                   <span className={styles.rowsPerPageLabel}>Rows:</span>
    //                   <TableDropdown
    //                     options={[10, 25, 50, 100, 200].map((option) => ({
    //                       id: option.toString(),
    //                       label: option.toString(),
    //                       onClick: () => handleRowsPerPageChange(option),
    //                     }))}
    //                     trigger={
    //                       <div className={styles.rowsPerPageTrigger}>
    //                         <span>{params.limit || 50}</span>
    //                         <LuChevronDown
    //                           className={styles.rowsPerPageChevron}
    //                         />
    //                       </div>
    //                     }
    //                   />
    //                 </div>
    //                 <button
    //                   className={styles.paginationButton}
    //                   onClick={handlePrevPage}
    //                   disabled={currentPage === 0}
    //                 >
    //                   <LuChevronLeft />
    //                 </button>
    //                 <button
    //                   className={styles.paginationButton}
    //                   onClick={handleNextPage}
    //                   disabled={
    //                     data.enhancedTracks.length < (params.limit || 50)
    //                   }
    //                 >
    //                   <LuChevronRight />
    //                 </button>
    //               </div>
    //             </div>
    //           )}
    //         </div>
    //       )}
    //       {/* Top Tracks Chart */}
    //       {data?.engagement?.topTracks &&
    //         data.engagement.topTracks.length > 0 && (
    //           <div className={styles.chartSection}>
    //             <h2 className={styles.sectionTitle}>Top Performing Tracks</h2>
    //             <div className={styles.chartContainer}>
    //               <BarChart
    //                 xAxis={[
    //                   {
    //                     data: data.engagement.topTracks.map((t) => t.title),
    //                     scaleType: "band",
    //                     tickLabelStyle: {
    //                       fill: "var(--color-text-gray)",
    //                       fontSize: 11,
    //                       angle: -45,
    //                       textAnchor: "end",
    //                     },
    //                     disableLine: true,
    //                     disableTicks: true,
    //                   },
    //                 ]}
    //                 yAxis={[
    //                   {
    //                     tickLabelStyle: {
    //                       fill: "var(--color-text-gray)",
    //                       fontSize: 12,
    //                     },
    //                     disableLine: true,
    //                     disableTicks: true,
    //                   },
    //                 ]}
    //                 series={[
    //                   {
    //                     data: data.engagement.topTracks.map((t) => t.streams),
    //                     label: "Streams",
    //                     color: "var(--color-accent)",
    //                   },
    //                 ]}
    //                 sx={{
    //                   "& .MuiChartsGrid-line": {
    //                     stroke: "var(--color-gray-button)",
    //                     strokeDasharray: "4 4",
    //                     strokeWidth: 1,
    //                   },
    //                   ".MuiChartsAxis-line": {
    //                     stroke: "var(--color-gray-button)",
    //                   },
    //                   ".MuiChartsLegend-series text": {
    //                     fill: "var(--color-text-gray) !important",
    //                     fontSize: "var(--font-size-sm) !important",
    //                   },
    //                 }}
    //                 grid={{ vertical: false, horizontal: true }}
    //                 margin={{ left: 60, right: 20, top: 20, bottom: 100 }}
    //                 slotProps={{
    //                   tooltip: {
    //                     sx: {
    //                       [`& .${chartsTooltipClasses.paper}`]: {
    //                         backgroundColor:
    //                           "var(--color-panel-gray-dark) !important",
    //                         border:
    //                           "var(--border-size-sm) solid var(--color-panel-border) !important",
    //                         borderRadius: "var(--border-radius-md) !important",
    //                         padding: "var(--spacing-xs) !important",
    //                         boxShadow: "var(--shadow-sm) !important",
    //                         color: "var(--color-white-alt) !important",
    //                         fontSize: "var(--font-size-sm) !important",
    //                       },
    //                     },
    //                   },
    //                 }}
    //               />
    //             </div>
    //           </div>
    //         )}

    //       {/* Top Tracks Table */}
    //       {data?.engagement?.topTracks &&
    //         data.engagement.topTracks.length > 0 && (
    //           <div className={styles.tableSection}>
    //             <h2 className={styles.sectionTitle}>Track Details</h2>
    //             <div className={styles.tableContainer}>
    //               <table className={styles.table}>
    //                 <thead>
    //                   <tr>
    //                     <th>Rank</th>
    //                     <th>Track</th>
    //                     <th>Artist</th>
    //                     <th>Streams</th>
    //                     <th>Unique Listeners</th>
    //                     <th>Growth</th>
    //                   </tr>
    //                 </thead>
    //                 <tbody>
    //                   {data.engagement.topTracks.map((track, index) => (
    //                     <tr key={track.songId}>
    //                       <td className={styles.rank}>#{index + 1}</td>
    //                       <td className={styles.trackTitle}>{track.title}</td>
    //                       <td>{track.artistName}</td>
    //                       <td>{track.streams.toLocaleString()}</td>
    //                       <td>{track.uniqueListeners.toLocaleString()}</td>
    //                       <td
    //                         className={
    //                           track.growthPercent >= 0
    //                             ? styles.growthPositive
    //                             : styles.growthNegative
    //                         }
    //                       >
    //                         {track.growthPercent >= 0 ? "+" : ""}
    //                         {track.growthPercent.toFixed(1)}%
    //                       </td>
    //                     </tr>
    //                   ))}
    //                 </tbody>
    //               </table>
    //             </div>
    //           </div>
    //         )}

    //       {/* Concentration Metrics */}
    //       {data?.engagement?.concentration && (
    //         <div className={styles.concentrationSection}>
    //           <h2 className={styles.sectionTitle}>
    //             Content Concentration (Pareto Analysis)
    //           </h2>
    //           <div className={styles.concentrationGrid}>
    //             <div className={styles.concentrationCard}>
    //               <span className={styles.concentrationLabel}>
    //                 Top 1% of Tracks
    //               </span>
    //               <span className={styles.concentrationValue}>
    //                 {data.engagement.concentration.top1Percent.toFixed(1)}%
    //               </span>
    //               <span className={styles.concentrationSubtext}>
    //                 of total streams
    //               </span>
    //             </div>
    //             <div className={styles.concentrationCard}>
    //               <span className={styles.concentrationLabel}>
    //                 Top 10% of Tracks
    //               </span>
    //               <span className={styles.concentrationValue}>
    //                 {data.engagement.concentration.top10Percent.toFixed(1)}%
    //               </span>
    //               <span className={styles.concentrationSubtext}>
    //                 of total streams
    //               </span>
    //             </div>
    //             <div className={styles.concentrationCard}>
    //               <span className={styles.concentrationLabel}>
    //                 Top 50% of Tracks
    //               </span>
    //               <span className={styles.concentrationValue}>
    //                 {data.engagement.concentration.top50Percent.toFixed(1)}%
    //               </span>
    //               <span className={styles.concentrationSubtext}>
    //                 of total streams
    //               </span>
    //             </div>
    //           </div>
    //         </div>
    //       )}

    //       {/* Session Length */}
    //       {data?.engagement && (
    //         <div className={styles.metricsSection}>
    //           <div className={styles.metricCard}>
    //             <span className={styles.metricLabel}>Avg. Session Length</span>
    //             <span className={styles.metricValue}>
    //               {data.engagement.averageSessionLength.toFixed(1)} minutes
    //             </span>
    //           </div>
    //         </div>
    //       )}

    //       {/* Grid Layout - Additional Charts */}
    //       <div className={styles.gridContainer}>
    //         {/* Engagement Time Series */}
    //         {data?.timeseries && data.timeseries.length > 0 && (
    //           <div className={styles.gridItem}>
    //             <h2 className={styles.sectionTitle}>Engagement Trends</h2>
    //             <div className={styles.chartContainer}>
    //               <LineChart
    //                 xAxis={[
    //                   {
    //                     data: data.timeseries.map((d) =>
    //                       new Date(d.period).toLocaleDateString(undefined, {
    //                         month: "short",
    //                         day: "numeric",
    //                       })
    //                     ),
    //                     scaleType: "point",
    //                     tickLabelStyle: {
    //                       fill: "var(--color-text-gray)",
    //                       fontSize: 10,
    //                       angle: -45,
    //                       textAnchor: "end",
    //                     },
    //                     disableLine: true,
    //                     disableTicks: true,
    //                   },
    //                 ]}
    //                 yAxis={[
    //                   {
    //                     tickLabelStyle: {
    //                       fill: "var(--color-text-gray)",
    //                       fontSize: 11,
    //                     },
    //                     disableLine: true,
    //                     disableTicks: true,
    //                   },
    //                 ]}
    //                 series={[
    //                   {
    //                     data: data.timeseries.map((d) => d.likes),
    //                     label: "Likes",
    //                     color: "var(--color-accent)",
    //                     curve: "natural",
    //                     showMark: false,
    //                   },
    //                   {
    //                     data: data.timeseries.map((d) => d.comments),
    //                     label: "Comments",
    //                     color: "var(--color-green)",
    //                     curve: "natural",
    //                     showMark: false,
    //                   },
    //                 ]}
    //                 height={300}
    //                 sx={{
    //                   "& .MuiChartsGrid-line": {
    //                     stroke: "var(--color-gray-button)",
    //                     strokeDasharray: "4 4",
    //                   },
    //                   ".MuiChartsLegend-series text": {
    //                     fill: "var(--color-text-gray) !important",
    //                   },
    //                 }}
    //                 grid={{ vertical: true, horizontal: true }}
    //                 margin={{ left: 60, right: 20, top: 20, bottom: 70 }}
    //                 slotProps={{
    //                   tooltip: {
    //                     sx: {
    //                       [`& .${chartsTooltipClasses.paper}`]: {
    //                         backgroundColor:
    //                           "var(--color-panel-gray-dark) !important",
    //                         border:
    //                           "var(--border-size-sm) solid var(--color-panel-border) !important",
    //                         borderRadius: "var(--border-radius-md) !important",
    //                         padding: "var(--spacing-xs) !important",
    //                         color: "var(--color-white-alt) !important",
    //                       },
    //                     },
    //                   },
    //                 }}
    //               />
    //             </div>
    //           </div>
    //         )}

    //         {/* Pareto Chart */}
    //         {data?.pareto && data.pareto.length > 0 && (
    //           <div className={styles.gridItem}>
    //             <h2 className={styles.sectionTitle}>
    //               Pareto Distribution (80/20 Rule)
    //             </h2>
    //             <div className={styles.chartContainer}>
    //               <LineChart
    //                 xAxis={[
    //                   {
    //                     data: data.pareto.map((d) => d.songPercentile),
    //                     label: "% of Songs",
    //                     tickLabelStyle: {
    //                       fill: "var(--color-text-gray)",
    //                       fontSize: 11,
    //                     },
    //                     disableLine: true,
    //                     disableTicks: true,
    //                   },
    //                 ]}
    //                 yAxis={[
    //                   {
    //                     label: "Cumulative % of Streams",
    //                     tickLabelStyle: {
    //                       fill: "var(--color-text-gray)",
    //                       fontSize: 11,
    //                     },
    //                     disableLine: true,
    //                     disableTicks: true,
    //                   },
    //                 ]}
    //                 series={[
    //                   {
    //                     data: data.pareto.map((d) => d.cumulativeStreamPercent),
    //                     label: "Stream Concentration",
    //                     color: "var(--color-accent)",
    //                     curve: "natural",
    //                     showMark: false,
    //                     area: true,
    //                   },
    //                 ]}
    //                 height={300}
    //                 sx={{
    //                   "& .MuiChartsGrid-line": {
    //                     stroke: "var(--color-gray-button)",
    //                     strokeDasharray: "4 4",
    //                   },
    //                   ".MuiChartsLegend-series text": {
    //                     fill: "var(--color-text-gray) !important",
    //                   },
    //                   ".MuiAreaElement-root": {
    //                     fill: "url('#paretoGradient')",
    //                   },
    //                 }}
    //                 grid={{ vertical: true, horizontal: true }}
    //                 margin={{ left: 80, right: 20, top: 20, bottom: 60 }}
    //                 slotProps={{
    //                   tooltip: {
    //                     sx: {
    //                       [`& .${chartsTooltipClasses.paper}`]: {
    //                         backgroundColor:
    //                           "var(--color-panel-gray-dark) !important",
    //                         border:
    //                           "var(--border-size-sm) solid var(--color-panel-border) !important",
    //                         borderRadius: "var(--border-radius-md) !important",
    //                         padding: "var(--spacing-xs) !important",
    //                         color: "var(--color-white-alt) !important",
    //                       },
    //                     },
    //                   },
    //                 }}
    //               >
    //                 <defs>
    //                   <linearGradient
    //                     id="paretoGradient"
    //                     x1="0"
    //                     y1="0"
    //                     x2="0"
    //                     y2="1"
    //                   >
    //                     <stop
    //                       offset="0%"
    //                       stopColor="var(--color-accent)"
    //                       stopOpacity={0.4}
    //                     />
    //                     <stop
    //                       offset="100%"
    //                       stopColor="var(--color-accent)"
    //                       stopOpacity={0.0}
    //                     />
    //                   </linearGradient>
    //                 </defs>
    //               </LineChart>
    //             </div>
    //           </div>
    //         )}
    //       </div>

    //       {/* Artist Performance Leaderboard */}
    //       {data?.artists && data.artists.length > 0 && (
    //         <div className={styles.tableSection}>
    //           <h2 className={styles.sectionTitle}>
    //             Artist Performance Leaderboard
    //           </h2>
    //           <DataReportDetailTable
    //             data={data.artists}
    //             columns={artistColumns}
    //             loading={false}
    //           />
    //         </div>
    //       )}

    //       {/* Genre Breakdown */}
    //       {data?.genre && data.genre.length > 0 && (
    //         <div className={styles.genreSection}>
    //           <h2 className={styles.sectionTitle}>Genre Distribution</h2>
    //           <GenreBreakdown data={data.genre} />
    //         </div>
    //       )}

    //       {/* User Analytics Table */}
    //       {data?.userAnalytics && (
    //         <div className={styles.tableSection}>
    //           <div className={styles.tableSectionHeader}>
    //             <div>
    //               <h2 className={styles.sectionTitle}>
    //                 Comprehensive User Analytics
    //               </h2>
    //               <p className={styles.tableSectionDescription}>
    //                 Detailed per-user metrics including streams, engagement,
    //                 social activity, and behavioral patterns.
    //               </p>
    //             </div>
    //           </div>
    //           <UserAnalyticsFilterPanel
    //             params={userParams}
    //             onParamsChange={handleUserParamsChange}
    //           />
    //           <DataReportDetailTable
    //             data={data.userAnalytics}
    //             columns={userAnalyticsColumns}
    //             loading={false}
    //           />
    //           {data.userAnalytics.length === 0 && (
    //             <div className={styles.emptyState}>
    //               No users found matching the current filters.
    //             </div>
    //           )}
    //           {/* Pagination Controls */}
    //           {data.userAnalytics.length > 0 && (
    //             <div className={styles.paginationContainer}>
    //               <div className={styles.paginationLeft}>
    //                 <span className={styles.paginationInfo}>
    //                   Page {userCurrentPage + 1}
    //                 </span>
    //               </div>
    //               <div className={styles.paginationRight}>
    //                 <div className={styles.rowsPerPageContainer}>
    //                   <span className={styles.rowsPerPageLabel}>Rows:</span>
    //                   <TableDropdown
    //                     options={[10, 25, 50, 100, 200].map((option) => ({
    //                       id: option.toString(),
    //                       label: option.toString(),
    //                       onClick: () => handleUserRowsPerPageChange(option),
    //                     }))}
    //                     trigger={
    //                       <div className={styles.rowsPerPageTrigger}>
    //                         <span>{userParams.limit || 50}</span>
    //                         <LuChevronDown
    //                           className={styles.rowsPerPageChevron}
    //                         />
    //                       </div>
    //                     }
    //                   />
    //                 </div>
    //                 <button
    //                   className={styles.paginationButton}
    //                   onClick={handleUserPrevPage}
    //                   disabled={userCurrentPage === 0}
    //                 >
    //                   <LuChevronLeft />
    //                 </button>
    //                 <button
    //                   className={styles.paginationButton}
    //                   onClick={handleUserNextPage}
    //                   disabled={
    //                     data.userAnalytics.length < (userParams.limit || 50)
    //                   }
    //                 >
    //                   <LuChevronRight />
    //                 </button>
    //               </div>
    //             </div>
    //           )}
    //         </div>
    //       )}

    //       {/* Big Stat Panels */}
    //       {data?.engagement && data?.timeseries && (
    //         <div className={styles.bigStatsGrid}>
    //           <BigStatPanel
    //             title="Viral Coefficient"
    //             value={(() => {
    //               // Calculate shares per user (using comments as proxy for engagement/sharing)
    //               const totalEngagement = data.timeseries.reduce(
    //                 (sum, d) => sum + d.likes + d.comments,
    //                 0
    //               );
    //               const totalStreams = data.timeseries.reduce(
    //                 (sum, d) => sum + d.streams,
    //                 0
    //               );
    //               const coefficient = (totalEngagement / totalStreams) * 10;
    //               return coefficient.toFixed(2);
    //             })()}
    //             subtitle="Engagement multiplier effect"
    //             trend={(() => {
    //               const firstHalf = data.timeseries
    //                 .slice(0, Math.floor(data.timeseries.length / 2))
    //                 .reduce((sum, d) => sum + d.likes + d.comments, 0);
    //               const secondHalf = data.timeseries
    //                 .slice(Math.floor(data.timeseries.length / 2))
    //                 .reduce((sum, d) => sum + d.likes + d.comments, 0);
    //               return secondHalf > firstHalf
    //                 ? "up"
    //                 : secondHalf < firstHalf
    //                 ? "down"
    //                 : "neutral";
    //             })()}
    //             trendValue={(() => {
    //               const firstHalf = data.timeseries
    //                 .slice(0, Math.floor(data.timeseries.length / 2))
    //                 .reduce((sum, d) => sum + d.likes + d.comments, 0);
    //               const secondHalf = data.timeseries
    //                 .slice(Math.floor(data.timeseries.length / 2))
    //                 .reduce((sum, d) => sum + d.likes + d.comments, 0);
    //               const change = ((secondHalf - firstHalf) / firstHalf) * 100;
    //               return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
    //             })()}
    //           />
    //           <BigStatPanel
    //             title="Content Saturation"
    //             value={`${(() => {
    //               // Calculate what % of catalog is being consumed
    //               if (!data.engagement.topTracks.length) return "0";
    //               const top10Streams = data.engagement.topTracks
    //                 .slice(0, 10)
    //                 .reduce((sum, t) => sum + t.streams, 0);
    //               const totalStreams = data.engagement.topTracks.reduce(
    //                 (sum, t) => sum + t.streams,
    //                 0
    //               );
    //               return ((top10Streams / totalStreams) * 100).toFixed(0);
    //             })()}%`}
    //             subtitle="Top 10 tracks share of streams"
    //             trend={
    //               parseInt(
    //                 (() => {
    //                   if (!data.engagement.topTracks.length) return "0";
    //                   const top10Streams = data.engagement.topTracks
    //                     .slice(0, 10)
    //                     .reduce((sum, t) => sum + t.streams, 0);
    //                   const totalStreams = data.engagement.topTracks.reduce(
    //                     (sum, t) => sum + t.streams,
    //                     0
    //                   );
    //                   return ((top10Streams / totalStreams) * 100).toFixed(0);
    //                 })()
    //               ) > 50
    //                 ? "down"
    //                 : "up"
    //             }
    //             trendValue={
    //               parseInt(
    //                 (() => {
    //                   if (!data.engagement.topTracks.length) return "0";
    //                   const top10Streams = data.engagement.topTracks
    //                     .slice(0, 10)
    //                     .reduce((sum, t) => sum + t.streams, 0);
    //                   const totalStreams = data.engagement.topTracks.reduce(
    //                     (sum, t) => sum + t.streams,
    //                     0
    //                   );
    //                   return ((top10Streams / totalStreams) * 100).toFixed(0);
    //                 })()
    //               ) > 50
    //                 ? "High concentration"
    //                 : "Diverse listening"
    //             }
    //           />
    //         </div>
    //       )}

    //       {/* Mini Stats Panels */}
    //       {data?.engagement && data?.genre && (
    //         <div className={styles.miniStatsGrid}>
    //           <MiniStatPanel
    //             title="Content Diversity Index"
    //             value={(() => {
    //               // Calculate Herfindahl-Hirschman Index (HHI) for genre diversity
    //               // Lower HHI = more diverse, convert to 0-100 scale where 100 = most diverse
    //               const totalStreams = data.genre.reduce(
    //                 (sum, g) => sum + g.streams,
    //                 0
    //               );
    //               const hhi = data.genre.reduce((sum, g) => {
    //                 const share = g.streams / totalStreams;
    //                 return sum + share * share * 10000;
    //               }, 0);
    //               const diversityIndex = Math.max(0, 100 - hhi / 100).toFixed(
    //                 0
    //               );
    //               return diversityIndex;
    //             })()}
    //             subtitle={`across ${data.genre.length} genres`}
    //             trend={data.genre.slice(0, 10).map((g) => g.streams)}
    //             trendColor="var(--color-accent)"
    //           />
    //           <MiniStatPanel
    //             title="Listener Loyalty Score"
    //             value={(() => {
    //               // Calculate avg streams per unique listener across top tracks
    //               if (!data.engagement.topTracks.length) return "0";
    //               const avgLoyalty =
    //                 data.engagement.topTracks.reduce(
    //                   (sum, t) => sum + t.streams / t.uniqueListeners,
    //                   0
    //                 ) / data.engagement.topTracks.length;
    //               return avgLoyalty.toFixed(1);
    //             })()}
    //             subtitle="avg replays per listener"
    //             trend={data.engagement.topTracks
    //               .slice(0, 10)
    //               .map((t) => t.streams / t.uniqueListeners)}
    //             trendColor="var(--color-green)"
    //             showArea
    //           />
    //         </div>
    //       )}

    //       {/* Story Panel */}
    //       {data?.engagement?.story && (
    //         <DataReportStoryPanel
    //           story={data.engagement.story}
    //           title="Engagement Insights"
    //         />
    //       )}
    //     </>
    //   )}
    // </div>
  );
};

export default memo(DataReportEngagement);
