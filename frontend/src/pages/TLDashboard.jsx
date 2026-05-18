import { Link } from "react-router-dom";
import NavbarTL from "../components/NavbarTL.jsx";
import Footer from "../components/Footer.jsx";
import { useAuth } from "../auth/AuthContext.js";
import "./TLDashboard.css";

function TLDashboard() {
  const { user } = useAuth();

  const cards = [
    {
      title: "Gestion des Cours",
      desc: "Créez, modifiez et gérez votre catalogue de formations pour vos équipes.",
      icon: "📚",
      path: "/tl/courses",
    },
    {
      title: "Mes Groupes",
      desc: "Organisez vos consultants en groupes et suivez leurs affectations.",
      icon: "👥",
      path: "/tl/groups",
    },
    {
      title: "Statistiques",
      desc: "Analysez la progression et l'engagement de vos consultants en temps réel.",
      icon: "📊",
      path: "/tl/stats",
    },
    {
      title: "Mon Profil",
      desc: "Gérez vos informations personnelles et vos paramètres de compte.",
      icon: "👤",
      path: "/tl/profile",
    },
  ];

  const quickStats = [
    { label: "Cours Actifs", value: "12", icon: "📖" },
    { label: "Consultants", value: "48", icon: "👨‍💻" },
    { label: "Groupes", value: "5", icon: "🏛️" },
    { label: "Taux de réussite", value: "85%", icon: "🏆" },
  ];

  return (
    <div className="tld-wrapper">
      <NavbarTL />
      
      <div className="tld-container">
        <div className="tld-bg-blob blob-1"></div>
        <div className="tld-bg-blob blob-2"></div>
        
        <header className="tld-header">
          <h1 className="tld-title">Bonjour, {user?.name || "Team Leader"} 👋</h1>
          <p className="tld-subtitle">
            Voici un aperçu de vos activités et de la progression de vos équipes aujourd'hui.
          </p>
        </header>

        {/* Quick Stats Row */}
        <div className="tld-stats-row">
          {quickStats.map((stat, i) => (
            <div key={i} className="tld-stat-mini">
              <span className="tld-stat-icon">{stat.icon}</span>
              <div className="tld-stat-info">
                <h4>{stat.label}</h4>
                <p>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Navigation Grid */}
        <div className="tld-grid">
          {cards.map((card, index) => (
            <Link key={index} to={card.path} className="tld-card">
              <div className="tld-icon-wrapper">{card.icon}</div>
              <h2 className="tld-card-title">{card.title}</h2>
              <p className="tld-card-desc">{card.desc}</p>
            </Link>
          ))}
        </div>

        {/* Secondary Content Section */}
        <div className="tld-secondary">
          <div className="tld-recent-activity">
            <h3 className="tld-section-title">Activités Récentes</h3>
            <div className="tld-recent-list">
              <div className="tld-recent-item">
                <div className="tld-item-dot"></div>
                <div className="tld-item-text">
                  <strong>Nouveau cours assigné</strong>
                  <span>Le groupe "React Experts" a commencé le cours "Advanced Patterns".</span>
                </div>
              </div>
              <div className="tld-recent-item">
                <div className="tld-item-dot"></div>
                <div className="tld-item-text">
                  <strong>Progression enregistrée</strong>
                  <span>Marc Lefebvre a terminé le chapitre 4 du cours "Architecture Cloud".</span>
                </div>
              </div>
              <div className="tld-recent-item">
                <div className="tld-item-dot"></div>
                <div className="tld-item-text">
                  <strong>Groupe créé</strong>
                  <span>Vous avez créé le nouveau groupe "Onboarding 2024".</span>
                </div>
              </div>
            </div>
          </div>

          <div className="tld-tips">
            <h3 className="tld-section-title">Astuce du jour</h3>
            <div className="tld-tips-card">
              <h3>💡 Boostez l'engagement</h3>
              <p>
                Assigner des cours par petits groupes permet un meilleur suivi et encourage les échanges entre consultants.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default TLDashboard;