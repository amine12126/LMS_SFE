import { useState, useEffect } from "react";
import { consultantCourseService } from "../services/api";
import CourseCard, { CourseCardSkeleton } from "../components/CourseCard";
import "./CoursesPage.css";

const Hero = ({ count }) => (
  <section className="cp-hero">
    <div className="cp-hero__inner">
      <div className="cp-hero__badge">Catalogue de formation</div>
      <h1 className="cp-hero__title">
        Apprenez à votre
        <br />
        <em>propre rythme.</em>
      </h1>
      <p className="cp-hero__sub">
        Accédez à {count > 0 ? <strong>{count} cours</strong> : "tous les cours"} conçus par vos enseignants. Progressez,
        pratiquez, réussissez.
      </p>
    </div>
    <div className="cp-hero__deco" aria-hidden="true">
      <span className="cp-hero__deco-1">📚</span>
      <span className="cp-hero__deco-2">✏️</span>
      <span className="cp-hero__deco-3">🎓</span>
    </div>
  </section>
);

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("public"); // "public" or "mandatory"

  useEffect(() => {
    setError("");
    consultantCourseService
      .browse()
      .then(({ data }) => setCourses(Array.isArray(data) ? data : data.results ?? []))
      .catch((err) => {
        if (err?.response?.status === 429) {
          setError("Trop de requêtes vers le serveur. Attends une minute puis réessaie.");
          return;
        }
        setError("Impossible de charger les cours. Vérifiez votre connexion.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) => {
    const isPublic = !c.is_mandatory;
    const isMandatory = c.is_mandatory;
    const matchTab = activeTab === "public" ? isPublic : isMandatory;
    
    return (
      matchTab &&
      (c.title?.toLowerCase().includes(search.toLowerCase()) ||
        (c.teacher_name && c.teacher_name.toLowerCase().includes(search.toLowerCase())))
    );
  });

  return (
    <div className="courses-page">
      <Hero count={courses.length} />

      <main className="cp-main">
        <div style={{ display: "flex", gap: 16, marginBottom: 24, borderBottom: "1px solid var(--border-c)", paddingBottom: 12 }}>
          <button 
            type="button" 
            onClick={() => setActiveTab("public")}
            style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: activeTab === "public" ? "var(--ink)" : "transparent", color: activeTab === "public" ? "#fff" : "var(--ink)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            Cours Publics
          </button>
          <button 
            type="button" 
            onClick={() => setActiveTab("mandatory")}
            style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: activeTab === "mandatory" ? "var(--terra)" : "transparent", color: activeTab === "mandatory" ? "#fff" : "var(--terra)", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
          >
            Formations Obligatoires
          </button>
        </div>

        <div className="cp-search-row">
          <div className="cp-search">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              width="16"
              height="16"
              className="cp-search__icon"
            >
              <circle cx="9" cy="9" r="6" />
              <path d="M15 15l-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un cours ou un enseignant…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cp-search__input"
            />
            {search ? (
              <button type="button" className="cp-search__clear" onClick={() => setSearch("")}>
                ✕
              </button>
            ) : null}
          </div>
          {!loading ? (
            <p className="cp-count">
              {filtered.length} cours {search ? "trouvé(s)" : "disponible(s)"}
            </p>
          ) : null}
        </div>

        {error ? <p className="error-banner">{error}</p> : null}

        <div className={`cp-grid ${!loading ? "stagger" : ""}`}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)
            : filtered.length === 0
              ? (
                  <div className="cp-empty">
                    <span>🔍</span>
                    <p>Aucun cours ne correspond à votre recherche.</p>
                    <button type="button" className="btn btn--outline" onClick={() => setSearch("")}>
                      Réinitialiser
                    </button>
                  </div>
                )
              : filtered.map((course, i) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    style={{ animationDelay: `${i * 60}ms` }}
                    coursesBasePath="/consultant/courses"
                  />
                ))}
        </div>
      </main>
    </div>
  );
};

export default CoursesPage;
