import { BrowserRouter as Router } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider, ContextMenuProvider, SettingsProvider } from "@contexts";
import AppRoutes from "./Routes";

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <SettingsProvider>
          <ContextMenuProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ContextMenuProvider>
        </SettingsProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
