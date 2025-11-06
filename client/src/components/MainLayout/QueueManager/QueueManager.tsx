import { memo, useEffect, useRef, useState, useCallback } from "react";
import { LuX, LuGripHorizontal, LuTrash } from "react-icons/lu";
import { useAudioQueue } from "@contexts";
import { getMainArtist } from "@util";
import classNames from "classnames";
import styles from "./QueueManager.module.css";

interface QueueManagerProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

const QueueManager: React.FC<QueueManagerProps> = ({
  isOpen,
  onClose,
  buttonRef,
}) => {
  const { state, actions } = useAudioQueue();
  const modalRef = useRef<HTMLDivElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const queueItems = state.queue.slice(state.currentIndex + 1);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, buttonRef]);

  const handleRemoveFromQueue = useCallback(
    (queueId: string) => {
      actions.removeFromQueue(queueId);
    },
    [actions]
  );

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();

      if (draggedIndex !== null && draggedIndex !== dropIndex) {
        // add 1 for current song
        const actualFromIndex = state.currentIndex + 1 + draggedIndex;
        const actualToIndex = state.currentIndex + 1 + dropIndex;

        actions.moveQueueItem(actualFromIndex, actualToIndex);
      }

      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [draggedIndex, state.currentIndex, actions]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleClearQueue = useCallback(() => {
    actions.clearQueue(false, true);
  }, [actions]);

  if (!isOpen) return null;

  return (
    <div ref={modalRef} className={styles.queueManager}>
      <div className={styles.header}>
        <h3 className={styles.title}>Queue</h3>
        <div className={styles.headerButtons}>
          <button
            className={styles.clearButton}
            onClick={handleClearQueue}
            aria-label="Clear Queue"
            disabled={queueItems.length === 0}
          >
            <LuTrash />
          </button>
          <button className={styles.closeButton} onClick={onClose}>
            <LuX />
          </button>
        </div>
      </div>

      <div className={styles.queueContent}>
        {queueItems.length === 0 ? (
          <div className={styles.emptyQueue}>
            <span className={styles.emptyText}>No songs in queue</span>
          </div>
        ) : (
          <div className={styles.queueList}>
            {queueItems.map((item, index) => {
              const mainArtist = getMainArtist(item.song.artists ?? []);
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={item.queueId}
                  className={classNames(styles.queueItem, {
                    [styles.queueItemUserQueued]: item.isQueued,
                    [styles.queueItemDragging]: isDragging,
                    [styles.queueItemDragOver]: isDragOver,
                  })}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className={styles.dragHandle}>
                    <LuGripHorizontal />
                  </div>

                  <div className={styles.songInfo}>
                    <span className={styles.artistName}>
                      {mainArtist?.display_name || "Unknown Artist"}
                    </span>
                    <span className={styles.songTitle}>{item.song.title}</span>
                  </div>

                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveFromQueue(item.queueId)}
                    aria-label={`Remove ${item.song.title} from queue`}
                  >
                    <LuX />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(QueueManager);
