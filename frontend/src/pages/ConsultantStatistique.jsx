import { useEffect, useState, useMemo } from "react";
import { consultantCourseService } from "../services/api.js";
import "./ConsultantStatistique.css";

function formatDate(dateString) {
  if (!dateString) return "Date inconnue";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date);
}

function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  return `Il y a ${Math.floor(diff / 86400)} j`;
}

// ── Barre de recherche ──────────────────────────────────────
function SearchBar({ value, onChange, placeholder = "Rechercher un cours..." }) {
  return (
    <div className="cs-search-wrap">
      <span className="cs-search-icon">🔍</span>
      <input
        className="cs-search-input"
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button className="cs-search-clear" onClick={() => onChange("")}>✕</button>
      )}
    </div>
  );
}

// ── Carte de progression individuelle ──────────────────────
function CourseCard({ course }) {
  return (
    <div className="cs-course-card">
      {course.is_complete && (
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "var(--moss, #4a6741)", color: "#fff",
          fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px",
          borderRadius: "20px", letterSpacing: "0.05em"
        }}>✓ Terminé</div>
      )}
      <h3 className="cs-course-title">{course.title}</h3>
      <div className="cs-course-stats">
        <span>Progression</span>
        <span style={{ color: course.progress === 100 ? "var(--moss)" : "var(--terra)" }}>
          {course.progress}%
        </span>
      </div>
      <div className="cs-prog-bar">
        <div
          className={`cs-prog-fill ${course.progress === 100 ? "cs-prog-fill--full" : ""}`}
          style={{ width: `${course.progress}%` }}
        />
      </div>
      <div className="cs-course-stats" style={{ color: "var(--ink-3)", fontSize: "0.85rem", marginBottom: 12 }}>
        <span>{course.chapters_completed} / {course.chapters_total} chapitres</span>
      </div>
      <div className="cs-course-date">
        Dernière activité : {course.last_activity ? formatDate(course.last_activity) : "Jamais"}
      </div>
    </div>
  );
}

// ── Grille de cours filtrée ─────────────────────────────────
function CourseGrid({ courses, query }) {
  const filtered = useMemo(() =>
    query.trim()
      ? courses.filter(c => c.title.toLowerCase().includes(query.toLowerCase()))
      : courses,
    [courses, query]
  );

  if (filtered.length === 0) {
    return (
      <div className="cs-empty" style={{ padding: "20px", fontSize: "0.9rem" }}>
        {query ? `Aucun cours trouvé pour "${query}".` : "Aucun cours disponible."}
      </div>
    );
  }

  return (
    <div className="cs-courses-grid">
      {filtered.map(course => (
        <div key={course.id} style={{ position: "relative" }}>
          <CourseCard course={course} />
        </div>
      ))}
    </div>
  );
}

// ── Bloc générique avec barre de recherche ─────────────────
function SectionBlock({ icon, title, accentColor, courses, emptyMsg, children }) {
  const [query, setQuery] = useState("");

  return (
    <div className="cs-block" style={{ borderLeftColor: accentColor }}>
      <div className="cs-block-header" style={{ background: `${accentColor}15` }}>
        <span style={{ fontSize: "1.6rem" }}>{icon}</span>
        <h2 className="cs-block-title" style={{ color: accentColor }}>{title}</h2>
        {courses && courses.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: accentColor, fontWeight: 700 }}>
            {courses.length} cours
          </span>
        )}
      </div>

      <div className="cs-block-body">
        {/* Barre de recherche si des cours existent */}
        {courses && courses.length > 0 && (
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={`Rechercher dans ${title.toLowerCase()}...`}
          />
        )}

        {courses ? (
          courses.length === 0 ? (
            <div className="cs-empty">{emptyMsg}</div>
          ) : (
            <CourseGrid courses={courses} query={query} />
          )
        ) : children}
      </div>
    </div>
  );
}

// ── Bloc Groupes (avec recherche par groupe) ────────────────
function GroupsBlock({ groups }) {
  const [globalQuery, setGlobalQuery] = useState("");

  return (
    <div className="cs-block" style={{ borderLeftColor: "#7c3aed" }}>
      <div className="cs-block-header" style={{ background: "#7c3aed15" }}>
        <span style={{ fontSize: "1.6rem" }}>🏢</span>
        <h2 className="cs-block-title" style={{ color: "#7c3aed" }}>Groupes</h2>
        {groups.length > 0 && (
          <span style={{ marginLeft: "auto", fontSize: "0.82rem", color: "#7c3aed", fontWeight: 700 }}>
            {groups.length} groupe{groups.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="cs-block-body">
        {groups.length === 0 ? (
          <div className="cs-empty">Vous n'appartenez à aucun groupe pour le moment.</div>
        ) : (
          <>
            {/* Recherche globale dans tous les groupes */}
            <SearchBar
              value={globalQuery}
              onChange={setGlobalQuery}
              placeholder="Rechercher un cours dans tous les groupes..."
            />

            {groups.map(group => {
              // Filtrer cours et packages selon la recherche
              const filteredCourses = globalQuery
                ? group.courses.filter(c => c.title.toLowerCase().includes(globalQuery.toLowerCase()))
                : group.courses;

              const filteredPackages = group.packages.map(pkg => ({
                ...pkg,
                courses: globalQuery
                  ? pkg.courses.filter(c => c.title.toLowerCase().includes(globalQuery.toLowerCase()))
                  : pkg.courses
              })).filter(pkg => !globalQuery || pkg.courses.length > 0);

              if (globalQuery && filteredCourses.length === 0 && filteredPackages.length === 0) return null;

              return (
                <div key={group.id} className="cs-group-block">
                  <div className="cs-group-name">
                    <span>📁</span> {group.name}
                  </div>

                  {/* Sous-bloc : Cours directs */}
                  <div className="cs-subblock">
                    <div className="cs-subblock-label" style={{ color: "#3b9eff" }}>
                      📚 Cours du groupe
                    </div>
                    {filteredCourses.length === 0 ? (
                      <p className="cs-sub-empty">
                        {globalQuery ? `Aucun résultat pour "${globalQuery}".` : "Aucun cours individuel dans ce groupe."}
                      </p>
                    ) : (
                      <div className="cs-courses-grid">
                        {filteredCourses.map(course => (
                          <div key={course.id} style={{ position: "relative" }}>
                            <CourseCard course={course} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sous-bloc : Packages */}
                  <div className="cs-subblock">
                    <div className="cs-subblock-label" style={{ color: "#7c3aed" }}>
                      🗂️ Packages de cours
                    </div>
                    {filteredPackages.length === 0 ? (
                      <p className="cs-sub-empty">
                        {globalQuery ? `Aucun résultat pour "${globalQuery}".` : "Aucun package de cours dans ce groupe."}
                      </p>
                    ) : (
                      filteredPackages.map(pkg => (
                        <div key={pkg.id} className="cs-package-block">
                          <div className="cs-package-header">
                            <span style={{ fontSize: "1.2rem" }}>📦</span>
                            <div>
                              <strong>{pkg.name}</strong>
                              {pkg.description && (
                                <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--ink-3)" }}>
                                  {pkg.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {pkg.courses.length === 0 ? (
                            <p className="cs-sub-empty">Aucun cours commencé dans ce package.</p>
                          ) : (
                            <div className="cs-courses-grid">
                              {pkg.courses.map(course => (
                                <div key={course.id} style={{ position: "relative" }}>
                                  <CourseCard course={course} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// ── Page principale ─────────────────────────────────────────
function ConsultantStatistique() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    consultantCourseService.getStats()
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="cs-page">
        <div className="cs-spinner-wrap"><div className="cs-spinner" /></div>
      </div>
    );
  }

  const kpis             = data?.kpis             || {};
  const publicCourses    = data?.public_courses    || [];
  const mandatoryCourses = data?.mandatory_courses || [];
  const groups           = data?.groups            || [];
  const timeline         = data?.timeline          || [];

  return (
    <div className="cs-page page-enter">
      {/* Header */}
      <div className="cs-header">
        <h1 className="cs-title">Mes Statistiques</h1>
        <p className="cs-desc">Suivez votre progression et vos dernières activités d'apprentissage.</p>
      </div>

      {/* KPIs */}
      <div className="cs-kpi-grid">
        <div className="cs-kpi-card">
          <div className="cs-kpi-val">{kpis.total_courses || 0}</div>
          <div className="cs-kpi-label">Cours entamés</div>
        </div>
        <div className="cs-kpi-card" style={{ '--terra': 'var(--moss)' }}>
          <div className="cs-kpi-val">{kpis.completed_courses || 0}</div>
          <div className="cs-kpi-label">Cours terminés</div>
        </div>
        <div className="cs-kpi-card" style={{ '--terra': '#60a5fa' }}>
          <div className="cs-kpi-val">{kpis.total_chapters_viewed || 0}</div>
          <div className="cs-kpi-label">Chapitres consultés</div>
        </div>
        <div className="cs-kpi-card" style={{ '--terra': '#f59e0b' }}>
          <div className="cs-kpi-val">{kpis.total_chapters_completed || 0}</div>
          <div className="cs-kpi-label">Chapitres validés</div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="cs-layout">
        <div className="cs-main">

          {/* ── BLOC 1 : COURS PUBLICS ── */}
          <SectionBlock
            icon="🌐"
            title="Cours Publics"
            accentColor="#3b9eff"
            courses={publicCourses}
            emptyMsg="Aucun cours public disponible pour le moment."
          />

          {/* ── BLOC 2 : COURS OBLIGATOIRES ── */}
          <SectionBlock
            icon="⚠️"
            title="Cours Obligatoires"
            accentColor="#f59e0b"
            courses={mandatoryCourses}
            emptyMsg="Aucun cours obligatoire assigné pour le moment."
          />

          {/* ── BLOC 3 : GROUPES ── */}
          <GroupsBlock groups={groups} />

        </div>

        {/* SIDEBAR : Historique */}
        <div className="cs-side">
          <h2 className="cs-section-title">⏱️ Historique Récent</h2>
          {timeline.length === 0 ? (
            <div className="cs-empty" style={{ background: "transparent", border: "none" }}>
              Aucune activité récente.
            </div>
          ) : (
            <div className="cs-timeline">
              {timeline.map(item => (
                <div key={item.id} className="cs-timeline-item">
                  <div className={`cs-timeline-icon cs-timeline-icon--${item.type}`}>
                    {item.type === "view" ? "👀" : "✅"}
                  </div>
                  <div className="cs-timeline-content">
                    <div className="cs-timeline-date">{timeAgo(item.date)}</div>
                    <p className="cs-timeline-text">
                      {item.type === "view" ? "Vous avez consulté " : "Vous avez validé "}
                      <strong>{item.chapter}</strong> dans le cours <em>{item.course}</em>.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConsultantStatistique;
