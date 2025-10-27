import { Outlet } from "react-router-dom";
import { AudioQueueProvider } from "@contexts";

const AppLayout: React.FC = () => {
  return (
    <AudioQueueProvider>
      <Outlet />
    </AudioQueueProvider>
  );
};

export default AppLayout;