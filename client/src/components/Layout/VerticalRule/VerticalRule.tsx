import { memo } from "react";
import styles from "./VerticalRule.module.css";

const VerticalRule: React.FC = () => {
  return <div className={styles.verticalRule}></div>;
};

export default memo(VerticalRule);
