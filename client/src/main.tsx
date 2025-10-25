import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.tsx";
import { AuthProvider } from "@contexts";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <StrictMode>
      <AuthProvider>
      <App />
      </AuthProvider>
    </StrictMode>
  </HelmetProvider>
);
