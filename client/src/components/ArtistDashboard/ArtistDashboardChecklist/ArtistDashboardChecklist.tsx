import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import { LuCheck, LuChevronRight } from "react-icons/lu";
import type { IconType } from "react-icons";
import styles from "./ArtistDashboardChecklist.module.css";

export interface ChecklistItem {
  id: string;
  label: string;
  icon: IconType;
  completed: boolean;
  link: string;
}

export interface ArtistDashboardChecklistProps {
  items: ChecklistItem[];
}

interface ChecklistItemProps {
  item: ChecklistItem;
}

const ChecklistItem: React.FC<ChecklistItemProps> = memo(({ item }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.link}
      className={classNames(styles.checklistItem, {
        [styles.checklistItemCompleted]: item.completed,
      })}
    >
      <div className={styles.checklistItemLeft}>
        <div
          className={classNames(styles.checkIcon, {
            [styles.checkIconCompleted]: item.completed,
          })}
        >
          {item.completed ? <LuCheck /> : <Icon />}
        </div>
        <span className={styles.checklistItemLabel}>{item.label}</span>
      </div>
      <LuChevronRight className={styles.chevronIcon} />
    </Link>
  );
});

const ArtistDashboardChecklist: React.FC<ArtistDashboardChecklistProps> = ({
  items,
}) => {
  const completionPercentage = useMemo(() => {
    const completed = items.filter((item) => item.completed).length;
    return Math.round((completed / items.length) * 100);
  }, [items]);

  return (
    <div className={styles.checklistContainer}>
      <div className={styles.checklistHeader}>
        <span className={styles.checklistTitle}>Complete Your Profile</span>
        <span className={styles.checklistDescription}>
          Finish setting up your artist profile to maximize your reach and
          engagement.
        </span>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={styles.progressPercentage}>
            {completionPercentage}%
          </span>
          <span className={styles.progressLabel}>Complete</span>
        </div>
        <div className={styles.progressBarContainer}>
          <div
            className={styles.progressBar}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      <div className={styles.checklistItems}>
        {items.map((item) => (
          <ChecklistItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default memo(ArtistDashboardChecklist);
