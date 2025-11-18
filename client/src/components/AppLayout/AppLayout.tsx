import { Outlet } from "react-router-dom";
import {
  AudioQueueProvider,
  ContextMenuProvider,
  useContextMenu,
} from "@contexts";
import { ContextMenu, ShareModal } from "@components";

const AppLayoutContent: React.FC = () => {
  const { shareModalState, closeShareModal } = useContextMenu();

  return (
    <>
      <Outlet />
      <ContextMenu />
      <ShareModal
        isOpen={shareModalState.isOpen}
        onClose={closeShareModal}
        pageUrl={shareModalState.url}
        pageTitle={shareModalState.title}
      />
    </>
  );
};

const AppLayout: React.FC = () => {
  return (
    <AudioQueueProvider>
      <ContextMenuProvider>
        <AppLayoutContent />
      </ContextMenuProvider>
    </AudioQueueProvider>
  );
};

export default AppLayout;
