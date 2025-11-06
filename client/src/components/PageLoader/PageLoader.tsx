import styles from "./PageLoader.module.css";
import { PuffLoader } from "react-spinners";
import React from "react";

const PageLoader: React.FC = () => {
  return (
    <div className={styles.loaderContainer}>
      <PuffLoader color="#D53131" size={100} />
    </div>
  );
};

export default PageLoader;
