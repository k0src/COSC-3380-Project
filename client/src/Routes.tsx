import { Routes, Route } from "react-router-dom";
import * as Pages from "./pages";
import HomePage from "./pages/HomePage/HomePage"
import AdminReportPage from "./pages/AdminReportPage/ReportPage"

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={< HomePage />} />
      <Route path="/Admin" element={< AdminReportPage />} />
      <Route path="/test" element={<Pages.TestPage />} />
    </Routes>
  );
}
