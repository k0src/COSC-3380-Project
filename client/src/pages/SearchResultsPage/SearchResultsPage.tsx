import homeStyles from "../HomePage/HomePage.module.css";
import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";

export default function SearchResultsPage() {
  return (
    <>
      <Topbar />
      <Sidebar />

      <main className={homeStyles.contentArea}>
        <div className={homeStyles.contentWrapper}>
          {/* Intentionally left blank for now. Search bar in TopBar remains active. */}
        </div>
      </main>

      <PlayerBar />
    </>
  );
}
