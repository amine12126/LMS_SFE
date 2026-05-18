import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { consultantCourseService } from "../services/api";
import "./ConsultantDashboard.css";

export default function ConsultantDashboard() {
  const { user } = useAuth();
  const [courseCount, setCourseCount] = useState(0);

  useEffect(() => {
    // Fetch courses to get the total count
    consultantCourseService
      .browse()
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.results ?? [];
        setCourseCount(list.length);
      })
      .catch(() => {});
  }, []);

  const heroName = user?.prenom || user?.nom || user?.email || "Consultant";

  return (
    <div className="consultant-dashboard">
      <div className="dashboard-hero">
        <div className="dashboard-hero__content">
          <h1 className="dashboard-title">Bienvenue, {heroName}</h1>
          <p className="dashboard-subtitle">
            C'est votre espace de travail. Suivez vos cours, participez à vos groupes et analysez vos progrès en un seul endroit.
          </p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon courses">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{courseCount}</span>
            <span className="stat-label">Cours Disponibles</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon groups">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">1</span>
            <span className="stat-label">Mes Groupes</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon activity">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">85%</span>
            <span className="stat-label">Taux d'activité</span>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: "1.5rem", color: "#0f172a", marginBottom: "20px", marginTop: "40px" }}>
        Accès Rapide
      </h2>
      <div className="dashboard-actions">
        <Link to="/consultant/courses" className="action-card">
          <h3 className="action-title">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Explorer les cours
          </h3>
          <p className="action-desc">
            Découvrez les nouveaux modules, continuez votre apprentissage et développez vos compétences.
          </p>
          <span className="action-btn">Voir les cours →</span>
        </Link>

        <Link to="/consultant/groupe" className="action-card">
          <h3 className="action-title">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Mon Groupe
          </h3>
          <p className="action-desc">
            Collaborez avec votre équipe, suivez les missions communes et partagez vos avancées.
          </p>
          <span className="action-btn">Voir le groupe →</span>
        </Link>

        <Link to="/consultant/statistique" className="action-card">
          <h3 className="action-title">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Mes Statistiques
          </h3>
          <p className="action-desc">
            Analysez votre progression détaillée, le temps passé et vos réussites aux quiz.
          </p>
          <span className="action-btn">Voir mes stats →</span>
        </Link>
      </div>
    </div>
  );
}
