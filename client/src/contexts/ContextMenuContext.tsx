import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Song, Playlist, Album, Artist } from "@types";

export type ContextMenuEntity = Song | Playlist | Album | Artist;

export type ContextMenuEntityType = "song" | "playlist" | "album" | "artist";

export interface ContextMenuAction {
  id: string;
  label: string;
  icon: React.ComponentType;
  onClick: () => void | Promise<void>;
  show: boolean;
}

export type CustomActionsProvider = (
  entity: ContextMenuEntity | null,
  entityType: ContextMenuEntityType | null
) => ContextMenuAction[];

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  entity: ContextMenuEntity | null;
  entityType: ContextMenuEntityType | null;
  customActions: ContextMenuAction[];
}

export interface ShareModalState {
  isOpen: boolean;
  url: string;
  title: string;
}

export interface ContextMenuContextType {
  state: ContextMenuState;
  shareModalState: ShareModalState;
  openContextMenu: (
    x: number,
    y: number,
    entity: ContextMenuEntity,
    entityType: ContextMenuEntityType,
    customActions?: ContextMenuAction[]
  ) => void;
  closeContextMenu: () => void;
  setCustomActionsProvider: (provider: CustomActionsProvider | null) => void;
  openShareModal: (url: string, title: string) => void;
  closeShareModal: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    entity: null,
    entityType: null,
    customActions: [],
  });

  const [customActionsProvider, setCustomActionsProvider] =
    useState<CustomActionsProvider | null>(null);

  const [shareModalState, setShareModalState] = useState<ShareModalState>({
    isOpen: false,
    url: "",
    title: "",
  });

  const openContextMenu = useCallback(
    (
      x: number,
      y: number,
      entity: ContextMenuEntity,
      entityType: ContextMenuEntityType,
      customActions?: ContextMenuAction[]
    ) => {
      let finalCustomActions = customActions || [];

      if (!customActions && customActionsProvider) {
        finalCustomActions = customActionsProvider(entity, entityType);
      }

      setState({
        isOpen: true,
        x,
        y,
        entity,
        entityType,
        customActions: finalCustomActions,
      });
    },
    [customActionsProvider]
  );

  const closeContextMenu = useCallback(() => {
    setState({
      isOpen: false,
      x: 0,
      y: 0,
      entity: null,
      entityType: null,
      customActions: [],
    });
  }, []);

  const openShareModal = useCallback((url: string, title: string) => {
    setShareModalState({
      isOpen: true,
      url,
      title,
    });
  }, []);

  const closeShareModal = useCallback(() => {
    setShareModalState({
      isOpen: false,
      url: "",
      title: "",
    });
  }, []);

  const contextValue: ContextMenuContextType = {
    state,
    shareModalState,
    openContextMenu,
    closeContextMenu,
    setCustomActionsProvider: useCallback(
      (provider: CustomActionsProvider | null) => {
        setCustomActionsProvider(() => provider);
      },
      []
    ),
    openShareModal,
    closeShareModal,
  };

  return (
    <ContextMenuContext.Provider value={contextValue}>
      {children}
    </ContextMenuContext.Provider>
  );
}

export function useContextMenu(): ContextMenuContextType {
  const context = useContext(ContextMenuContext);

  if (!context) {
    throw new Error("useContextMenu must be used within a ContextMenuProvider");
  }

  return context;
}
