import { Outlet } from "react-router-dom";
import { AudioQueueProvider } from "@contexts";
import { DevBanner } from "@components";

const AppLayout: React.FC = () => {
  return (
    <AudioQueueProvider>
      <DevBanner />
      <Outlet />
    </AudioQueueProvider>
  );
};

export default AppLayout;
