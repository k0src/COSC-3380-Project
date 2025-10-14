import { Routes, Route } from "react-router-dom";
import * as Pages from "./pages";
import HomePage from "./pages/HomePage/HomePage"

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={< HomePage />} />
      <Route path="/test" element={<Pages.TestPage />} />
    </Routes>
  );
}
