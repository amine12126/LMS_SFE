import { useCallback, useEffect, useMemo, useState } from "react";
import { chapterService, contentService, courseService } from "../services/api.js";
import DashboardLayout from "../components/DashboardLayout.jsx";
import { useParams, useNavigate } from "react-router-dom";
import "./ProfileTL.css";
import "./CourseDetail.css";
import ChapterModal from "../components/ChapterModal.jsx";
import ContentModal from "../components/ContentModal.jsx";
import ContentViewerModal from "../components/ContentViewerModal.jsx";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [contentChapterId, setContentChapterId] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);

  const chapters = useMemo(() => course?.chapters ?? [], [course]);

  const extractErr = (err, fallback) => {
    if (err?.response?.status === 429) return "Trop de requêtes. Attends une minute puis réessaie.";
    const data = err?.response?.data;
    if (!data) return fallback;
    if (data.detail) return data.detail;
    if (typeof data === "object") {
      const merged = Object.values(data).flat().filter(Boolean).join(" | ");
      if (merged) return merged;
    }
    return fallback;
  };

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await courseService.getOne(id);
      setCourse(res.data);
    } catch {
      setError("Impossible de charger le cours.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const deleteCourse = async () => {
    if (!window.confirm("Delete course?")) return;
    setBusy(true);
    try {
      await courseService.remove(id);
      navigate("/tl/courses");
    } finally {
      setBusy(false);
    }
  };

  const addChapter = async (e) => {
    e.preventDefault();
    if (!chapterTitle.trim()) return;
    setBusy(true);
    try {
      await chapterService.create({
        course: Number(id),
        title: chapterTitle.trim(),
        description: "",
        order: chapters.length + 1,
      });
      setChapterTitle("");
      fetchCourse();
    } catch (err) {
      setError(extractErr(err, "Impossible d'ajouter le chapitre."));
    } finally {
      setBusy(false);
    }
  };

  const openCreateChapter = () => {
    setEditingChapter(null);
    setChapterModalOpen(true);
  };

  const openEditChapter = (chapter) => {
    setEditingChapter(chapter);
    setChapterModalOpen(true);
  };

  const saveChapter = async (payload) => {
    const desc = payload.description ?? "";
    const base = {
      course: Number(id),
      title: payload.title,
      description: desc,
    };
    try {
      if (editingChapter?.id) {
        await chapterService.update(editingChapter.id, {
          ...base,
          order: editingChapter.order,
        });
      } else {
        await chapterService.create({ ...base, order: chapters.length + 1 });
      }
      await fetchCourse();
    } catch (err) {
      setError(extractErr(err, "Impossible de sauvegarder le chapitre."));
      throw err;
    }
  };

  const deleteChapter = async (chapterId) => {
    if (!window.confirm("Supprimer ce chapitre ?")) return;
    setBusy(true);
    try {
      await chapterService.remove(chapterId);
      await fetchCourse();
    } catch (err) {
      setError(extractErr(err, "Impossible de supprimer le chapitre."));
    } finally {
      setBusy(false);
    }
  };

  const openContent = (chapterId) => {
    setContentChapterId(chapterId);
    setContentModalOpen(true);
  };

  const saveContent = async (formData) => {
    try {
      await contentService.create(formData);
      await fetchCourse();
    } catch (err) {
      setError(extractErr(err, "Impossible d'ajouter le contenu."));
      throw err;
    }
  };

  const deleteContent = async (contentId) => {
    if (!window.confirm("Supprimer ce contenu ?")) return;
    setBusy(true);
    try {
      await contentService.remove(contentId);
      await fetchCourse();
    } catch (err) {
      setError(extractErr(err, "Impossible de supprimer le contenu."));
    } finally {
      setBusy(false);
    }
  };

  const getChapterContents = (ch) =>
    Array.isArray(ch.contents) ? ch.contents : ch.content ? [ch.content] : [];

  // ── Drag & drop reorder ─────────────────────────
  const [dragId, setDragId] = useState(null);

  const moveChapter = (fromId, toId) => {
    const fromIndex = chapters.findIndex((c) => c.id === fromId);
    const toIndex = chapters.findIndex((c) => c.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
    const next = [...chapters];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setCourse((prev) => ({ ...prev, chapters: next }));
  };

  const commitReorder = async () => {
    if (!course) return;
    const payload = (course.chapters || []).map((ch, idx) => ({ id: ch.id, order: idx + 1 }));
    setBusy(true);
    try {
      await chapterService.reorder(payload);
      await fetchCourse();
    } catch (err) {
      setError(extractErr(err, "Erreur lors du réordonnancement."));
      await fetchCourse();
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="profileTlPage">
        <button className="btn-link" onClick={() => navigate("/tl/courses")}>
          ← Retour aux cours
        </button>
        {error ? <div className="profileTlError">{error}</div> : null}
        <ChapterModal
          open={chapterModalOpen}
          onClose={() => setChapterModalOpen(false)}
          onSave={saveChapter}
          courseId={Number(id)}
          existing={editingChapter}
        />

        <ContentModal
          open={contentModalOpen}
          onClose={() => setContentModalOpen(false)}
          onSave={saveContent}
          chapterId={contentChapterId}
        />

        <ContentViewerModal content={previewContent} onClose={() => setPreviewContent(null)} />

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        ) : !course ? null : (
          <>
            <div className="profileTlCard">
              <h2 className="profileTlTitle" style={{ marginBottom: 8 }}>
                {course.title}
              </h2>
              <p style={{ color: "#64748b", marginBottom: 8 }}>{course.description}</p>
              <p style={{ color: "#64748b", marginBottom: 12 }}>Durée: {course.duration}</p>
              <button
                onClick={deleteCourse}
                disabled={busy}
                style={{ border: "none", background: "#ef4444", color: "#fff", borderRadius: 10, padding: "10px 14px" }}
              >
                Supprimer le cours
              </button>
            </div>

            <div className="profileTlCard">
              <div className="cdHeader">
                <h3>Chapitres</h3>
                <div className="cdHeaderActions">
                  <button className="profileTlBtn" type="button" onClick={openCreateChapter} disabled={busy}>
                    + Nouveau chapitre
                  </button>
                </div>
              </div>

              <form onSubmit={addChapter} className="cdQuickAdd">
                <input
                  className="cdQuickAddInput"
                  placeholder="Ajout rapide: titre du chapitre..."
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                />
                <button className="cdQuickAddBtn" type="submit" disabled={busy}>
                  Ajouter
                </button>
              </form>

              {chapters.length === 0 ? (
                <p className="profileTlInfo">Aucun chapitre.</p>
              ) : (
                <>
                  <p className="cdHint">Glisse-dépose pour réordonner les chapitres.</p>
                  <ul className="cdList" style={{ listStyle: "none" }}>
                    {chapters.map((ch, i) => {
                      const chapterContents = getChapterContents(ch);
                      return (
                      <li
                        key={ch.id}
                        className="cdItem"
                        draggable
                        onDragStart={() => setDragId(ch.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragId) moveChapter(dragId, ch.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          commitReorder();
                        }}
                      >
                        <div className="cdItemLeft">
                          <span className="cdDrag" title="Drag">⠿</span>
                          <div>
                            <div className="cdTitle">
                              <strong>
                                {i + 1}. {ch.title}
                              </strong>
                            </div>
                            {ch.description ? (
                              <p className="cdChapterDesc">{ch.description}</p>
                            ) : null}
                            <div className="cdMeta">
                              {chapterContents.length ? (
                                <ul className="cdContentsList">
                                  {chapterContents.map((c) => (
                                    <li key={c.id} className="cdContentRow">
                                      <button
                                        type="button"
                                        className="cdContentOpen"
                                        onClick={() => setPreviewContent(c)}
                                        disabled={busy}
                                      >
                                        Voir · {c.type}
                                        <span className="cdContentOpenHint">cliquer pour afficher sur cette page</span>
                                      </button>
                                      <button
                                        type="button"
                                        className="cdContentDel"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteContent(c.id);
                                        }}
                                        disabled={busy}
                                      >
                                        Supprimer
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="cdBadge cdBadgeMuted">Aucun contenu</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="cdItemActions">
                          <button className="cdBtn" type="button" onClick={() => openContent(ch.id)} disabled={busy}>
                            Ajouter contenu
                          </button>
                          <button className="cdBtn" type="button" onClick={() => openEditChapter(ch)} disabled={busy}>
                            Modifier
                          </button>
                          <button className="cdBtnDanger" type="button" onClick={() => deleteChapter(ch.id)} disabled={busy}>
                            Supprimer
                          </button>
                        </div>
                      </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}