import { useState, useEffect } from "react";
import "./Modal.css";

const CONTENT_TYPES = [
  { value: "pdf", label: "PDF", icon: "📄" },
  { value: "image", label: "Image", icon: "🖼️" },
  { value: "video", label: "Vidéo", icon: "🎬" },
  { value: "link", label: "Lien", icon: "🔗" },
];

const ContentModal = ({ open, onClose, onSave, chapterId }) => {
  const [type, setType] = useState("pdf");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setType("pdf");
      setFile(null);
      setUrl("");
      setPreview(null);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === "link" && !url.trim()) return setError("URL requise.");
    if (type !== "link" && !file) return setError("Fichier requis.");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("chapter", chapterId);
      fd.append("type", type);
      if (type === "link") fd.append("url", url.trim());
      else fd.append("file", file);
      await onSave(fd);
      onClose();
    } catch {
      setError("Erreur lors de l'upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Ajouter un contenu au chapitre</h3>
          <button className="modal__close" onClick={onClose}>
            x
          </button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
          <div className="content-type-tabs">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct.value}
                type="button"
                className={`content-type-tab ${type === ct.value ? "active" : ""}`}
                onClick={() => {
                  setType(ct.value);
                  setFile(null);
                  setUrl("");
                  setPreview(null);
                }}
              >
                <span>{ct.icon}</span>
                <span>{ct.label}</span>
              </button>
            ))}
          </div>

          {type === "link" ? (
            <div className="field">
              <label className="field__label">URL du lien</label>
              <input className="field__input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
          ) : (
            <div className="file-drop">
              <input
                id="content-file"
                type="file"
                accept={type === "pdf" ? ".pdf" : type === "image" ? "image/*" : "video/*"}
                onChange={handleFile}
                style={{ display: "none" }}
              />
              <label htmlFor="content-file" className={`file-drop__label ${file ? "file-drop__label--filled" : ""}`}>
                {file ? (
                  <>
                    {preview && <img src={preview} alt="" className="file-drop__preview" />}
                    <span>{file.name}</span>
                    <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </>
                ) : (
                  <>
                    <span>⬆️</span>
                    <span>Cliquer pour sélectionner</span>
                  </>
                )}
              </label>
            </div>
          )}

          {error && <p className="error-banner">{error}</p>}
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn--accent" disabled={loading}>
              {loading ? "..." : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentModal;

