import { Routes, Route } from "react-router-dom";
import * as Pages from "./pages";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Pages.TestPage />} />
      <Route path="/songs/:id" element={<Pages.SongPage />} />
      <Route path="/login" element={<Pages.LoginPage />} />
      <Route path="/signup" element={<Pages.SignupPage />} />
    </Routes>
  );
}
