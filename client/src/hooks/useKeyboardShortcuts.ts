import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAudioQueue } from "@contexts";

interface KeyboardShortcutsProps {
  onToggleLike?: () => void;
  onToggleQueue?: () => void;
  onShowShortcuts?: () => void;
  isAuthenticated?: boolean;
}

export const useKeyboardShortcuts = ({
  onToggleLike,
  onToggleQueue,
  onShowShortcuts,
  isAuthenticated = false,
}: KeyboardShortcutsProps) => {
  const { state, actions } = useAudioQueue();
  const navigate = useNavigate();

  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    hasNextSong,
    hasPreviousSong,
  } = state;

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)
      ) {
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      const key = e.code;
      const isShift = e.shiftKey;

      switch (key) {
        case "Space":
          e.preventDefault();
          if (currentSong) {
            if (isPlaying) {
              actions.pause();
            } else {
              actions.resume();
            }
          }
          break;

        case "ArrowLeft":
          e.preventDefault();
          if (isShift && hasPreviousSong) {
            actions.previous();
          } else if (currentSong && duration > 0) {
            const newTime = Math.max(0, progress - 5);
            actions.seek(newTime);
          }
          break;

        case "ArrowRight":
          e.preventDefault();
          if (isShift && hasNextSong) {
            actions.next();
          } else if (currentSong && duration > 0) {
            const newTime = Math.min(duration, progress + 5);
            actions.seek(newTime);
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (isShift) {
            const newVolume = Math.min(1, volume + 0.1);
            actions.setVolume(newVolume);
          }
          break;

        case "ArrowDown":
          e.preventDefault();
          if (isShift) {
            const newVolume = Math.max(0, volume - 0.1);
            actions.setVolume(newVolume);
          }
          break;

        case "KeyM":
          e.preventDefault();
          actions.setVolume(0);
          break;

        case "KeyR":
          if (isShift) {
            e.preventDefault();
            actions.toggleRepeatMode();
          }
          break;

        case "KeyS":
          if (isShift) {
            e.preventDefault();
            actions.toggleShuffleQueue();
          }
          break;

        case "KeyL":
          if (isAuthenticated && currentSong && onToggleLike) {
            e.preventDefault();
            onToggleLike();
          }
          break;

        case "KeyP":
          if (isShift && currentSong) {
            e.preventDefault();
            navigate(`/songs/${currentSong.id}`);
          }
          break;

        case "KeyQ":
          if (isShift && onToggleQueue) {
            e.preventDefault();
            onToggleQueue();
          }
          break;

        case "KeyH":
          if (isShift && onShowShortcuts) {
            e.preventDefault();
            onShowShortcuts();
          }
          break;

        default:
          break;
      }
    },
    [
      currentSong,
      isPlaying,
      progress,
      duration,
      volume,
      hasNextSong,
      hasPreviousSong,
      actions,
      navigate,
      onToggleLike,
      onToggleQueue,
      onShowShortcuts,
      isAuthenticated,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyPress, {
        capture: true,
      });
  }, [handleKeyPress]);
};

export const keyboardShortcuts = [
  { key: "Space", description: "Play/Pause" },
  { key: "←/→", description: "Seek backward/forward 5 seconds" },
  { key: "Shift + ←/→", description: "Previous/Next song" },
  { key: "Shift + ↑/↓", description: "Increase/Decrease volume" },
  { key: "M", description: "Mute" },
  { key: "L", description: "Like current song" },
  { key: "Shift + R", description: "Cycle repeat mode" },
  { key: "Shift + S", description: "Toggle shuffle" },
  { key: "Shift + P", description: "Go to playing track" },
  { key: "Shift + Q", description: "Show/Hide queue" },
  { key: "Shift + H", description: "Show keyboard shortcuts" },
];
