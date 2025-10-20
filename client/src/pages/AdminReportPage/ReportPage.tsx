import React, {useState}from "react";
import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";
import ReportDropdown from './sections/ReportDrpdown'
import type { ReportType } from './sections/ReportDrpdown';
import ReportsList from './sections/ReportList';
import styles from "./Report.module.css";

const ReportPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>("user");

  return (
    <>
      <Sidebar />
      <Topbar />
      <main className={styles.contentArea}>
        <div className={styles.contentWrapper}>
          {/* Dropdown Section */}
          <div className={styles.reportDropdownContainer}>
            <ReportDropdown
              selectedReport={selectedReport}
              onSelect={setSelectedReport}
            />
          </div>

          {/* Reports List Section */}
          <div className={styles.reportListSection}>
            <ReportsList reportType={selectedReport} />
          </div>
        </div>
      </main>
      <PlayerBar />
    </>
  );
};

export default ReportPage;