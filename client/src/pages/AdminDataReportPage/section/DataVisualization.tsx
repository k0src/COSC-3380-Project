import React from "react";
import styles from "../DataReport.module.css";

interface Props {
  data: any[];
  loading: boolean;
  error: string | null;
  summary?: any;
}

const DataVisualization: React.FC<Props> = ({ data, loading, error, summary }) => {
  if (loading) return <div className={styles.loading}>Loading data...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data.length && !summary) return <div className={styles.placeholder}>No data to display yet.</div>;

  // Check if this is the new simplified moderation report
  const isSimplifiedModerationReport = data.length > 0 && data[0] && ('report_summary_by_name' in data[0] || 'reported_entries' in data[0]);
  
  // For simplified moderation report, extract the two table datasets
  const reportSummaryByName = isSimplifiedModerationReport && data[0] ? (data[0] as any).report_summary_by_name : null;
  const reportDetails = isSimplifiedModerationReport && data[0] ? (data[0] as any).report_details : null;
  
  // Legacy support: fall back to reported_entries if new fields don't exist
  const displayData = isSimplifiedModerationReport 
    ? (reportSummaryByName || (data[0] as any).reported_entries) 
    : data;

  // Helper function to format cell values
  const formatCellValue = (key: string, value: any): string | React.ReactElement => {
    if (value === null || value === undefined) return "N/A";

    // Handle friendly display for report types
    if (key === "report_type") {
      const typeMap: Record<string, string> = {
        EXPLICIT: "Explicit Content",
        VIOLENT: "Violent Content",
        HATEFUL: "Hateful Content",
        COPYRIGHT: "Copyright"
      };
      return typeMap[value] || value;
    }

    // Handle friendly display for item types
    if (key === "item_type") {
      const itemMap: Record<string, string> = {
        user: "User",
        song: "Song",
        album: "Album",
        playlist: "Playlist"
      };
      return itemMap[value] || value;
    }

    // Handle friendly display for status
    if (key === "status") {
      const statusMap: Record<string, { label: string; color: string }> = {
        pending: { label: "Pending", color: "" },
        resolved: { label: "Resolved", color: styles.positive },
        dismissed: { label: "Dismissed", color: styles.negative }
      };
      const statusInfo = statusMap[value] || { label: value, color: "" };
      return <span className={statusInfo.color}>{statusInfo.label}</span>;
    }

    // Handle friendly display for action
    if (key === "action") {
      if (!value) return "—";
      const actionMap: Record<string, string> = {
        suspended: "Suspended",
        hidden: "Hidden",
        dismissed: "No Action"
      };
      return actionMap[value] || value;
    }

    // Handle trend indicators
    if (key === "trend") {
      const trendMap: Record<string, { icon: string; color: string }> = {
        increasing: { icon: "↑", color: styles.negative }, // Red for increasing reports (bad)
        decreasing: { icon: "↓", color: styles.positive }, // Green for decreasing reports (good)
        stable: { icon: "→", color: "" },
        new: { icon: "●", color: "" }
      };
      const trend = trendMap[value] || { icon: String(value), color: "" };
      return <span className={trend.color}>{trend.icon} {String(value).toUpperCase()}</span>;
    }

    // Handle percentage fields with growth indicators
    if (key.includes("percent") || key.includes("rate")) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return String(value);
      
      // Add color coding for report change (opposite of user growth)
      if (key === "report_change_percent") {
        const indicator = numValue > 0 ? "↑" : numValue < 0 ? "↓" : "→";
        const colorClass = numValue > 0 ? styles.negative : numValue < 0 ? styles.positive : "";
        return (
          <span className={colorClass}>
            {indicator} {Math.abs(numValue)}%
          </span>
        );
      }
      
      // Standard growth indicators (for user reports)
      if (key.includes("growth")) {
        const indicator = numValue > 0 ? "↑" : numValue < 0 ? "↓" : "→";
        const colorClass = numValue > 0 ? styles.positive : numValue < 0 ? styles.negative : "";
        return (
          <span className={colorClass}>
            {indicator} {Math.abs(numValue)}%
          </span>
        );
      }
      
      return `${numValue}%`;
    }

    // Handle date formatting
    if (key === "created_at" || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
      return value.split("T")[0];
    }

    // Handle large numbers with commas
    if (typeof value === "number" && value >= 1000) {
      return value.toLocaleString();
    }

    return String(value);
  };

  const formatColumnHeader = (key: string): string => {
    // Special formatting for specific columns
    const headerMap: Record<string, string> = {
      period: "Period",
      active_users: "Active Users",
      total_streams: "Total Streams",
      unique_songs_played: "Unique Songs",
      avg_streams_per_user: "Avg Streams/User",
      total_registered_users: "Total Users",
      engagement_rate_percent: "Engagement Rate",
      previous_period_active_users: "Prev Period Users",
      previous_period_streams: "Prev Period Streams",
      user_growth_percent: "User Growth",
      stream_growth_percent: "Stream Growth",
      peak_period: "Peak Period",
      peak_active_users: "Peak Users",
      peak_streams: "Peak Streams",
      percent_of_peak: "% of Peak",
      // System Moderation Report headers (legacy)
      total_reports: "Total Reports",
      unique_items_reported: "Unique Items",
      actions_taken: "Actions Taken",
      action_rate_percent: "Action Rate",
      percentage_of_total: "% of Total",
      previous_period_reports: "Prev Period",
      report_change_percent: "Change",
      trend: "Trend",
      // Content Streaming Report headers
      song_name: "Song",
      album_name: "Album",
      artist_name: "Artist",
      album_title: "Album",
      genre: "Genre",
      stream_count: "Streams",
      unique_listeners: "Unique Listeners",
      avg_streams_per_listener: "Avg Streams/Listener",
      percentage_of_total_streams: "% of Total",
      release_date: "Release Date",
      songs_in_album: "Songs",
      songs_streamed: "Songs Streamed",
      albums_streamed: "Albums",
      // Audience Growth Report headers
      joined_in: "Joined In",
      total_users: "Total Users",
      returned_week1: "First-Week Return",
      week1_retention_percent: "Week 1 %",
      returned_week4: "1 Month Return",
      week4_retention_percent: "1 Month %",
      came_back_this_month: "This Month's Return",
      this_month_retention_percent: "This Month %",
      median_plays: "Median Plays",
      avg_plays: "Avg Plays",
      // Simplified Moderation Report headers (new)
      report_type: "Report Type",
      item_type: "Item Type",
      item_name: "Item",
      status: "Status",
      created_at: "Date",
      action: "Action"
    };

    return headerMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Group columns for better organization
  const getCoreColumns = () => ["period", "active_users", "total_streams", "unique_songs_played", "avg_streams_per_user"];
  const getModerationCoreColumns = () => ["report_type", "total_reports", "unique_items_reported", "actions_taken", "action_rate_percent", "percentage_of_total"];
  const getAudienceGrowthColumns = () => [
    "joined_in", 
    "total_users", 
    "returned_week1", 
    "week1_retention_percent",
    "returned_week4", 
    "week4_retention_percent",
    "came_back_this_month", 
    "this_month_retention_percent",
    "avg_plays"
  ];

  const columns = displayData && displayData.length > 0 ? Object.keys(displayData[0]) : [];
  const coreColumns = columns.filter(col => getCoreColumns().includes(col));
  const moderationCoreColumns = columns.filter(col => getModerationCoreColumns().includes(col));
  const audienceGrowthColumns = columns.filter(col => getAudienceGrowthColumns().includes(col));

  // Check if this is an enhanced report (has new context fields)
  const isEnhancedReport = columns.some(col => 
    ["user_growth_percent", "engagement_rate_percent", "avg_streams_per_user"].includes(col)
  );
  
  // Check if this is a moderation report
  const isModerationReport = columns.some(col => 
    ["report_type", "report_change_percent", "trend"].includes(col)
  );
  
  // Check if this is an audience growth report
  const isAudienceGrowthReport = columns.some(col =>
    ["joined_in", "week1_retention_percent", "median_plays"].includes(col)
  );

  return (
    <div className={styles.reportContainer}>
      {summary && (
        <div className={styles.summaryCard}>
          <h3>{isSimplifiedModerationReport ? "Content Moderation Summary" : "Platform Summary"}</h3>
          <div className={styles.summaryGrid}>
            {/* Simplified Moderation Report Summary */}
            {isSimplifiedModerationReport && (data[0] as any).summary && (
              <>
                <div className={styles.summaryItem}>
                  <strong>Total Reports</strong>
                  <span>{(data[0] as any).summary.total_reports?.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <strong>People Who Reported</strong>
                  <span>{(data[0] as any).summary.unique_reporters?.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <strong>Items Reported</strong>
                  <span>{(data[0] as any).summary.unique_items_reported?.toLocaleString()}</span>
                </div>
                
                {/* Report Types Breakdown */}
                {(data[0] as any).summary.reports_by_type && (
                  <>
                    {Object.entries((data[0] as any).summary.reports_by_type).map(([type, count]: [string, any]) => (
                      <div key={type} className={styles.summaryItem}>
                        <strong>{formatCellValue("report_type", type)}</strong>
                        <span>{count?.toLocaleString()}</span>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
            
            {/* Audience Growth Summary */}
            {summary.active_listeners !== undefined && (
              <>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total User Accounts:</span>
                  <span className={styles.summaryValue}>{summary.active_listeners?.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>New Users (Date Range):</span>
                  <span className={styles.summaryValue}>{summary.new_users?.toLocaleString()}</span>
                </div>
              </>
            )}
            
            {/* System Moderation Reports Summary */}
            {summary.total_reports !== undefined && (
              <>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Reports:</span>
                  <span className={styles.summaryValue}>{summary.total_reports?.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Pending Reports:</span>
                  <span className={styles.summaryValue}>{summary.pending_reports?.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Resolved Reports:</span>
                  <span className={styles.summaryValue}>{summary.resolved_reports?.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Unique Items Reported:</span>
                  <span className={styles.summaryValue}>{summary.unique_items_reported?.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Repeat Offenders:</span>
                  <span className={styles.summaryValue}>{summary.repeat_offenders_count?.toLocaleString()}</span>
                </div>
              </>
            )}
            
            {/* Content Streaming Reports Summary */}
            {summary.total_platform_streams !== undefined && (
              <>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Platform Streams:</span>
                  <span className={styles.summaryValue}>{summary.total_platform_streams.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Unique Listeners:</span>
                  <span className={styles.summaryValue}>{summary.unique_listeners.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Avg Streams/Listener:</span>
                  <span className={styles.summaryValue}>{summary.avg_streams_per_listener}</span>
                </div>
                {summary.filtered_by_genre && (
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Filtered by Genre:</span>
                    <span className={styles.summaryValue}>{summary.filtered_by_genre}</span>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Repeat Offenders List */}
          {summary.repeat_offenders && summary.repeat_offenders.length > 0 && (
            <div className={styles.repeatOffendersSection}>
              <h4>Top Repeat Offenders</h4>
              <table className={styles.miniTable}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Name</th>
                    <th>Report Count</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.repeat_offenders.map((offender: any, index: number) => (
                    <tr key={index}>
                      <td>{offender.entity_type.toUpperCase()}</td>
                      <td>{offender.entity_name || 'Unknown'}</td>
                      <td>{offender.report_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <h3 className={styles.sectionTitle}>
        {isSimplifiedModerationReport ? "Content Moderation Report" : "Data Report Results"}
      </h3>

      {isSimplifiedModerationReport && reportSummaryByName && reportDetails ? (
        // New: Two-table layout for moderation reports
        <>
          {/* Table 1: Report Summary by Name */}
          <div className={styles.tableSection}>
            <h4 className={styles.tableTitle}>Report Summary by Name</h4>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Content Type</th>
                    <th>Total Reports</th>
                    <th>Latest Reported At</th>
                  </tr>
                </thead>
                <tbody>
                  {reportSummaryByName.map((row: any, i: number) => (
                    <tr key={i}>
                      <td>{row.name || 'Unknown'}</td>
                      <td>{formatCellValue("item_type", row.content_type)}</td>
                      <td>{row.total_reports}</td>
                      <td>{formatCellValue("created_at", row.latest_reported_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Report Details */}
          <div className={styles.tableSection}>
            <h4 className={styles.tableTitle}>Report Details</h4>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Report Type</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportDetails.map((row: any, i: number) => (
                    <tr key={i}>
                      <td>{row.name || 'Unknown'}</td>
                      <td>{formatCellValue("report_type", row.report_type)}</td>
                      <td>{formatCellValue("status", row.status)}</td>
                      <td>{formatCellValue("created_at", row.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : isSimplifiedModerationReport ? (
        // Legacy: Single table for old moderation report format
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Content Type</th>
                <th>Name</th>
                <th># Reports</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row: any, i: number) => (
                <tr key={i}>
                  <td>{formatCellValue("item_type", row.item_type)}</td>
                  <td>{row.item_name || row.item_id}</td>
                  <td>{row.report_count || 1}</td>
                  <td>{formatCellValue("created_at", row.created_at)}</td>
                  <td>{formatCellValue("status", row.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : isAudienceGrowthReport ? (
        // Audience Growth Report
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {audienceGrowthColumns.map((col) => (
                    <th key={col}>{formatColumnHeader(col)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {audienceGrowthColumns.map((col) => (
                      <td key={col}>{formatCellValue(col, row[col])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* User Details Table */}
          {summary?.user_details && summary.user_details.length > 0 && (
            <>
              <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>User Activity Details</h3>
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Joined Date</th>
                      <th>Total Listens</th>
                      <th>Last Listened</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.user_details.map((user: any, i: number) => (
                      <tr key={i}>
                        <td>{user.username}</td>
                        <td>{formatCellValue("created_at", user.joined_date)}</td>
                        <td>{user.total_listens?.toLocaleString()}</td>
                        <td>{user.last_listened ? formatCellValue("created_at", user.last_listened) : "Never"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : isEnhancedReport ? (
        <div className={styles.tableWrapper}>
          {/* all metrics */}
          {coreColumns.length > 0 && (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    {coreColumns.map((key) => (
                      <th key={key}>{formatColumnHeader(key)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
                    <tr key={index}>
                      {coreColumns.map((key) => (
                        <td key={key}>{formatCellValue(key, row[key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Original single table view for non-enhanced reports
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                {isModerationReport ? (
                  /* Core moderation columns only - no trend columns */
                  moderationCoreColumns.map((col) => (
                    <th key={col}>{formatColumnHeader(col)}</th>
                  ))
                ) : (
                  /* Show all columns for other report types */
                  columns.map((col) => (
                    <th key={col}>{formatColumnHeader(col)}</th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {isModerationReport ? (
                    moderationCoreColumns.map((col) => (
                      <td key={col}>{formatCellValue(col, row[col])}</td>
                    ))
                  ) : (
                    columns.map((col) => (
                      <td key={col}>{formatCellValue(col, row[col])}</td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataVisualization;