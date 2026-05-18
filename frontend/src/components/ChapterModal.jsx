import { useState, useEffect, useRef } from "react";
import "./Modal.css";

const ChapterModal = ({ open, onClose, onSave, courseId, existing }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTitle(existing?.title ?? "");
      setDescription(existing?.description ?? "");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, existing]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Le titre est requis.");
    setLoading(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        course: courseId,
      });
      onClose();
    } catch {
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">{existing ? "Modifier le chapitre" : "Ajouter un chapitre"}</h3>
          <button className="modal__close" onClick={onClose}>
            x
          </button>
        </div>
        <form className="modal__body" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label">Titre du chapitre</label>
            <input
              ref={inputRef}
              className="field__input"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              placeholder="ex: Introduction au module"
            />
          </div>
          <div className="field">
            <label className="field__label">Description du chapitre (optionnel)</label>
            <textarea
              className="field__input"
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError("");
              }}
              placeholder="Résumé court : objectifs, ordre des ressources, etc."
              style={{ resize: "vertical", minHeight: 72 }}
            />
          </div>
          {error && <p className="error-banner">{error}</p>}
          <div className="modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn--accent" disabled={loading}>
              {loading ? "..." : existing ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChapterModal;

