import { useEffect, useState } from "react";
import { consultantCourseService } from "../services/api.js";
import "./ConsultantStatistique.css";

function formatDate(dateString) {
  if (!dateString) return "Date inconnue";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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
        <div className="cs-spinner-wrap"><div className="cs-spinner"></div></div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const courses = data?.courses || [];
  const timeline = data?.timeline || [];

  return (
    <div className="cs-page page-enter">
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

        <div className="cs-layout">
          {/* Main - Courses */}
          <div className="cs-main">
            <h2 className="cs-section-title">📚 Ma Progression par Cours</h2>
            {courses.length === 0 ? (
              <div className="cs-empty">Vous n'avez pas encore commencé de cours.</div>
            ) : (
              <div className="cs-courses-grid">
                {courses.map(course => (
                  <div key={course.id} className="cs-course-card">
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
                      ></div>
                    </div>
                    
                    <div className="cs-course-stats" style={{ color: "var(--ink-3)", fontSize: "0.85rem", marginBottom: 12 }}>
                      <span>{course.chapters_completed} / {course.chapters_total} chapitres</span>
                    </div>
                    
                    <div className="cs-course-date">
                      Dernière activité : {course.last_activity ? formatDate(course.last_activity) : "Jamais"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Timeline */}
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
