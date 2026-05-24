import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { courseService, packageService } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import TLCourseCard from "../components/TLCourseCard.jsx";
import AddCourseCard from "../components/AddCourseCard";
import "./TLCoursesPage.css";

const CoursesHero = ({ name, courseCount, packageCount }) => (
  <div className="courses-hero">
    <div className="courses-hero__inner">
      <div>
        <p className="courses-hero__greeting">Bonjour, {name} 👋</p>
        <h1 className="courses-hero__title">Gestion des Cours</h1>
        <p className="courses-hero__sub">
          Gérez vos <strong>{courseCount}</strong> cours et <strong>{packageCount}</strong> packages.
        </p>
      </div>
      <div className="courses-hero__stats">
        <div className="stat-chip">
          <span className="stat-chip__val">{courseCount}</span>
          <span className="stat-chip__label">Cours</span>
        </div>
        <div className="stat-chip">
          <span className="stat-chip__val">{packageCount}</span>
          <span className="stat-chip__label">Packages</span>
        </div>
      </div>
    </div>
  </div>
);

const CoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("courses"); // "courses" or "packages"

  // Package Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, packagesRes] = await Promise.all([
        courseService.getAll(),
        packageService.getAll(),
      ]);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.results ?? []);
      setPackages(Array.isArray(packagesRes.data) ? packagesRes.data : packagesRes.data.results ?? []);
    } catch (err) {
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  const heroName = user?.prenom ?? "Enseignant";

  const toggleCourseSelection = (courseId) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!pkgName.trim()) return;
    setSaving(true);
    try {
      await packageService.create({
        name: pkgName,
        description: pkgDesc,
        courses: selectedCourses,
      });
      setIsModalOpen(false);
      setPkgName("");
      setPkgDesc("");
      setSelectedCourses([]);
      fetchData();
    } catch (err) {
      alert("Erreur lors de la création du package.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout hero={<CoursesHero name={heroName} courseCount={courses.length} packageCount={packages.length} />}>
      <div className="page-enter">
        {error && <p className="error-banner">{error}</p>}

        <div style={{ display: "flex", gap: 16, marginBottom: 32, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
          <button 
            type="button" 
            onClick={() => setActiveTab("courses")}
            style={{ 
              padding: "8px 16px", 
              borderRadius: 20, 
              border: "none", 
              background: activeTab === "courses" ? "var(--text-1)" : "transparent", 
              color: activeTab === "courses" ? "var(--bg-1)" : "var(--text-1)", 
              fontWeight: 600, 
              cursor: "pointer", 
              transition: "all 0.2s" 
            }}
          >
            📚 Tous les cours
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab("packages")}
            style={{ 
              padding: "8px 16px", 
              borderRadius: 20, 
              border: "none", 
              background: activeTab === "packages" ? "var(--accent)" : "transparent", 
              color: activeTab === "packages" ? "#000" : "var(--text-1)", 
              fontWeight: 600, 
              cursor: "pointer", 
              transition: "all 0.2s" 
            }}
          >
            🗂️ Packages de cours
          </button>
        </div>

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        ) : (
          <div className="tl-courses-layout">
            
            {/* SECTION 1: COURSES */}
            {activeTab === "courses" && (
              <section className="courses-section fade-in">
                <div className="section-header-inline">
                  <div>
                    <h2 className="section-title">Mes Cours Individuels</h2>
                    <p className="section-subtitle">Gérez et éditez vos cours créés.</p>
                  </div>
                </div>
                <div className="courses-grid">
                  <AddCourseCard />
                  {courses.map((course, i) => (
                    <TLCourseCard key={course.id} course={course} style={{ animationDelay: `${i * 50}ms` }} />
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: PACKAGES */}
            {activeTab === "packages" && (
              <section className="courses-section fade-in">
                <div className="section-header-inline">
                  <div>
                    <h2 className="section-title">Mes Packages de Cours</h2>
                    <p className="section-subtitle">Regroupez plusieurs cours pour les assigner plus facilement à vos groupes.</p>
                  </div>
                </div>
                
                <div className="courses-grid">
                  {/* Add Package Card inline */}
                  <button className="add-package-card" onClick={() => setIsModalOpen(true)}>
                    <span className="add-course-card__icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="add-course-card__label">Nouveau Package</span>
                  </button>

                  {packages.map((pkg, i) => (
                    <div
                      key={pkg.id}
                      className="package-card"
                      style={{ animationDelay: `${i * 50}ms`, cursor: "pointer" }}
                      onClick={() => navigate(`/tl/packages/${pkg.id}`)}
                      title="Cliquez pour gérer ce package"
                    >
                      <div className="package-card__header">
                        <h3 className="package-card__title">{pkg.name}</h3>
                        <span className="package-badge">{pkg.courses_info?.length || 0} cours</span>
                      </div>
                      <p className="package-card__desc">{pkg.description || "Aucune description renseignée."}</p>
                      <div className="package-card__courses">
                        {pkg.courses_info?.slice(0, 3).map(c => (
                          <div key={c.id} className="package-course-item">{c.title}</div>
                        ))}
                        {pkg.courses_info?.length > 3 && (
                          <div className="package-course-item more">+{pkg.courses_info.length - 3} autres cours...</div>
                        )}
                      </div>
                      <div className="package-card__footer">
                        <span className="package-card__cta">Gérer le package →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* PACKAGE CREATION MODAL */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content pkg-modal-premium">
              <div className="modal-header-premium">
                <div>
                  <h2>Créer un nouveau package</h2>
                  <p className="modal-sub">Rassemblez plusieurs cours sous un même ensemble cohérent.</p>
                </div>
                <button className="close-modal-btn" onClick={() => setIsModalOpen(false)} aria-label="Fermer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreatePackage} className="premium-form">
                <div className="form-group-premium">
                  <label className="label-premium">Nom du package <span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={pkgName} 
                    onChange={e => setPkgName(e.target.value)} 
                    required 
                    className="input-premium"
                    placeholder="Ex: Parcours d'Intégration Dev..."
                  />
                </div>
                
                <div className="form-group-premium">
                  <label className="label-premium">Description générale</label>
                  <textarea 
                    value={pkgDesc} 
                    onChange={e => setPkgDesc(e.target.value)} 
                    rows="3"
                    className="textarea-premium"
                    placeholder="Décrivez l'objectif de ce regroupement de cours..."
                  />
                </div>

                <div className="form-group-premium">
                  <label className="label-premium">Cours à inclure dans ce package</label>
                  <div className="course-selection-list-premium">
                    {courses.map(course => (
                      <label key={course.id} className="course-checkbox-premium">
                        <div className="checkbox-wrapper">
                          <input 
                            type="checkbox" 
                            checked={selectedCourses.includes(course.id)}
                            onChange={() => toggleCourseSelection(course.id)}
                            id={`course-chk-${course.id}`}
                          />
                          <div className="custom-checkbox">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12">
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                        <div className="course-chk-label">
                          <span className="course-chk-title">{course.title}</span>
                          {course.duration && <span className="course-chk-duration">⏱️ {course.duration}</span>}
                        </div>
                      </label>
                    ))}
                    {courses.length === 0 && (
                      <div className="empty-msg-premium">
                        <p>Aucun cours n'a été créé pour le moment.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions-premium">
                  <button type="button" className="btn-cancel-premium" onClick={() => setIsModalOpen(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-submit-premium" disabled={saving || !pkgName.trim()}>
                    {saving ? (
                      <span className="loading-dots">Création en cours</span>
                    ) : (
                      <>Créer le Package</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;
