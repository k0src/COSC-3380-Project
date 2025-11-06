import React from "react";
import { useParams } from "react-router-dom";
import Topbar from "../../components/TopBar/topBar";
import Sidebar from "../../components/SideBar/sidebar";
import PlayerBar from "../../components/PlayerBar/playerBar";
import homeStyles from "../HomePage/HomePage.module.css";

const ArtistPage: React.FC = () => {
  const { id } = useParams();

  return (
    <>
      <Topbar />
      <Sidebar />
      <main className={homeStyles.contentArea}>
        <div className={homeStyles.contentWrapper}>
          <section className={homeStyles.section}>
            <div className={homeStyles.sectionHeader}>
              <h2 className={homeStyles.sectionTitle}>Artist</h2>
            </div>
            <p style={{ color: "#b3b3b3" }}>Artist ID: {id}</p>
          </section>
        </div>
      </main>
      <PlayerBar />
    </>
  );
};

export default ArtistPage;
