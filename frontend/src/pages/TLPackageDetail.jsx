import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { packageService, courseService } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import "./TLPackageDetail.css";

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

  useEffect(() => {
    fetchAll();
  }, [id]);

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

  /* ── Enregistrer les infos ── */
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingInfo(true);
    setInfoMsg("");
    try {
      const currentCourseIds = (pkg.courses_info || []).map((c) => c.id);
      await packageService.update(id, {
        name,
        description,
        courses: currentCourseIds,
      });
      setInfoMsg("✅ Modifications enregistrées !");
      fetchAll();
    } catch {
      setInfoMsg("❌ Erreur lors de la sauvegarde.");
    } finally {
      setSavingInfo(false);
    }
  };

  /* ── Supprimer un cours du package ── */
  const handleRemoveCourse = async (courseId) => {
    const updated = (pkg.courses_info || [])
      .map((c) => c.id)
      .filter((cid) => cid !== courseId);
    try {
      await packageService.update(id, {
        name,
        description,
        courses: updated,
      });
      fetchAll();
    } catch {
      alert("Erreur lors de la suppression du cours.");
    }
  };

  /* ── Ajouter un cours au package ── */
  const handleAddCourse = async () => {
    if (!courseToAdd) return;
    const existing = (pkg.courses_info || []).map((c) => c.id);
    if (existing.includes(parseInt(courseToAdd))) return;
    const updated = [...existing, parseInt(courseToAdd)];
    try {
      await packageService.update(id, {
        name,
        description,
        courses: updated,
      });
      setCourseToAdd("");
      setShowAddCourse(false);
      fetchAll();
    } catch {
      alert("Erreur lors de l'ajout du cours.");
    }
  };

  const includedIds = (pkg?.courses_info || []).map((c) => c.id);
  const availableCourses = allCourses.filter((c) => !includedIds.includes(c.id));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="spinner-wrap"><div className="spinner" /></div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <p className="error-banner">{error}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="pkg-detail-page page-enter">
        {/* ── Breadcrumb ── */}
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
          {/* ════════════════════════════════
              BLOC 1 – INFORMATIONS
          ════════════════════════════════ */}
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
                <input
                  type="text"
                  className="pkg-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Parcours Dev Full-Stack"
                  required
                />
              </div>

              <div className="pkg-form-group">
                <label className="pkg-label">Description</label>
                <textarea
                  className="pkg-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Décrivez l'objectif de ce package..."
                />
              </div>

              {infoMsg && (
                <p className={`pkg-feedback ${infoMsg.startsWith("✅") ? "success" : "danger"}`}>
                  {infoMsg}
                </p>
              )}

              <button type="submit" className="pkg-btn-save" disabled={savingInfo || !name.trim()}>
                {savingInfo ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>
          </section>

          {/* ════════════════════════════════
              BLOC 2 – COURS DU PACKAGE
          ════════════════════════════════ */}
          <section className="pkg-detail-card pkg-courses-card">
            <div className="pkg-card-header">
              <div className="pkg-card-icon">📚</div>
              <div>
                <h2 className="pkg-card-title">Cours du Package</h2>
                <p className="pkg-card-sub">
                  {includedIds.length} cours dans ce package.
                </p>
              </div>
            </div>

            {/* Liste des cours actuels */}
            <div className="pkg-courses-list">
              {(pkg.courses_info || []).length === 0 ? (
                <div className="pkg-courses-empty">
                  <span>📂</span>
                  <p>Aucun cours dans ce package pour l'instant.</p>
                </div>
              ) : (
                pkg.courses_info.map((course) => (
                  <div key={course.id} className="pkg-course-row">
                    <div className="pkg-course-info">
                      {course.image ? (
                        <img src={course.image} alt={course.title} className="pkg-course-thumb" />
                      ) : (
                        <div className="pkg-course-thumb pkg-course-thumb--placeholder">📖</div>
                      )}
                      <span className="pkg-course-title">{course.title}</span>
                    </div>
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
                ))
              )}
            </div>

            {/* Zone d'ajout */}
            <div className="pkg-add-course-zone">
              {!showAddCourse ? (
                <button
                  className="pkg-btn-add-course"
                  onClick={() => setShowAddCourse(true)}
                  disabled={availableCourses.length === 0}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  {availableCourses.length === 0 ? "Tous les cours sont déjà ajoutés" : "Ajouter un cours"}
                </button>
              ) : (
                <div className="pkg-add-select-row">
                  <select
                    className="pkg-select"
                    value={courseToAdd}
                    onChange={(e) => setCourseToAdd(e.target.value)}
                    autoFocus
                  >
                    <option value="">-- Choisir un cours --</option>
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                  <button
                    className="pkg-btn-save"
                    onClick={handleAddCourse}
                    disabled={!courseToAdd}
                  >
                    Ajouter
                  </button>
                  <button
                    className="pkg-btn-cancel"
                    onClick={() => { setShowAddCourse(false); setCourseToAdd(""); }}
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TLPackageDetail;
