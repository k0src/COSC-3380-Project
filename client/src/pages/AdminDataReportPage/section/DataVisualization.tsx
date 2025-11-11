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
  if (!data.length) return <div className={styles.placeholder}>No data to display yet.</div>;

  // Helper function to format cell values
  const formatCellValue = (key: string, value: any): string | React.ReactElement => {
    if (value === null || value === undefined) return "N/A";

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
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
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
      // System Moderation Report headers
      report_type: "Report Type",
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
      albums_streamed: "Albums"
    };

    return headerMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Group columns for better organization
  const getCoreColumns = () => ["period", "active_users", "total_streams", "unique_songs_played", "avg_streams_per_user"];
  const getModerationCoreColumns = () => ["report_type", "total_reports", "unique_items_reported", "actions_taken", "action_rate_percent", "percentage_of_total"];

  const columns = Object.keys(data[0]);
  const coreColumns = columns.filter(col => getCoreColumns().includes(col));
  const moderationCoreColumns = columns.filter(col => getModerationCoreColumns().includes(col));

  // Check if this is an enhanced report (has new context fields)
  const isEnhancedReport = columns.some(col => 
    ["user_growth_percent", "engagement_rate_percent", "avg_streams_per_user"].includes(col)
  );
  
  // Check if this is a moderation report
  const isModerationReport = columns.some(col => 
    ["report_type", "report_change_percent", "trend"].includes(col)
  );

  return (
    <div className={styles.reportContainer}>
      {summary && (
        <div className={styles.summaryCard}>
          <h3>Platform Summary</h3>
          <div className={styles.summaryGrid}>
            {/* User Reports Summary */}
            {summary.platform_avg_active_users !== undefined && (
              <>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Users:</span>
                  <span className={styles.summaryValue}>{data[0]?.total_registered_users?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Avg Active Users:</span>
                  <span className={styles.summaryValue}>{summary.platform_avg_active_users?.toLocaleString()}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Avg Streams:</span>
                  <span className={styles.summaryValue}>{summary.platform_avg_streams?.toLocaleString()}</span>
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

      <h3 className={styles.sectionTitle}>Data Report Results</h3>

      {isEnhancedReport ? (
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