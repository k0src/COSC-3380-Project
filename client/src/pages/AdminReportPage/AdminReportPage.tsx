import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {AdminAPI, type Report, type EntityType  } from "../../api/admin.api"; 
import ReportDropdown from "./sections/ReportDrpdown";
import ReportsList from "./sections/ReportList";
import styles from "./Report.module.css";
import { useAuth } from "@contexts";

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [entity, setEntity] = useState<EntityType>("song");
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
    setReports(data);
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
                reportType={entity}
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