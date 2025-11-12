import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import styles from "./Upload.module.css";
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
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [genre, setGenre] = useState<string>("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    // validation
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    const allowed = [
      "audio/mpeg",
      "audio/wav",
      "audio/flac",
      "audio/ogg",
      "audio/x-wav",
      "audio/mp3",
    ];
    if (file.size > maxBytes) {
      setError("File is larger than 10 MB");
      return;
    }
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|ogg)$/i)) {
      setError("Unsupported file type. Use .mp3, .wav, .flac or .ogg");
      return;
    }

    setError(null);
    setFileName(file.name);
    setFileSize(file.size);
    setFileObj(file);
    setProgress(0);
    
    // Auto-fill title with filename (without extension)
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTitle(nameWithoutExt);
    }

    // reset related fields
    setDuration(null);
    setGenre("");
    setCoverFile(null);
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
      setCoverPreviewUrl(null);
    }

    // create audio preview URL and draw waveform
    try {
      const url = URL.createObjectURL(file);
      setAudioPreviewUrl(url);
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

  function onCoverFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const f = files[0];
    if (!f.type.startsWith("image/")) {
      setError("Cover must be an image file");
      return;
    }
    setError(null);
    setCoverFile(f);
    try {
      const url = URL.createObjectURL(f);
      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
      setCoverPreviewUrl(url);
    } catch (e) {
      console.warn("cover preview error", e);
    }
  }

  async function drawWaveform(file: File) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      // set duration in seconds (DB expects seconds)
      try {
        setDuration(audioBuffer.duration ?? null);
      } catch (err) {
        // ignore
      }
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
      const c = canvas.getContext("2d");
      if (!c) {
        ctx.close();
        return;
      }
      c.scale(dpr, dpr);
      c.clearRect(0, 0, width, height);
      c.fillStyle = "rgba(255,255,255,0.04)";
      c.fillRect(0, 0, width, height);
      c.fillStyle = "#ff6b6b";
      const step = Math.ceil(channelData.length / width);
      for (let i = 0; i < width; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += Math.abs(channelData[i * step + j] || 0);
        }
        const avg = sum / step;
        const h = Math.max(1, avg * height * 1.6);
        c.fillRect(i, (height - h) / 2, 1, h);
      }
      ctx.close();
    } catch (err) {
      console.warn("waveform error", err);
    }
  }

  const formatDuration = (s: number | null) => {
    if (s == null || Number.isNaN(s)) return "";
    const secs = Math.round(s);
    const mm = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const ss = (secs % 60).toString().padStart(2, "0");
    return `${mm}:${ss} (${secs}s)`;
  };

  async function doUpload() {
    if (!fileObj || isUploading) return;

    // clear previous upload error (validation errors remain in `error`)
    setUploadError(null);
    setError(null);
    setProgress(0);
    setIsUploading(true);

    try {
      await new Promise<void>((resolve, reject) => {
        const form = new FormData();
        form.append("file", fileObj, fileObj.name);
        form.append("title", title || fileObj.name);
        if (genre) form.append("genre", genre);
        if (duration != null) form.append("duration", Math.round(duration).toString());
        if (coverFile) form.append("cover", coverFile, coverFile.name);

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
      setShowSuccessModal(true);

    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Upload failed";
      // set upload-specific error so validation errors are separate
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Upload</title>
      </Helmet>

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
                    {fileSize && (
                      <div className={styles.metaSmall}>
                        {(fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                  <div className={styles.metaSmall}>{progress}%</div>
                </div>

                <div className={styles.progressOuter}>
                  <div className={styles.progressInner} style={{ width: `${progress}%` }} />
                </div>

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

                <div style={{ marginTop: 6 }}>
                  {duration ? (
                    <span className={styles.metaSmall}>Duration: {formatDuration(duration)}</span>
                  ) : (
                    <span className={styles.metaSmall}>Duration: —</span>
                  )}
                </div>

                <div style={{ marginTop: 8 }}>
                  <select
                    className={styles.titleInput}
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    aria-label="Genre"
                  >
                    <option value="">(Select genre)</option>
                    <option>Pop</option>
                    <option>Rock</option>
                    <option>Hip-Hop</option>
                    <option>Electronic</option>
                    <option>Classical</option>
                    <option>Jazz</option>
                    <option>Country</option>
                    <option>Other</option>
                  </select>
                </div>

                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => onCoverFiles(e.target.files)}
                  />
                  <button type="button" className={styles.btnSecondary} onClick={() => coverInputRef.current?.click()}>
                    Upload cover
                  </button>
                  {coverPreviewUrl && (
                    <img
                      src={coverPreviewUrl}
                      alt="cover preview"
                      style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }}
                    />
                  )}
                </div>

                <div className={styles.btnRow}>
                  <button
                    className={`${styles.btnPrimary} ${fileName ? styles.btnDanger : ""}`}
                    type="button"
                    onClick={async () => await doUpload()}
                    disabled={!fileName || !title || !!error || isUploading}
                  >
                    {isUploading ? "Uploading..." : "Save"}
                  </button>

                  {uploadError && (
                    <button 
                      type="button" 
                      className={styles.btnPrimary} 
                      onClick={async () => await doUpload()}
                      disabled={isUploading}
                    >
                      {isUploading ? "Retrying..." : "Retry"}
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => {
                      // Clear form and reset all states
                      if (inputRef.current) inputRef.current.value = "";
                      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
                      if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
                      
                      setFileName(null);
                      setFileSize(null);
                      setFileObj(null);
                      setProgress(0);
                      setTitle("");
                      setError(null);
                      setUploadError(null);
                      setAudioPreviewUrl(null);
                      setCoverPreviewUrl(null);
                      setCoverFile(null);
                      setDuration(null);
                      setGenre("");
                      setIsUploading(false);
                      
                      // Clear canvas
                      const canvas = canvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext("2d");
                        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                      }
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.metaSmall}>No file selected</div>
            )}

            <div className={styles.srStatus} aria-live="polite">
              {error ? <span className={styles.errorText}>{error}</span> : null}
              {!error && fileName ? <span>{progress}% uploaded</span> : null}
              {uploadError ? <div className={styles.errorText}>{uploadError}</div> : null}
            </div>
          </div>


        </div>
      </main>

      {showSuccessModal && (
        <div className={styles.successOverlay} onClick={() => setShowSuccessModal(false)}>
          <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className={styles.successTitle}>Upload Successful!</h2>
            <p className={styles.successMessage}>
              Your song has been uploaded and is now available to stream.
            </p>
            <button 
              className={styles.successButton}
              onClick={() => {
                setShowSuccessModal(false);
                // Clear form after success
                if (inputRef.current) inputRef.current.value = "";
                if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
                if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
                
                setFileName(null);
                setFileSize(null);
                setFileObj(null);
                setProgress(0);
                setTitle("");
                setError(null);
                setUploadError(null);
                setAudioPreviewUrl(null);
                setCoverPreviewUrl(null);
                setCoverFile(null);
                setDuration(null);
                setGenre("");
                
                // Clear canvas
                const canvas = canvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext("2d");
                  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Upload;
