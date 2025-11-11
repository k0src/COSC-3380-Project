import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./Routes";
import { AuthProvider } from "./contexts";
import { ErrorBoundary } from "@components";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
