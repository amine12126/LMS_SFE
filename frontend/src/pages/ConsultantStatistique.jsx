import { useEffect, useState } from "react";
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

// ── Bloc générique ──────────────────────────────────────────
function SectionBlock({ icon, title, accentColor, borderColor, children, emptyMsg }) {
  return (
    <div className="cs-block" style={{ borderLeftColor: accentColor }}>
      <div className="cs-block-header" style={{ background: `${accentColor}15` }}>
        <span style={{ fontSize: "1.6rem" }}>{icon}</span>
        <h2 className="cs-block-title" style={{ color: accentColor }}>{title}</h2>
      </div>
      <div className="cs-block-body">
        {children || (
          <div className="cs-empty" style={{ border: `1px dashed ${accentColor}40` }}>
            {emptyMsg}
          </div>
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

  const kpis           = data?.kpis           || {};
  const publicCourses  = data?.public_courses  || [];
  const mandatoryCourses = data?.mandatory_courses || [];
  const groups         = data?.groups          || [];
  const timeline       = data?.timeline        || [];

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
        {/* COLONNE PRINCIPALE : 3 blocs */}
        <div className="cs-main">

          {/* ── BLOC 1 : COURS PUBLICS ── */}
          <SectionBlock
            icon="🌐"
            title="Cours Publics"
            accentColor="#3b9eff"
            emptyMsg="Vous n'avez pas encore commencé de cours publics."
          >
            {publicCourses.length > 0 && (
              <div className="cs-courses-grid">
                {publicCourses.map(course => (
                  <div key={course.id} style={{ position: "relative" }}>
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            )}
          </SectionBlock>

          {/* ── BLOC 2 : COURS OBLIGATOIRES ── */}
          <SectionBlock
            icon="⚠️"
            title="Cours Obligatoires"
            accentColor="#f59e0b"
            emptyMsg="Aucun cours obligatoire assigné pour le moment."
          >
            {mandatoryCourses.length > 0 && (
              <div className="cs-courses-grid">
                {mandatoryCourses.map(course => (
                  <div key={course.id} style={{ position: "relative" }}>
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            )}
          </SectionBlock>

          {/* ── BLOC 3 : GROUPES ── */}
          <SectionBlock
            icon="🏢"
            title="Groupes"
            accentColor="#7c3aed"
            emptyMsg="Vous n'appartenez à aucun groupe pour le moment."
          >
            {groups.length > 0 && groups.map(group => (
              <div key={group.id} className="cs-group-block">
                <div className="cs-group-name">
                  <span>📁</span> {group.name}
                </div>

                {/* Sous-bloc : Cours du groupe */}
                <div className="cs-subblock">
                  <div className="cs-subblock-label" style={{ color: "#3b9eff" }}>
                    📚 Cours du groupe
                  </div>
                  {group.courses.length === 0 ? (
                    <p className="cs-sub-empty">Aucun cours individuel dans ce groupe.</p>
                  ) : (
                    <div className="cs-courses-grid">
                      {group.courses.map(course => (
                        <div key={course.id} style={{ position: "relative" }}>
                          <CourseCard course={course} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sous-bloc : Packages du groupe */}
                <div className="cs-subblock">
                  <div className="cs-subblock-label" style={{ color: "#7c3aed" }}>
                    🗂️ Packages de cours
                  </div>
                  {group.packages.length === 0 ? (
                    <p className="cs-sub-empty">Aucun package de cours dans ce groupe.</p>
                  ) : (
                    group.packages.map(pkg => (
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
            ))}
          </SectionBlock>

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
