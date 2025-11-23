import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminAPI } from "@api"; 
import { artistApi } from "../../api/artist.api";
import type { ReportEntity, Report } from "@types";
import ReportDropdown from "./sections/ReportDrpdown";
import ReportsList from "./sections/ReportList";
import styles from "./Report.module.css";
import { useAuth } from "@contexts";

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [entity, setEntity] = useState<ReportEntity>("SONG");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {user, isAuthenticated} = useAuth();

  useEffect(() => {
    fetchReports();
  }, [entity]);

  if(!isAuthenticated || !user){
    return null;
  }

  async function fetchReports() {
  try {
    setLoading(true);
    setError(null);
    const data = await AdminAPI.getReports(entity);
      // If we're viewing ARTIST reports and the server didn't join the artist name,
      // fetch missing artist display names and merge into the reports.
      if (entity === "ARTIST" && data && data.length) {
        const missingIds: string[] = Array.from(
          new Set(
            data.filter((r: Report) => !r.reported_name).map((r: Report) => r.reported_id)
          )
        );

        if (missingIds.length && user) {
          const accessContext = {
            role: user.role === "ADMIN" ? "admin" : "user",
            userId: user.id,
            scope: "single",
          } as const;

          // Batch fetch artist info in parallel
          const artistPromises = missingIds.map((id: string) =>
            artistApi.getArtistById(id, accessContext, { includeUser: false }).then(
              (a: any) => ({ id, name: a.display_name })
            ).catch(() => ({ id, name: undefined }))
          );

          const artists = await Promise.all(artistPromises);
          const nameMap: Record<string, string | undefined> = {};
          artists.forEach((a) => (nameMap[a.id] = a.name));

          // Merge names into reports
          const merged = data.map((r: Report) => ({
            ...r,
            reported_name: r.reported_name || nameMap[r.reported_id],
          }));

          console.log("Merged reports with artist names:", merged);

          setReports(merged);
        } else {
          setReports(data);
        }
      } else {
        setReports(data);
      }
  } catch (err) {
    console.error(err);
    setError("An error occurred while fetching reports");
  } finally {
    setLoading(false);
  }
}

  // Handle admin decision
  async function handleAction(reportId: string, action: "suspend" | "reject") {
    try {
      setLoading(true);

      if (!user) return;
      const adminId = user.id
      const response = await AdminAPI.decideReport(entity, reportId, action, adminId );

      if (response.success) {
        //Remove the processed report from the local state instead of refetching
        setReports(prevReports => prevReports.filter(report => report.report_id !== reportId));
      } else {
        alert(`Failed to update report: ${response.message}`);
      }
    } catch (error) {
      console.error("Error updating report:", error);
      alert("An error occurred while performing the action.");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <>
      <button 
        className={styles.backButton}
        onClick={() => navigate("/Admin")}
      >
        ← Back to Dashboard
      </button>
      <main className={styles.contentArea}>
        <div className={styles.contentWrapper}>
          {/* Dropdown Section */}
          <div className={styles.reportDropdownContainer}>
            <ReportDropdown selectedReport={entity} onSelect={setEntity} />
          </div>

          {/* Reports List Section */}
          <div className={styles.reportListSection}>
            {loading && <p>Loading reports...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && (
              <ReportsList
                ReportEntity={entity}
                reports={reports}
                loading={loading}
                error={error}
                onAction={handleAction}
              />
            )}
          </div>
        </div>
      </main>

    </>
  );
};

export default ReportPage;