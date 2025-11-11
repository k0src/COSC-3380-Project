import React from "react";
import { useNavigate } from "react-router-dom";
import { type UUID } from "../../types/index";
import styles from "./AppealButton.module.css";

interface AppealButtonProps {
  entityId: UUID;
  entityType: "SONG" | "ALBUM" | "PLAYLIST" | "ARTIST" | "USER";
  context?: "content" | "account";
  isHidden?: boolean;
  isRemoved?: boolean;
  isSuspended?: boolean;
  className?: string;
}

const AppealButton: React.FC<AppealButtonProps> = ({ 
  entityId, 
  entityType, 
  context = "content",
  isHidden = false,
  isRemoved = false,
  isSuspended = false,
  className 
}) => {
  const navigate = useNavigate();

  // Only show appeal button if content is actually affected
  const shouldShowButton = isHidden || isRemoved || isSuspended;

  if (!shouldShowButton) {
    return null;
  }

  const handleAppealClick = () => {
    const params = new URLSearchParams({
      entityId,
      entityType,
      context
    });
    
    navigate(`/appeals?${params.toString()}`);
  };

  const getButtonText = () => {
    if (context === "account") {
      return "Appeal Suspension";
    }
    if (isRemoved) {
      return "Appeal Removal";
    }
    if (isHidden) {
      return "Appeal Action";
    }
    return "Submit Appeal";
  };

  const getStatusText = () => {
    if (context === "account" && isSuspended) {
      return "Your account has been suspended";
    }
    if (isRemoved) {
      return `This ${entityType.toLowerCase()} has been removed`;
    }
    if (isHidden) {
      return `This ${entityType.toLowerCase()} has been hidden from public`;
    }
    return "";
  };

  return (
    <div className={`${styles.appealContainer} ${className}`}>
      {getStatusText() && (
        <p className={styles.statusText}>{getStatusText()}</p>
      )}
      <button 
        className={styles.appealButton}
        onClick={handleAppealClick}
      >
        📝 {getButtonText()}
      </button>
      <p className={styles.helpText}>
        Think this was a mistake? You can appeal this decision.
      </p>
    </div>
  );
};

export default AppealButton;