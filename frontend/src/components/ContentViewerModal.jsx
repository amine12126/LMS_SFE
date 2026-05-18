import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "../api/axios.js";
import "./ContentViewerModal.css";

function resolveFileUrl(path) {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const rel = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${API_BASE_URL}${rel}`;
}

export default function ContentViewerModal({ content, onClose, onComplete }) {
  const open = Boolean(content);
  const videoRef = useRef(null);
  const maxTimeRef = useRef(0);
  const isRestoringRef = useRef(true);

  const fileSrc = content?.file ? resolveFileUrl(content.file) : null;
  const linkSrc = content?.url ? content.url.trim() : null;

  const kind = useMemo(() => {
    if (!content) return null;
    if (content.type === "link" && linkSrc) return "link";
    if (!fileSrc) return null;
    if (content.type === "image") return "image";
    if (content.type === "video") return "video";
    if (content.type === "pdf") return "pdf";
    return "file";
  }, [content, fileSrc, linkSrc]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const LOCAL_STORAGE_KEY = `video_progress_${content?.id}`;

  const handleVideoLoaded = (e) => {
    const video = e.target;
    video.volume = 0.75;
    video.muted = false;
    
    const savedTime = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedTime) {
      const time = parseFloat(savedTime);
      if (!isNaN(time) && time > 0) {
        let resumeTime = time;
        if (!isNaN(video.duration) && video.duration > 0 && time >= video.duration - 1) {
          resumeTime = 0; // Restart if they finished it
        }
        maxTimeRef.current = resumeTime;
        video.currentTime = resumeTime;
      } else {
        maxTimeRef.current = 0;
      }
    } else {
      maxTimeRef.current = 0;
    }

    setTimeout(() => {
      isRestoringRef.current = false;
    }, 500);
  };

  const handleVolumeChange = (e) => {
    const video = e.target;
    if (video.volume !== 0.75) {
      video.volume = 0.75;
    }
    if (video.muted) {
      video.muted = false;
    }
  };

  const handleTimeUpdate = (e) => {
    if (isRestoringRef.current) return;
    const video = e.target;
    if (!video.seeking) {
      if (video.currentTime > maxTimeRef.current) {
        maxTimeRef.current = video.currentTime;
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, video.currentTime);
    }
  };

  const handleSeeking = (e) => {
    if (isRestoringRef.current) return;
    const video = e.target;
    if (video.currentTime > maxTimeRef.current + 0.5) {
      video.currentTime = maxTimeRef.current;
    }
  };

  if (!content) return null;

  const titleLabel =
    kind === "link" ? linkSrc : fileSrc ? fileSrc.split("/").pop() || "Contenu" : "Contenu";

  return createPortal(
    <div className="cv-overlay" role="presentation" onClick={onClose}>
      <div
        className="cv-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Prévisualisation du contenu"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cv-toolbar">
          <span className="cv-title" title={titleLabel}>
            {content.type?.toUpperCase()} · {titleLabel}
          </span>
          <div className="cv-toolbar-actions">
            {kind === "video" && fileSrc ? (
              <button 
                type="button" 
                className="cv-link-external" 
                onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }}
                style={{ background: "rgba(26,20,16,0.05)", border: "1px solid var(--border-c)", color: "var(--ink)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                title="Reculer de 10 secondes"
              >
                <span style={{ fontSize: "1.1rem" }}>⏪</span> -10s
              </button>
            ) : null}
            {kind === "link" && linkSrc ? (
              <a className="cv-link-external" href={linkSrc} target="_blank" rel="noopener noreferrer" onClick={() => onComplete && onComplete()}>
                Nouvel onglet
              </a>
            ) : null}
            {kind !== "link" && fileSrc ? (
              <a className="cv-link-external" href={fileSrc} target="_blank" rel="noopener noreferrer" onClick={() => onComplete && onComplete()}>
                Ouvrir le fichier
              </a>
            ) : null}
            <button type="button" className="cv-close" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="cv-body">
          {kind === "image" && fileSrc ? (
            <img className="cv-img" src={fileSrc} alt="" onLoad={() => onComplete && onComplete()} />
          ) : null}

          {kind === "video" && fileSrc ? (
            <video 
              ref={videoRef}
              className="cv-video" 
              src={fileSrc} 
              controls 
              playsInline 
              preload="metadata" 
              onLoadedMetadata={handleVideoLoaded}
              onVolumeChange={handleVolumeChange}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              onEnded={() => onComplete && onComplete()} 
            />
          ) : null}

          {(kind === "pdf" || kind === "file") && fileSrc ? (
            <iframe className="cv-iframe" title="Prévisualisation" src={`${fileSrc}#toolbar=1`} onLoad={() => onComplete && onComplete()} />
          ) : null}

          {kind === "link" && linkSrc ? (
            <>
              <iframe className="cv-iframe cv-iframe--link" title={linkSrc} src={linkSrc} onLoad={() => onComplete && onComplete()} />
              <p className="cv-link-hint">
                Si la page reste vide, le site bloque l’affichage dans une fenêtre intégrée — utilise « Nouvel onglet ».
              </p>
            </>
          ) : null}

          {!kind ? <p className="cv-empty">Aucun fichier ou URL à afficher.</p> : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
