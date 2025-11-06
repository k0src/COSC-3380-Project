import { memo } from "react";
import styles from "./HorizontalRule.module.css";

const HorizontalRule: React.FC = () => {
  return <div className={styles.horizontalRule}></div>;
};

export default memo(HorizontalRule);
