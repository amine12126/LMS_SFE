import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
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
  const [courses, setCourses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        ) : (
          <div className="tl-courses-layout">
            
            {/* SECTION 1: COURSES */}
            <section className="courses-section">
              <h2 className="section-title">Mes Cours Individuels</h2>
              <div className="courses-grid">
                <AddCourseCard />
                {courses.map((course, i) => (
                  <TLCourseCard key={course.id} course={course} style={{ animationDelay: `${i * 50}ms` }} />
                ))}
              </div>
            </section>

            <hr className="section-divider" />

            {/* SECTION 2: PACKAGES */}
            <section className="courses-section">
              <h2 className="section-title">Mes Packages de Cours</h2>
              <p className="section-subtitle">Regroupez plusieurs cours dans des packages pour les assigner facilement.</p>
              
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
                  <div key={pkg.id} className="package-card" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="package-card__header">
                      <h3 className="package-card__title">{pkg.name}</h3>
                      <span className="package-badge">{pkg.courses_info?.length || 0} cours</span>
                    </div>
                    <p className="package-card__desc">{pkg.description || "Aucune description"}</p>
                    <div className="package-card__courses">
                      {pkg.courses_info?.slice(0, 3).map(c => (
                        <div key={c.id} className="package-course-item">• {c.title}</div>
                      ))}
                      {pkg.courses_info?.length > 3 && (
                        <div className="package-course-item more">+{pkg.courses_info.length - 3} autres...</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* PACKAGE CREATION MODAL */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content pkg-modal">
              <h2>Créer un Package de Cours</h2>
              <p className="modal-sub">Sélectionnez les cours à inclure dans ce package.</p>
              
              <form onSubmit={handleCreatePackage}>
                <div className="form-group">
                  <label>Nom du package *</label>
                  <input 
                    type="text" 
                    value={pkgName} 
                    onChange={e => setPkgName(e.target.value)} 
                    required 
                    placeholder="Ex: Formation Réseaux..."
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    value={pkgDesc} 
                    onChange={e => setPkgDesc(e.target.value)} 
                    rows="3"
                    placeholder="Description optionnelle..."
                  />
                </div>

                <div className="form-group">
                  <label>Sélectionner les cours</label>
                  <div className="course-selection-list">
                    {courses.map(course => (
                      <label key={course.id} className="course-checkbox">
                        <input 
                          type="checkbox" 
                          checked={selectedCourses.includes(course.id)}
                          onChange={() => toggleCourseSelection(course.id)}
                        />
                        <span>{course.title}</span>
                      </label>
                    ))}
                    {courses.length === 0 && <p className="empty-msg">Aucun cours disponible.</p>}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                  <button type="submit" className="btn btn-primary" disabled={saving || !pkgName.trim()}>
                    {saving ? "Création..." : "Créer le Package"}
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

