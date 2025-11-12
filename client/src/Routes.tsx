import { Routes, Route } from "react-router-dom";
import * as Pages from "./pages";
import { AppLayout, MainLayout, PageLoader } from "@components";
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
          </Route>

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
      )}
    </>
  );
}
