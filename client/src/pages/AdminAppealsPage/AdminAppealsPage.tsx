import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AdminAppealsAPI,
  type AdminAppeal,
  type AppealEntityType,
} from "@api/admin-appeals.api";
import AppealsDropdown from "./sections/AppealsDropdown";
import AppealsList from "./sections/AppealsList";
import styles from "./Appeals.module.css";

const AdminAppealsPage: React.FC = () => {
  const navigate = useNavigate();
  const [appealType, setAppealType] = useState<AppealEntityType>("user");
  const [appeals, setAppeals] = useState<AdminAppeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppeals();
  }, [appealType]);

  async function fetchAppeals() {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminAppealsAPI.getAppeals(appealType);
      setAppeals(data);
    } catch (err) {
      console.error(err);
      setError("An error occurred while fetching appeals");
    } finally {
      setLoading(false);
    }
  }

  // Handle admin decision
  async function handleAction(
    appeal: AdminAppeal,
    action: "approve" | "reject"
  ) {
    try {
      setLoading(true);

      const adminId = "cbe73006-0fe9-4067-8c1d-d85ad004049e"; // Replace with actual admin ID

      const appealDecisionData = {
        appealId: appeal.appeal_id, // for user appeals
        userId: appeal.user_id,
        entityId: appeal.entity_id, // for content appeals
        submittedAt: appeal.submitted_at,
        action,
        reviewerId: adminId,
      };

      const response = await AdminAppealsAPI.decideAppeal(
        appealType,
        appealDecisionData
      );

      if (response.success) {
        // Remove the processed appeal from the local state
        setAppeals((prevAppeals) =>
          prevAppeals.filter(
            (a) =>
              !(
                a.user_id === appeal.user_id &&
                a.submitted_at === appeal.submitted_at &&
                (appealType === "user" || a.entity_id === appeal.entity_id)
              )
          )
        );

        // Show success message
        const actionText = action === "approve" ? "approved" : "rejected";
        alert(`Appeal ${actionText} successfully`);
      } else {
        alert(`Failed to ${action} appeal: ${response.message}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing appeal:`, error);
      alert(`An error occurred while ${action}ing the appeal.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className={styles.backButton} onClick={() => navigate("/Admin")}>
        ← Back to Dashboard
      </button>
      <main className={styles.contentArea}>
        <div className={styles.contentWrapper}>
          {/* Dropdown Section */}
          <div className={styles.appealsDropdownContainer}>
            <AppealsDropdown
              selectedAppeal={appealType}
              onSelect={setAppealType}
            />
          </div>

          {/* Appeals List Section */}
          <div className={styles.appealsListSection}>
            <AppealsList
              appealType={appealType}
              appeals={appeals}
              loading={loading}
              error={error}
              onAction={handleAction}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminAppealsPage;
