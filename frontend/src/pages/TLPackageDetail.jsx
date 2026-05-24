import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { packageService, courseService, exclusionService } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import "./TLPackageDetail.css";

/* ─── Sous-composant : panneau d'exclusion d'un cours ─── */
const CourseExclusionPanel = ({ course, pkgId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    exclusionService.get(pkgId, course.id)
      .then(r => setData(r.data))
      .catch(() => setMsg("Erreur de chargement."))
      .finally(() => setLoading(false));
  }, [pkgId, course.id]);

  const toggleChapter = async (chapId, isExcluded) => {
    if (!data) return;
    const currentChapIds = data.excluded_chapter_ids;
    const newChapIds = isExcluded
      ? currentChapIds.filter(id => id !== chapId)
      : [...currentChapIds, chapId];
    await save(newChapIds, data.excluded_content_ids);
  };

  const toggleContent = async (contId, isExcluded) => {
    if (!data) return;
    const currentContIds = data.excluded_content_ids;
    const newContIds = isExcluded
      ? currentContIds.filter(id => id !== contId)
      : [...currentContIds, contId];
    await save(data.excluded_chapter_ids, newContIds);
  };

  const save = async (chapIds, contIds) => {
    setSaving(true);
    setMsg("");
    try {
      const res = await exclusionService.update(pkgId, course.id, {
        excluded_chapter_ids: chapIds,
        excluded_content_ids: contIds,
      });
      setData(res.data);
      setMsg("✅ Sauvegardé !");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("❌ Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const contentTypeIcon = (type) => {
    const icons = { video: "🎬", pdf: "📄", image: "🖼️", link: "🔗" };
    return icons[type] || "📎";
  };

  return (
    <div className="excl-panel-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="excl-panel">
        <div className="excl-panel-header">
          <div>
            <h3 className="excl-panel-title">Personnaliser : {data?.course_view?.title || course.title}</h3>
            <p className="excl-panel-sub">
              Masquez des chapitres ou contenus pour ce package uniquement.<br />
              <strong>Le cours original reste intact.</strong>
            </p>
          </div>
          <button className="excl-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {saving && <div className="excl-saving-bar">Sauvegarde en cours...</div>}
        {msg && <p className={`excl-msg ${msg.startsWith("✅") ? "success" : "danger"}`}>{msg}</p>}

        <div className="excl-body">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : !data?.course_view?.chapters?.length ? (
            <p className="excl-empty">Ce cours n'a pas encore de chapitres.</p>
          ) : (
            data.course_view.chapters.map(chap => (
              <div key={chap.id} className={`excl-chapter ${chap.is_excluded ? "excl-hidden" : ""}`}>
                <div className="excl-chapter-header">
                  <div className="excl-chapter-info">
                    <span className="excl-chapter-icon">📖</span>
                    <span className="excl-chapter-title">{chap.title}</span>
                    {chap.is_excluded && <span className="excl-tag">Masqué</span>}
                  </div>
                  <button
                    className={`excl-toggle-btn ${chap.is_excluded ? "excl-restore" : "excl-hide"}`}
                    onClick={() => toggleChapter(chap.id, chap.is_excluded)}
                    disabled={saving}
                  >
                    {chap.is_excluded ? "Restaurer" : "Masquer"}
                  </button>
                </div>

                {!chap.is_excluded && chap.contents.length > 0 && (
                  <div className="excl-contents">
                    {chap.contents.map(cont => (
                      <div key={cont.id} className={`excl-content-row ${cont.is_excluded ? "excl-hidden" : ""}`}>
                        <div className="excl-content-info">
                          <span className="excl-content-icon">{contentTypeIcon(cont.type)}</span>
                          <span className="excl-content-label">{cont.type.toUpperCase()}</span>
                          {cont.is_excluded && <span className="excl-tag sm">Masqué</span>}
                        </div>
                        <button
                          className={`excl-toggle-btn sm ${cont.is_excluded ? "excl-restore" : "excl-hide"}`}
                          onClick={() => toggleContent(cont.id, cont.is_excluded)}
                          disabled={saving}
                        >
                          {cont.is_excluded ? "Restaurer" : "Masquer"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Page principale ─── */
const TLPackageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Bloc 1 — Infos
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  // Bloc 2 — Cours
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courseToAdd, setCourseToAdd] = useState("");

  // Panneau d'exclusion
  const [excludingCourse, setExcludingCourse] = useState(null);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pkgRes, coursesRes] = await Promise.all([
        packageService.getOne(id),
        courseService.getAll(),
      ]);
      const pkgData = pkgRes.data;
      setPkg(pkgData);
      setName(pkgData.name || "");
      setDescription(pkgData.description || "");
      setAllCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.results ?? []);
    } catch {
      setError("Impossible de charger le package.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingInfo(true);
    setInfoMsg("");
    try {
      const currentCourseIds = (pkg.courses_info || []).map(c => c.id);
      await packageService.update(id, { name, description, courses: currentCourseIds });
      setInfoMsg("✅ Modifications enregistrées !");
      fetchAll();
    } catch {
      setInfoMsg("❌ Erreur lors de la sauvegarde.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleRemoveCourse = async (courseId) => {
    const updated = (pkg.courses_info || []).map(c => c.id).filter(cid => cid !== courseId);
    try {
      await packageService.update(id, { name, description, courses: updated });
      fetchAll();
    } catch {
      alert("Erreur lors de la suppression du cours.");
    }
  };

  const handleAddCourse = async () => {
    if (!courseToAdd) return;
    const existing = (pkg.courses_info || []).map(c => c.id);
    if (existing.includes(parseInt(courseToAdd))) return;
    const updated = [...existing, parseInt(courseToAdd)];
    try {
      await packageService.update(id, { name, description, courses: updated });
      setCourseToAdd("");
      setShowAddCourse(false);
      fetchAll();
    } catch {
      alert("Erreur lors de l'ajout du cours.");
    }
  };

  const includedIds = (pkg?.courses_info || []).map(c => c.id);
  const availableCourses = allCourses.filter(c => !includedIds.includes(c.id));

  if (loading) return <DashboardLayout><div className="spinner-wrap"><div className="spinner" /></div></DashboardLayout>;
  if (error)   return <DashboardLayout><p className="error-banner">{error}</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="pkg-detail-page page-enter">

        {/* Breadcrumb */}
        <div className="pkg-breadcrumb">
          <button className="pkg-back-btn" onClick={() => navigate("/tl/courses")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mes Packages
          </button>
          <span className="pkg-breadcrumb-sep">/</span>
          <span className="pkg-breadcrumb-current">{pkg.name}</span>
        </div>

        <div className="pkg-detail-grid">

          {/* ════ BLOC 1 — INFOS ════ */}
          <section className="pkg-detail-card pkg-info-card">
            <div className="pkg-card-header">
              <div className="pkg-card-icon">📝</div>
              <div>
                <h2 className="pkg-card-title">Informations du Package</h2>
                <p className="pkg-card-sub">Modifiez le nom et la description.</p>
              </div>
            </div>
            <form onSubmit={handleSaveInfo} className="pkg-info-form">
              <div className="pkg-form-group">
                <label className="pkg-label">Nom du package <span className="req">*</span></label>
                <input type="text" className="pkg-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Parcours Dev Full-Stack" required />
              </div>
              <div className="pkg-form-group">
                <label className="pkg-label">Description</label>
                <textarea className="pkg-textarea" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Décrivez l'objectif de ce package..." />
              </div>
              {infoMsg && <p className={`pkg-feedback ${infoMsg.startsWith("✅") ? "success" : "danger"}`}>{infoMsg}</p>}
              <button type="submit" className="pkg-btn-save" disabled={savingInfo || !name.trim()}>
                {savingInfo ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>
          </section>

          {/* ════ BLOC 2 — COURS ════ */}
          <section className="pkg-detail-card pkg-courses-card">
            <div className="pkg-card-header">
              <div className="pkg-card-icon">📚</div>
              <div>
                <h2 className="pkg-card-title">Cours du Package</h2>
                <p className="pkg-card-sub">{includedIds.length} cours — cliquez ✏️ pour personnaliser un cours.</p>
              </div>
            </div>

            <div className="pkg-courses-list">
              {(pkg.courses_info || []).length === 0 ? (
                <div className="pkg-courses-empty">
                  <span>📂</span>
                  <p>Aucun cours dans ce package pour l'instant.</p>
                </div>
              ) : (
                pkg.courses_info.map(course => (
                  <div key={course.id} className="pkg-course-row">
                    <div className="pkg-course-info">
                      {course.image
                        ? <img src={course.image} alt={course.title} className="pkg-course-thumb" />
                        : <div className="pkg-course-thumb pkg-course-thumb--placeholder">📖</div>
                      }
                      <span className="pkg-course-title">{course.title}</span>
                    </div>
                    <div className="pkg-course-actions">
                      {/* Bouton Personnaliser */}
                      <button
                        className="pkg-btn-customize"
                        onClick={() => setExcludingCourse(course)}
                        title="Personnaliser ce cours dans le package"
                      >
                        ✏️ Personnaliser
                      </button>
                      {/* Bouton Retirer */}
                      <button
                        className="pkg-btn-remove"
                        onClick={() => handleRemoveCourse(course.id)}
                        title="Retirer ce cours du package"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Zone ajout */}
            <div className="pkg-add-course-zone">
              {!showAddCourse ? (
                <button className="pkg-btn-add-course" onClick={() => setShowAddCourse(true)} disabled={availableCourses.length === 0}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  {availableCourses.length === 0 ? "Tous les cours sont déjà ajoutés" : "Ajouter un cours"}
                </button>
              ) : (
                <div className="pkg-add-select-row">
                  <select className="pkg-select" value={courseToAdd} onChange={e => setCourseToAdd(e.target.value)} autoFocus>
                    <option value="">-- Choisir un cours --</option>
                    {availableCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <button className="pkg-btn-save" onClick={handleAddCourse} disabled={!courseToAdd}>Ajouter</button>
                  <button className="pkg-btn-cancel" onClick={() => { setShowAddCourse(false); setCourseToAdd(""); }}>Annuler</button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Panneau d'exclusion (modal latéral) */}
      {excludingCourse && (
        <CourseExclusionPanel
          course={excludingCourse}
          pkgId={id}
          onClose={() => setExcludingCourse(null)}
        />
      )}
    </DashboardLayout>
  );
};

export default TLPackageDetail;
