import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider, ContextMenuProvider, SettingsProvider } from "@contexts";
import AppRoutes from "./Routes";

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ContextMenuProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ContextMenuProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
