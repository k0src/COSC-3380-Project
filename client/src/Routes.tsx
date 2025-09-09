import { Routes, Route } from "react-router-dom";
import * as Pages from "./pages";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Pages.TestPage />} />
    </Routes>
  );
}
