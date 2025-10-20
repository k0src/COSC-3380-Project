import React from 'react';
import styles from './ReportSection.module.css';
import type { ReportType } from './ReportDrpdown';

interface ReportsListProps {
  reportType: ReportType;
}

const mockData = {
  user: [
    { reportedUser: 'user123', reporterUser: 'user456' },
    { reportedUser: 'user789', reporterUser: 'user321' },
  ],
  song: [
    { reportedUser: 'song123', reporterUser: 'user654' },
    { reportedUser: 'song456', reporterUser: 'user987' },
  ],
  album: ['Album Report 1', 'Album Report 2', 'Album Report 3', 'Album Report 4'],
  playlist: ['Playlist Report 1'],
};

const ReportsList: React.FC<ReportsListProps> = ({ reportType }) => {
  const reports = mockData[reportType];

  const handleSuspend = (report: string) => {
    console.log(`Suspend clicked for ${report}`);
  };

  const handlePass = (report: string) => {
    console.log(`Pass clicked for ${report}`);
  };

  const handleHide = (report: string) => {
    console.log(`Hide clicked for ${report}`);
  };

  return (
    <div className={styles.reportListSection}>
      <h3 className={styles.reportListTitle}>
        {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Reports
      </h3>
      <ul className={styles.reportList}>
        {reportType === 'user' || reportType === 'song'
          ? (reports as { reportedUser: string; reporterUser: string }[]).map((item, idx) => (
              <li key={idx} className={styles.reportListItem}>
                <div className={styles.reportRow}>
                  <span className={styles.reportName}>
                    Reported Account: <button >{item.reportedUser} </button>  Reported By: {item.reporterUser}
                  </span>
                  <div className={styles.reportActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleSuspend(item.reportedUser)}
                    >
                      Suspend
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handlePass(item.reportedUser)}
                    >
                      Pass
                    </button>
                  </div>
                </div>
              </li>
            ))
          : (reports as string[]).map((item, idx) => (
              <li key={idx} className={styles.reportListItem}>
                <div className={styles.reportRow}>
                  <span className={styles.reportName}>{item}</span>
                  <div className={styles.reportActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleHide(item)}
                    >
                      Hide
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handlePass(item)}
                    >
                      Pass
                    </button>
                  </div>
                </div>
              </li>
            ))}
      </ul>
    </div>
  );
};

export default ReportsList;