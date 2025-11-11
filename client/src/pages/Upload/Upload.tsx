import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import styles from "./Upload.module.css";

import Sidebar from "../../components/SideBar/sidebar";
import Topbar from "../../components/TopBar/topBar";
import PlayerBar from "../../components/PlayerBar/playerBar";
import { TbFileUpload } from "react-icons/tb";

const Upload: React.FC = () => {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // fileObj removed (was unused) — we keep fileName and fileSize for display
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    // validation
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    const allowed = ["audio/mpeg", "audio/wav", "audio/flac", "audio/ogg", "audio/x-wav", "audio/mp3"];
    if (file.size > maxBytes) {
      setError("File is larger than 10 MB");
      return;
    }
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|ogg)$/i)) {
      setError("Unsupported file type. Use .mp3, .wav, .flac or .ogg");
      return;
    }
    setError(null);
  // file object kept only as URL preview; no separate state needed
    setFileName(file.name);
    setFileSize(file.size);
    setFileObj(file);
    setProgress(0);

    // auto-fill title if empty
    setTitle((prev) => prev || file.name.replace(/\.[^/.]+$/, ""));
    // create audio preview URL and draw waveform
    try {
      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);
      // draw waveform async (non-blocking)
      void drawWaveform(file);
    } catch (e) {
      console.warn("preview error", e);
    }
  }

  const onDrop: React.DragEventHandler = (e) => {
    e.preventDefault();
    setDragOver(false);
    onFiles(e.dataTransfer.files);
  };

  const onChooseFile = () => inputRef.current?.click();

  async function drawWaveform(file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const channelData = audioBuffer.getChannelData(0);
      const canvas = canvasRef.current;
      if (!canvas) {
        ctx.close();
        return;
      }
      const width = 300;
      const height = 40;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const c = canvas.getContext('2d');
      if (!c) {
        ctx.close();
        return;
      }
      c.scale(dpr, dpr);
      c.clearRect(0, 0, width, height);
      c.fillStyle = 'rgba(255,255,255,0.04)';
      c.fillRect(0, 0, width, height);
      c.fillStyle = '#ff6b6b';
      const step = Math.ceil(channelData.length / width);
      for (let i = 0; i < width; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += Math.abs(channelData[(i * step) + j] || 0);
        }
        const avg = sum / step;
        const h = Math.max(1, avg * height * 1.6);
        c.fillRect(i, (height - h) / 2, 1, h);
      }
      ctx.close();
    } catch (err) {
      console.warn('waveform error', err);
    }
  }

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
                  <div style={{ flex: 1 }}>
                    <div className={styles.fileName}>{fileName}</div>
                    {fileSize && <div className={styles.metaSmall}>{(fileSize / 1024 / 1024).toFixed(2)} MB</div>}
                  </div>
                  <div className={styles.metaSmall}>{progress}%</div>
                </div>
                <div className={styles.progressOuter}>
                  <div
                    className={styles.progressInner}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* audio preview (waveform + player) */}
                {audioPreviewUrl && (
                  <div className={styles.audioPreview}>
                    <canvas ref={canvasRef} aria-hidden />
                    <audio controls src={audioPreviewUrl} className={styles.audioPlayer} />
                  </div>
                )}

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
                    onClick={async () => {
                      if (!fileObj) return;
                      setError(null);
                      setProgress(0);

                      // real upload via XHR to track progress
                      try {
                        await new Promise<void>((resolve, reject) => {
                          const form = new FormData();
                          form.append("file", fileObj, fileObj.name);
                          form.append("title", title || fileObj.name);

                          const xhr = new XMLHttpRequest();
                          xhr.open("POST", "/api/songs");
                          xhr.withCredentials = true;
                          xhr.upload.onprogress = (e) => {
                            if (e.lengthComputable) {
                              const percent = Math.round((e.loaded / e.total) * 100);
                              setProgress(percent);
                            }
                          };
                          xhr.onload = () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                              resolve();
                            } else {
                              reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
                            }
                          };
                          xhr.onerror = () => reject(new Error("Network error"));
                          xhr.send(form);
                        });

                        setProgress(100);
                        setToastMessage("Upload successful");
                        setShowToast(true);

                        // clear form after short delay
                        setTimeout(() => {
                          if (inputRef.current) inputRef.current.value = "";
                          setFileName(null);
                          setFileSize(null);
                          setFileObj(null);
                          setProgress(0);
                          setTitle("");
                          setError(null);
                          if (audioPreviewUrl) {
                            URL.revokeObjectURL(audioPreviewUrl);
                          }
                          setAudioPreviewUrl(null);
                          // clear canvas
                          const c = canvasRef.current;
                          if (c) {
                            const ctx = c.getContext("2d");
                            if (ctx) ctx.clearRect(0, 0, c.width, c.height);
                          }
                        }, 700);

                        // hide toast after a bit
                        setTimeout(() => setShowToast(false), 3000);
                      } catch (err: any) {
                        console.error(err);
                        setError(err?.message || "Upload failed");
                        setShowToast(false);
                      }
                    }}
                    disabled={!fileName || !title || !!error}
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
                      setFileSize(null);
                      setProgress(0);
                      setTitle("");
                      setError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.metaSmall}>No file selected</div>
            )}

            {/* status / progress live region */}
            <div className={styles.srStatus} aria-live="polite">
              {error ? <span className={styles.errorText}>{error}</span> : null}
              {!error && fileName ? <span>{progress}% uploaded</span> : null}
            </div>
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

      {showToast && (
        <div className={styles.toast} role="status" aria-live="polite">{toastMessage}</div>
      )}

      <PlayerBar />
    </>
  );
};

export default Upload;
