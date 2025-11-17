import { Routes, Route } from "react-router-dom";
import * as Pages from "./pages";
import { AppLayout, MainLayout, MeWrapper } from "@components";
import { useAuth } from "@contexts";

export default function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <>
      {!isLoading && (
        <Routes>
          <Route path="/login" element={<Pages.LoginPage />} />
          <Route path="/signup" element={<Pages.SignupPage />} />

          <Route element={<AppLayout />}>
            {!isAuthenticated ? (
              <Route path="/" element={<Pages.LandingPage />} />
            ) : (
              <Route
                path="/"
                element={
                  <MainLayout>
                    <Pages.HomePage />
                  </MainLayout>
                }
              />
            )}
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
            <Route
              path="/artists/:id/discography"
              element={
                <MainLayout>
                  <Pages.ArtistDiscography />
                </MainLayout>
              }
            />
            <Route
              path="/playlists/:id"
              element={
                <MainLayout>
                  <Pages.PlaylistPage />
                </MainLayout>
              }
            />
            <Route
              path="/albums/:id"
              element={
                <MainLayout>
                  <Pages.AlbumPage />
                </MainLayout>
              }
            />
            <Route path="/me" element={<MeWrapper />} />
            <Route
              path="/users/:id"
              element={
                <MainLayout>
                  <Pages.UserPage />
                </MainLayout>
              }
            />
            <Route
              path="/me/settings"
              element={
                <MainLayout>
                  <Pages.SettingsPage />
                </MainLayout>
              }
            />
            <Route
              path="/users/:id/info/:tab?"
              element={
                <MainLayout>
                  <Pages.UserInfoPage />
                </MainLayout>
              }
            />
            <Route
              path="/library/:tab?"
              element={
                <MainLayout>
                  <Pages.LibraryPage />
                </MainLayout>
              }
            />
            <Route
              path="/history/:tab?"
              element={
                <MainLayout>
                  <Pages.HistoryPage />
                </MainLayout>
              }
            />
            <Route path="/upload" element={<Pages.UploadPage />} />
          </Route>
        </Routes>
      )}
    </>
  );
}
