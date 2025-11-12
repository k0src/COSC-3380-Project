import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider, ContextMenuProvider } from "@contexts";
import AppRoutes from "./Routes";

function App() {
  return (
    <AuthProvider>
      <ContextMenuProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ContextMenuProvider>
    </AuthProvider>
  );
}

export default App;
