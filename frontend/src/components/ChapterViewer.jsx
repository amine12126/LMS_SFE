import { useEffect, useRef, useState } from "react";
import ContentViewerModal from "./ContentViewerModal.jsx";
import { consultantCourseService } from "../services/api.js";
import "./ChapterViewer.css";

function contentLabel(c) {
  if (c.type === "link" && c.url) {
    try {
      const u = new URL(c.url);
      return u.hostname + u.pathname.slice(0, 40) + (u.pathname.length > 40 ? "…" : "");
    } catch {
      return c.url.slice(0, 48) + (c.url.length > 48 ? "…" : "");
    }
  }
  if (c.file && typeof c.file === "string") {
    const name = c.file.split("/").pop() || c.file;
    return name.length > 42 ? `${name.slice(0, 40)}…` : name;
  }
  return c.type || "Contenu";
}

const ChapterViewer = ({ chapter, index, onProgressUpdate }) => {
  const panelRef = useRef(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [isCompleted, setIsCompleted] = useState(chapter?.progress?.is_completed || false);
  const [saving, setSaving] = useState(false);
  const [completedItems, setCompletedItems] = useState(() => {
    const set = new Set();
    if (chapter?.contents) {
      chapter.contents.forEach(c => {
        if (c.progress?.is_completed) set.add(c.id);
      });
    }
    return set;
  });

  const handleReset = () => {
    if (window.confirm("Voulez-vous vraiment annuler la progression de ce chapitre ? Vous devrez revoir tous ses contenus.")) {
      setSaving(true);
      consultantCourseService.markProgress(chapter.id, "reset").then(res => {
        setIsCompleted(false);
        setCompletedItems(new Set());
        if (onProgressUpdate) onProgressUpdate(chapter.id, res.data);
      }).catch(err => {
        console.error("DEBUG ERROR FROM BACKEND:", err.response?.data || err);
        alert("Erreur: " + JSON.stringify(err.response?.data || err.message));
      })
      .finally(() => setSaving(false));
    }
  };

  const handleContentComplete = (contentId) => {
    consultantCourseService.markContentProgress(contentId).then(() => {
      setCompletedItems(prev => {
        const next = new Set(prev);
        next.add(contentId);
        return next;
      });
      if (onProgressUpdate) {
        onProgressUpdate(chapter.id, { content_completed: true });
      }
    }).catch(console.error);
  };

  // Synchronize state with new chapter prop data from server
  useEffect(() => {
    if (chapter) {
      setIsCompleted(chapter.progress?.is_completed || false);
      const set = new Set();
      if (chapter.contents) {
        chapter.contents.forEach(c => {
          if (c.progress?.is_completed) set.add(c.id);
        });
      }
      setCompletedItems(set);
    }
  }, [chapter]);

  // Mark as viewed and notify parent ONLY when chapter ID actually changes
  useEffect(() => {
    setPreviewContent(null);
    if (chapter?.id) {
      consultantCourseService.markProgress(chapter.id, "view").then(res => {
        if (onProgressUpdate) {
           onProgressUpdate(chapter.id, res.data);
        }
      }).catch(() => {});
    }
  }, [chapter?.id]);

  useEffect(() => {
    if (panelRef.current) {
      setTimeout(() => {
        panelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  }, [chapter?.id]);

  if (!chapter) return null;

  const items = chapter.contents?.length ? chapter.contents : chapter.content ? [chapter.content] : [];

  const allItemsCompleted = items.length === 0 || items.every(item => completedItems.has(item.id));
  const canComplete = isCompleted || allItemsCompleted;

  return (
    <div className="cv-panel" ref={panelRef}>
      <ContentViewerModal 
        content={previewContent} 
        onClose={() => setPreviewContent(null)} 
        onComplete={() => {
          if (previewContent?.id) {
            handleContentComplete(previewContent.id);
          }
        }}
      />

      <div className="cv-panel__header">
        <div className="cv-panel__num">Chapitre {String((index ?? 0) + 1).padStart(2, "0")}</div>
        <h2 className="cv-panel__title">{chapter.title}</h2>
        {chapter.description ? <p className="cv-panel__desc">{chapter.description}</p> : null}
      </div>

      {items.length > 0 ? (
        <>
          <ul className="cv-content-rows">
            {items.map((c) => (
              <li key={c.id} className="cv-content-row">
                <div className="cv-content-row__info">
                  <span className={`cv-content-row__badge cv-content-row__badge--${c.type}`}>
                    {c.type === "pdf" ? "📄" : c.type === "video" ? "🎬" : c.type === "image" ? "🖼️" : "🔗"}
                    {c.type}
                  </span>
                  <span className="cv-content-row__label">{contentLabel(c)}</span>
                  {completedItems.has(c.id) && (
                    <span style={{ color: "var(--moss, #4a6741)", fontSize: "0.9rem", marginLeft: 8 }} title="Contenu visionné">
                      ✔
                    </span>
                  )}
                </div>
                <button type="button" className="cv-content-row__btn" onClick={() => setPreviewContent(c)}>
                  Voir
                </button>
              </li>
            ))}
          </ul>
          
          <div className="cv-progress-section" style={{ marginTop: 24, padding: 16, background: "var(--cream, #faf7f2)", borderRadius: 12, border: "1px solid var(--border-c, rgba(26,20,16,0.1))", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
             <input 
               type="checkbox" 
               id={`chapter-complete-${chapter.id}`}
               checked={isCompleted}
               disabled={saving || (!isCompleted && !canComplete)}
               style={{ width: 20, height: 20, cursor: (saving || (!isCompleted && !canComplete)) ? "default" : "pointer", opacity: canComplete ? 1 : 0.5 }}
               onChange={(e) => {
                 if (e.target.checked && canComplete) {
                   setSaving(true);
                   consultantCourseService.markProgress(chapter.id, "complete").then(res => {
                     setIsCompleted(true);
                     if (onProgressUpdate) onProgressUpdate(chapter.id, res.data);
                   }).finally(() => setSaving(false));
                 } else if (!e.target.checked) {
                   handleReset();
                 }
               }}
             />
             <label htmlFor={`chapter-complete-${chapter.id}`} style={{ fontWeight: 600, color: isCompleted ? "var(--moss, #4a6741)" : (canComplete ? "var(--ink, #1a1410)" : "#94a3b8"), cursor: (saving || (!isCompleted && !canComplete)) ? "default" : "pointer" }}>
               {isCompleted ? "✔ Chapitre terminé" : "Marquer ce chapitre comme terminé"}
             </label>
             {!isCompleted && !canComplete && (
               <span style={{ fontSize: "0.85rem", color: "#64748b", marginLeft: "auto", fontStyle: "italic" }}>
                 Veuillez consulter tout le contenu de ce chapitre pour le terminer.
               </span>
             )}
          </div>
        </>
      ) : (
        <div className="cv-panel__empty">
          <span>📂</span>
          <p>Ce chapitre ne contient pas encore de contenu.</p>
        </div>
      )}
    </div>
  );
};

export default ChapterViewer;
