import { Routes, Route } from "react-router-dom";
import * as Pages from "./pages";
import HomePage from "./pages/HomePage/HomePage"
import ArtistPage from "./pages/ArtistPage/ArtistPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={< HomePage />} />
      <Route path="/test" element={<Pages.TestPage />} />
      <Route path="/artist" element={< ArtistPage />} />
    </Routes>
  );
}
