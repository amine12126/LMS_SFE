import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext.js";
import { statsService } from "../services/api.js";
import "./AdminHome.css";

function AdminHome() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await statsService.getAdminStats();
        setStats(res.data);
      } catch (err) {
        console.error("Erreur dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const actions = [
    { title: "Gérer Utilisateurs", desc: "Ajouter, modifier ou suspendre des TLs et Consultants.", icon: "👥", color: "#eef2ff", path: "/admin/users" },
    { title: "Pôles de Formation", desc: "Créer et superviser les groupes d'apprentissage.", icon: "🏢", color: "#fef2f2", path: "/admin/groups" },
    { title: "Analyses & Rapports", desc: "Consulter les performances globales de la plateforme.", icon: "📊", color: "#f0fdf4", path: "/admin/stats" },
  ];

  if (loading) return <div className="admh-page">Chargement du dashboard...</div>;

  return (
    <div className="admh-page">
      {/* WELCOME SECTION */}
      <div className="admh-welcome">
        <h1 className="admh-greeting">Bonjour, {user?.prenom || "Admin"} 👋</h1>
        <p className="admh-subtitle">Voici un aperçu de l'activité sur votre plateforme aujourd'hui.</p>
      </div>

      {/* QUICK STATS */}
      <div className="admh-stats-row">
        <div className="admh-stat-card">
          <span className="admh-stat-label">Consultants Actifs</span>
          <span className="admh-stat-value">{stats?.global?.total_consultants || 0}</span>
          <div className="admh-stat-chart-mini"><div className="admh-stat-fill" style={{ width: '75%' }}></div></div>
        </div>
        <div className="admh-stat-card admh-stat-card--light">
          <span className="admh-stat-label" style={{ color: "var(--ink-3)" }}>Parcours Créés</span>
          <span className="admh-stat-value">{stats?.global?.total_courses || 0}</span>
          <div className="admh-stat-chart-mini" style={{ background: '#f1f5f9' }}><div className="admh-stat-fill" style={{ width: '45%', background: 'var(--terra)' }}></div></div>
        </div>
        <div className="admh-stat-card" style={{ background: 'var(--grad-terra)' }}>
          <span className="admh-stat-label">Groupes de Travail</span>
          <span className="admh-stat-value">{stats?.global?.total_groups || 0}</span>
          <div className="admh-stat-chart-mini"><div className="admh-stat-fill" style={{ width: '60%' }}></div></div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="admh-actions-grid">
        {actions.map((act, i) => (
          <div key={i} className="admh-action-card" onClick={() => navigate(act.path)}>
            <div className="admh-action-icon" style={{ background: act.color }}>{act.icon}</div>
            <h3 className="admh-action-title">{act.title}</h3>
            <p className="admh-action-desc">{act.desc}</p>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="admh-main-grid">
        {/* RECENT ACTIVITY */}
        <div className="admh-section">
          <div className="admh-section-title">
            Dernières Activités
            <span className="admh-status-dot"></span>
          </div>
          <div className="admh-activity-list">
            {stats?.recent_activity?.slice(0, 5).map((act, i) => (
              <div key={i} className="admh-activity-item">
                <div className="admh-activity-avatar">{act.user.charAt(0)}</div>
                <div className="admh-activity-info">
                  <div className="admh-activity-text">
                    <strong>{act.user}</strong> a validé <em>{act.chapter}</em>
                  </div>
                  <div className="admh-activity-time">{new Date(act.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
            {(!stats?.recent_activity || stats.recent_activity.length === 0) && (
              <p style={{ color: "var(--ink-3)", textAlign: "center", padding: "20px" }}>Aucune activité récente détectée.</p>
            )}
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="admh-side">
          <div className="admh-card-sm">
            <h3 className="admh-card-title-sm">Santé de la Plateforme</h3>
            <div className="admh-metric-row">
              <span>Serveur API</span>
              <span style={{ color: "#22c55e" }}>Opérationnel</span>
            </div>
            <div className="admh-metric-row">
              <span>Stockage Media</span>
              <span>45% utilisé</span>
            </div>
            <div className="admh-metric-row">
              <span>Taux d'Engagement</span>
              <span style={{ color: "var(--terra)" }}>+12% ↑</span>
            </div>
          </div>

          <div className="admh-card-sm" style={{ background: 'var(--night)', color: 'white' }}>
            <h3 className="admh-card-title-sm" style={{ color: 'white' }}>Support & Maintenance</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: 15 }}>Aucune maintenance prévue pour les prochaines 24 heures.</p>
            <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '8px', width: '100%', fontWeight: 700, cursor: 'pointer' }}>
              Voir les logs système
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
