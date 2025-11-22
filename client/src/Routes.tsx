import { Routes, Route } from "react-router-dom";
import * as Pages from "./pages";
<<<<<<< HEAD
import {
  AppLayout,
  MainLayout,
  MeWrapper,
  ProtectedRoute,
  ArtistDashboardLayout,
} from "@components";
=======
import { AppLayout, MainLayout, MeWrapper, PageLoader } from "@components";
>>>>>>> master_alt
import { useAuth } from "@contexts";

export default function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <>
      {isLoading ? (
        <PageLoader />
      ) : (
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
              path="/search"
              element={
                <MainLayout>
                  <Pages.SearchResultsPage />
                </MainLayout>
              }
            />
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
            <Route
              path="/artist-dashboard"
              element={
                <ProtectedRoute>
                  <ArtistDashboardLayout>
                    <Pages.ArtistDashboard />
                  </ArtistDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artist-dashboard/overview"
              element={
                <ProtectedRoute>
                  <ArtistDashboardLayout>
                    <Pages.ArtistDashboard />
                  </ArtistDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artist-dashboard/comments"
              element={
                <ProtectedRoute>
                  <ArtistDashboardLayout>
                    <Pages.ArtistDashboardCommentsPage />
                  </ArtistDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artist-dashboard/manage/:tab?"
              element={
                <ProtectedRoute>
                  <ArtistDashboardLayout>
                    <Pages.ArtistDashboardManagePage />
                  </ArtistDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artist-dashboard/add"
              element={
                <ProtectedRoute>
                  <ArtistDashboardLayout>
                    <Pages.ArtistDashboardAddPage />
                  </ArtistDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/artist-dashboard/stats"
              element={
                <ProtectedRoute>
                  <ArtistDashboardLayout>
                    <Pages.ArtistDashboardStatsPage />
                  </ArtistDashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <MainLayout>
                  <Pages.FeedPage />
                </MainLayout>
              }
            />
            <Route path="/Admin" element={
              <MainLayout>
                < Pages.AdminPage />
              </MainLayout>} 
              />

            <Route path="/admin/reports" element={
              <MainLayout>
                < Pages.AdminReportPage />
              </MainLayout>} 
              />

            <Route path="/admin/data-reports" element={
              <MainLayout>
                < Pages.dataReport />
              </MainLayout>} 
              />
          </Route>
        </Routes>
      )}
    </>
  );
}