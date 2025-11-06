import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./Routes";
import { AuthProvider } from "./contexts";

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
