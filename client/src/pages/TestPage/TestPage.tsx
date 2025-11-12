import { Helmet } from "react-helmet-async";
import styles from "./TestPage.module.css";
import AudioQueueTest from "@components/AudioQueueTest/AudioQueueTest.js";
import { MainLayout } from "@components";

const TestPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Test Page</title>
      </Helmet>

      <MainLayout>
        <main className={styles.main}>
          <header className={styles.header}>
            <h1 className={styles.headingPrimary}>Test Page</h1>
          </header>
          <AudioQueueTest />
        </main>
      </MainLayout>
    </>
  );
};

export default TestPage;
