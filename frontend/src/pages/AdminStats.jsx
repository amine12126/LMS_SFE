import { useEffect, useState } from "react";
import { statsService } from "../services/api.js";
import "./AdminStats.css";

function AdminStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await statsService.getAdminStats();
        setData(res.data);
      } catch (err) {
        console.error("Erreur stats admin:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="adms-page">
      <div className="adms-header">
        <div className="adms-title-wrap">
          <h1 className="adms-title">Intelligence Platforme</h1>
          <p className="adms-desc">Calcul des indicateurs de performance...</p>
        </div>
      </div>
    </div>
  );
  
  if (!data) return <div style={{ padding: 40 }}>Erreur lors du chargement des données.</div>;

  const { tls, global, recent_activity, top_courses } = data;

  const formatDate = (dateStr) => {
    if (!dateStr) return "Aucune activité";
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="adms-page">
      {/* HEADER */}
      <div className="adms-header">
        <div className="adms-title-wrap">
          <h1 className="adms-title">Intelligence Platforme</h1>
          <p className="adms-desc">Vision analytique à 360° des pôles de formation.</p>
        </div>
        <div className="adms-actions">
          <button className="adms-btn-export" onClick={() => window.print()}>
            📄 Rapport PDF
          </button>
          <button className="adms-btn-export" style={{ background: "var(--night)", color: "white", border: "none" }}>
            📥 Data Export
          </button>
        </div>
      </div>

      {/* KPIS */}
      <div className="adms-kpis">
        <div className="adms-kpi-card">
          <span className="adms-kpi-label">Cohorte Globale</span>
          <span className="adms-kpi-value">{global.total_consultants}</span>
          <div className="adms-trend adms-trend--up">↑ {global.trends.consultants} d'actifs</div>
        </div>
        <div className="adms-kpi-card">
          <span className="adms-kpi-label">Catalogue Cours</span>
          <span className="adms-kpi-value">{global.total_courses}</span>
          <div className="adms-trend adms-trend--up">↑ {global.trends.courses} publiés</div>
        </div>
        <div className="adms-kpi-card">
          <span className="adms-kpi-label">Pôles d'Équipes</span>
          <span className="adms-kpi-value">{global.total_groups}</span>
          <div className="adms-trend adms-trend--up" style={{ color: "var(--night)", background: "var(--terra-dim)" }}>
            {tls.length} Leaders actifs
          </div>
        </div>
        <div className="adms-kpi-card">
          <span className="adms-kpi-label">Score Engagement</span>
          <span className="adms-kpi-value">84%</span>
          <div className="adms-trend adms-trend--up">↑ {global.trends.engagement} ce mois</div>
        </div>
      </div>

      {/* DETAILED TL PERFORMANCE */}
      <h2 className="adms-section-title" style={{ marginBottom: 30 }}>Performance Détaillée des Pôles</h2>
      <div className="adms-tl-grid">
        {tls.map(tl => (
          <div key={tl.id} className="adms-tl-card">
            {/* CARD HEADER */}
            <div className="adms-tl-header">
              <div className="adms-tl-profile">
                <div className="adms-tl-avatar">{tl.name.charAt(0)}</div>
                <div className="adms-tl-name-info">
                  <span className="adms-tl-name">{tl.name}</span>
                  <span className="adms-tl-last-act">Dernier succès: {formatDate(tl.last_activity)}</span>
                </div>
              </div>
              <span className={`adms-status-badge adms-status--${tl.status}`}>
                {tl.status}
              </span>
            </div>

            {/* MAIN PROGRESS */}
            <div className="adms-tl-main-progress">
              <div className="adms-prog-label">
                <span>Progression Globale du Pôle</span>
                <span style={{ color: "var(--terra)" }}>{tl.avg_progress}%</span>
              </div>
              <div className="adms-main-bar">
                <div className="adms-main-bar-fill adms-bar-animate" style={{ width: `${tl.avg_progress}%` }}></div>
              </div>
            </div>

            {/* GROUPS SUB-GRID */}
            <div className="adms-groups-section">
              <span className="adms-section-title" style={{ fontSize: "1rem", display: "block", marginBottom: 15 }}>Unités d'Apprentissage</span>
              <div className="adms-groups-grid">
                {tl.groups.map(group => (
                  <div key={group.id} className="adms-group-mini-card">
                    <div className="adms-group-header">
                      <span>{group.name}</span>
                      <span>{group.progress}%</span>
                    </div>
                    <div className="adms-group-bar">
                      <div className="adms-group-bar-fill" style={{ width: `${group.progress}%` }}></div>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--ink-3)", marginTop: 8, fontWeight: 700 }}>
                      {group.cons_count} consultants
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TALENT POOL */}
            <div className="adms-talents-section">
              <span className="adms-section-title" style={{ fontSize: "1rem", display: "block", marginBottom: 15 }}>Top Performeurs</span>
              <div className="adms-members-row">
                {tl.active_members.map(member => (
                  <div key={member.id} className="adms-member-circle">
                    {member.name.charAt(0)}
                    <div className="adms-member-tooltip">
                      {member.name} • {member.completed} chapitres
                    </div>
                  </div>
                ))}
                {tl.consultants_count > tl.active_members.length && (
                  <div className="adms-member-circle" style={{ background: "#f1f5f9", fontSize: "0.65rem" }}>
                    +{tl.consultants_count - tl.active_members.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SECONDARY INSIGHTS */}
      <div className="adms-grid-main" style={{ marginTop: 50 }}>
        {/* TIMELINE */}
        <div className="adms-card">
          <h2 className="adms-section-title">Flux de Succès en Direct</h2>
          <div className="adms-timeline" style={{ marginTop: 30 }}>
            {recent_activity.map(act => (
              <div key={act.id} className="adms-time-item">
                <div className="adms-time-icon"></div>
                <div className="adms-time-content">
                  <div className="adms-time-user">{act.user}</div>
                  <div className="adms-time-action">
                    Succès sur le chapitre <strong>{act.chapter}</strong>
                  </div>
                  <div className="adms-time-meta">{formatDate(act.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RANKINGS */}
        <div className="adms-card">
          <h2 className="adms-section-title">Palmarès des Contenus</h2>
          <div className="adms-course-list" style={{ marginTop: 30 }}>
            {top_courses.map((course, index) => (
              <div key={index} className="adms-course-item">
                <div className="adms-course-info">
                  <span className="adms-course-name">{course.title}</span>
                  <span className="adms-course-enrolls">{course.enrollments} inscrits actifs</span>
                </div>
                <div className="adms-course-rank">{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminStats;
