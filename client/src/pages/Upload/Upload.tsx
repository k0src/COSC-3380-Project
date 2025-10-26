import React, { useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import styles from "./Upload.module.css";

import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";
import { TbFileUpload } from "react-icons/tb";

const Upload: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setFileName(file.name);
    setProgress(0);
  }, []);

  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  };

  const onChooseFile = () => inputRef.current?.click();

  return (
    <>
      <Helmet>
        <title>Upload</title>
      </Helmet>

      <Topbar />
      <Sidebar />

      <main className={styles.contentWrapper}>

        <div className={styles.uploadGrid}>
          <div
            className={`${styles.dropzone} ${dragOver ? styles.dropzoneHover : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={onChooseFile}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") onChooseFile();
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={(e) => onFiles(e.target.files)}
            />

            <div className={styles.dropzoneIcon} aria-hidden>
              <TbFileUpload size={56} />
            </div>

            <div className={styles.dropzoneText}>
              <strong>Drag and drop an audio file here to upload</strong>
              <div className={styles.metaSmall}>
                .mp3, .wav, .flac, and .ogg files smaller than 10 MB are accepted.
              </div>
            </div>
          </div>

          <div className={styles.uploadCard}>
            {fileName ? (
              <div>
                <div className={styles.fileRow}>
                  <div style={{ flex: 1 }}>{fileName}</div>
                  <div className={styles.metaSmall}>{progress}%</div>
                </div>
                <div className={styles.progressOuter}>
                  <div
                    className={styles.progressInner}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <input
                  className={styles.titleInput}
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <div className={styles.btnRow}>
                  <button
                    className={`${styles.btnPrimary} ${fileName ? styles.btnDanger : ""}`}
                    type="button"
                    onClick={() => alert("Save not wired — UI only")}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => {
                      if (inputRef.current) {
                        inputRef.current.value = "";
                      }
                      setFileName(null);
                      setProgress(0);
                      setTitle("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.metaSmall}>No file selected</div>
            )}

            {/* hidden file input used by the dropzone */}
            <input
              ref={inputRef}
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>

          {/* title box below upload card */}
          <div className={styles.titleBox}>
            <div className={styles.titleLabel}>Title</div>
            <input
              className={`${styles.titleField} ${styles.titleInput}`}
              placeholder="Enter title for the uploaded file"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!fileName}
            />
          </div>
        </div>
      </main>

      <PlayerBar />
    </>
  );
};

export default Upload;
