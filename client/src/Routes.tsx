import { Routes, Route } from "react-router-dom";
import * as Pages from "./pages";
// import HomePage from "./pages/HomePage/HomePage"
// import ArtistPage from "./pages/ArtistPage/ArtistPage";
// import LandingPage from "./pages/LandingPage/LandingPage";

import { MainLayout } from "@components";

export default function AppRoutes() {
  return (
    <Routes>
      {/* <Route path="/artist" element={< Pages.ArtistPage />} /> */}
      <Route path='/' element={<Pages.LandingPage />} />
      <Route path="/loggedin" element={< Pages.HomePage />} />
      <Route path="/login" element={<Pages.LoginPage />} />
      <Route path="/test" element={<Pages.TestPage />} />
      <Route path="/signup" element={<Pages.SignupPage />} />
      <Route path="/test" element={<Pages.TestPage />} />
      <Route
        path="/songs/:id"
        element={
          <MainLayout>
            <Pages.SongPage />
          </MainLayout>
        }
      />
      <Route
      path="/artists/:id"
      element={
        <MainLayout>
          <Pages.ArtistPage />
        </MainLayout>
      }
      />
    </Routes>
  );
}
