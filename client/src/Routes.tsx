import { Routes, Route } from "react-router-dom";
import * as Pages from "./pages";
import { MainLayout } from "@components";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/Home" element={
        <MainLayout>
          < Pages.HomePage />
        </MainLayout>
      } />
      <Route path="/Admin" element={
        <MainLayout>
          < Pages.AdminPage />
        </MainLayout>} />
      <Route path="/admin/reports" element={
        <MainLayout>
          < Pages.AdminReportPage />
        </MainLayout>} />
      <Route path="/admin/data-reports" element={
        <MainLayout>
          < Pages.dataReport />
        </MainLayout>} />
      {/* <Route path="/admin/appeals" element={
        <MainLayout>
          < Pages.AdminAppealsPage />
        </MainLayout>} />
      */}
      <Route path="/login" element={<Pages.LoginPage />} />
      <Route path="/signup" element={<Pages.SignupPage />} />
      <Route path="/" element={<Pages.TestPage />} />
      <Route path="/report" element={ <Pages.ReportPage />}/>
      <Route path="/appeals" element={ <Pages.AppealsPage />}/>
      <Route
        path="/songs/:id"
        element={
          <MainLayout>
            <Pages.SongPage />
          </MainLayout>
        }
      />
      {/* <Route 
        path="/library" 
        element={
          <MainLayout>
            <ProtectedRoute>
              <Pages.LibraryPage />
            </ProtectedRoute>
          </MainLayout>
        } 
      /> */}
      {/* <Route 
        path="/library/playlists" 
        element={
          <MainLayout>
            <ProtectedRoute></ProtectedRoute>
              <Pages.PlaylistsPage />
            </ProtectedRoute>
          </MainLayout>
        } 
      /> */}
      {/* <Route 
        path="/library/songs" 
        element={
          <MainLayout>
            <ProtectedRoute>
              <Pages.LibrarySongsPage />
            </ProtectedRoute>
          </MainLayout>
        } 
      /> */}
      {/* <Route 
        path="/library/history" 
        element={
          <MainLayout>
            <ProtectedRoute>
              <Pages.HistoryPage />
            </ProtectedRoute>
          </MainLayout>
        } 
      /> */}
      {/* <Route 
        path="/artist-dashboard" 
        element={
          <MainLayout>
            <ProtectedRoute>
              <Pages.ArtistDashboardPage />
            </ProtectedRoute>
          </MainLayout>
        } 
      /> */}
      {/* <Route 
        path="/me" 
        element={
          <MainLayout>
            <ProtectedRoute>
              <Pages.ProfilePage />
            </ProtectedRoute>
          </MainLayout>
        } 
      /> */}
      {/* <Route 
        path="/settings" 
        element={
          <MainLayout>
            <ProtectedRoute>
              <Pages.SettingsPage />
            </ProtectedRoute>
          </MainLayout>
        } 
      /> */}
    </Routes>
  );
}
