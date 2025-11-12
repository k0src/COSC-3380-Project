import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./Routes";
import { AuthProvider, AudioQueueProvider } from "./contexts";
import { ErrorBoundary } from "@components";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AudioQueueProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AudioQueueProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
