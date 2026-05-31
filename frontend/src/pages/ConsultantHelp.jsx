import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ConsultantHelp.css";

const sections = [
  {
    id: "dashboard",
    icon: "🏠",
    title: "Tableau de Bord",
    subtitle: "Votre point de départ",
    color: "#3b9eff",
    steps: [
      {
        step: 1,
        title: "Accéder au tableau de bord",
        description: "Après votre connexion, vous arrivez automatiquement sur votre tableau de bord. Vous y trouvez un résumé de votre activité : les cours disponibles, vos cours obligatoires et votre taux de progression global.",
        tip: "Le tableau de bord se met à jour automatiquement dès que vous terminez un chapitre."
      },
      {
        step: 2,
        title: "Lire vos statistiques rapides",
        description: "Les cartes colorées en haut de la page vous indiquent en un coup d'œil : le nombre de cours disponibles, combien sont obligatoires, et votre pourcentage de progression.",
        tip: null
      },
      {
        step: 3,
        title: "Naviguer dans l'application",
        description: "Utilisez la barre de navigation en haut pour accéder aux différentes sections : Accueil, Courses, Groupe, Statistique et votre Profil.",
        tip: "La section active est mise en évidence dans la navigation."
      }
    ],
    imgSrc: "/help/dashboard.png",
    imgAlt: "Tableau de bord consultant"
  },
  {
    id: "courses",
    icon: "📚",
    title: "Mes Cours",
    subtitle: "Accéder et suivre vos formations",
    color: "#8b5cf6",
    steps: [
      {
        step: 1,
        title: "Parcourir le catalogue",
        description: "Cliquez sur \"Courses\" dans la navigation. Vous verrez tous les cours publics disponibles sur la plateforme, affichés sous forme de cartes avec le titre, la durée et le nombre de chapitres.",
        tip: null
      },
      {
        step: 2,
        title: "Ouvrir un cours",
        description: "Cliquez sur le bouton \"Ouvrir le cours\" d'une carte pour accéder à son contenu. Vous verrez la liste de tous les chapitres disponibles.",
        tip: "Les cours marqués comme obligatoires apparaissent avec un badge spécial. Assurez-vous de les compléter en priorité !"
      },
      {
        step: 3,
        title: "Naviguer dans les chapitres",
        description: "À l'intérieur d'un cours, cliquez sur chaque chapitre pour accéder à son contenu : vidéos, PDFs, images ou liens externes.",
        tip: null
      },
      {
        step: 4,
        title: "Marquer comme terminé",
        description: "Après avoir visionné le contenu d'un chapitre, cliquez sur le bouton \"Marquer comme terminé\" pour enregistrer votre progression. Votre taux d'avancement se mettra à jour automatiquement.",
        tip: "Votre progression est sauvegardée automatiquement, vous pouvez reprendre là où vous en étiez à tout moment."
      }
    ],
    imgSrc: "/help/courses.png",
    imgAlt: "Page des cours"
  },
  {
    id: "groupe",
    icon: "🏢",
    title: "Mes Groupes",
    subtitle: "Accéder aux formations de votre équipe",
    color: "#10b981",
    steps: [
      {
        step: 1,
        title: "Accéder à vos groupes",
        description: "Cliquez sur \"Groupe\" dans la navigation. Vous verrez la liste de tous les groupes auxquels votre Team Leader vous a assigné.",
        tip: null
      },
      {
        step: 2,
        title: "Rechercher un groupe",
        description: "Utilisez la barre de recherche en haut de la page pour trouver rapidement un groupe par son nom. La recherche se fait en temps réel dès que vous tapez.",
        tip: "Très utile si vous faites partie de plusieurs groupes de formation."
      },
      {
        step: 3,
        title: "Explorer les cours du groupe",
        description: "À l'intérieur d'un groupe, vous trouverez deux types de contenus : les Cours Individuels assignés directement, et les Packages de Cours regroupant plusieurs formations thématiques.",
        tip: null
      },
      {
        step: 4,
        title: "Ouvrir un cours de groupe",
        description: "Cliquez sur \"Ouvrir le cours\" ou \"Ouvrir le cours personnalisé\" pour accéder au contenu. Les cours de packages peuvent avoir des chapitres personnalisés par votre Team Leader.",
        tip: "Les cours dans un package peuvent être différents du même cours en version publique — votre Team Leader peut masquer certains chapitres selon votre niveau."
      }
    ],
    imgSrc: "/help/groups.png",
    imgAlt: "Page des groupes"
  },
  {
    id: "statistique",
    icon: "📊",
    title: "Mes Statistiques",
    subtitle: "Suivre votre progression détaillée",
    color: "#f59e0b",
    steps: [
      {
        step: 1,
        title: "Voir votre progression globale",
        description: "La page Statistique affiche votre taux de complétion global sur tous vos cours. Un graphique circulaire vous montre visuellement votre avancement.",
        tip: null
      },
      {
        step: 2,
        title: "Progression par cours",
        description: "Faites défiler la page pour voir le détail de votre progression pour chaque cours : nombre de chapitres complétés sur le total, et pourcentage d'avancement.",
        tip: "Les cours avec 100% de progression sont marqués avec un badge de complétion vert."
      },
      {
        step: 3,
        title: "Cours obligatoires vs optionnels",
        description: "La page distingue vos cours obligatoires (prioritaires) de vos cours optionnels. Concentrez-vous d'abord sur les cours obligatoires pour satisfaire aux exigences de votre formation.",
        tip: null
      }
    ],
    imgSrc: "/help/stats.png",
    imgAlt: "Page des statistiques"
  },
  {
    id: "profil",
    icon: "👤",
    title: "Mon Profil",
    subtitle: "Gérer vos informations personnelles",
    color: "#ef4444",
    steps: [
      {
        step: 1,
        title: "Accéder à votre profil",
        description: "Cliquez sur \"Profile\" en haut à droite de la navigation. Vous pouvez y consulter vos informations personnelles : nom, prénom, email, niveau et GGID.",
        tip: null
      },
      {
        step: 2,
        title: "Informations affichées",
        description: "Votre profil affiche : votre photo de profil (si configurée), votre rôle dans la plateforme (Consultant), votre niveau, et si votre reconnaissance faciale est enregistrée.",
        tip: "Votre rôle et votre GGID sont définis par l'administrateur et ne peuvent pas être modifiés directement."
      }
    ],
    imgSrc: "/help/profile.png",
    imgAlt: "Page de profil"
  },
  {
    id: "password",
    icon: "🔐",
    title: "Mot de Passe Oublié",
    subtitle: "Réinitialiser votre accès",
    color: "#6366f1",
    steps: [
      {
        step: 1,
        title: "Sur la page de connexion",
        description: "Si vous avez oublié votre mot de passe, cliquez sur le lien \"Mot de passe oublié ?\" sur la page de connexion.",
        tip: null
      },
      {
        step: 2,
        title: "Saisir votre email",
        description: "Entrez l'adresse email associée à votre compte et cliquez sur \"Envoyer\". Un email avec un lien de réinitialisation vous sera envoyé.",
        tip: "Vérifiez votre dossier spam si vous ne recevez pas l'email dans les 2 minutes."
      },
      {
        step: 3,
        title: "Créer un nouveau mot de passe",
        description: "Cliquez sur le lien dans l'email pour accéder au formulaire de réinitialisation. Saisissez votre nouveau mot de passe (minimum 8 caractères recommandé) et confirmez-le.",
        tip: "Le lien de réinitialisation expire après 24h. Si le lien a expiré, recommencez la procédure depuis la page de connexion."
      }
    ],
    imgSrc: "/help/password.png",
    imgAlt: "Réinitialisation du mot de passe"
  }
];

const faqs = [
  {
    question: "Je ne vois aucun cours sur la page Courses. Pourquoi ?",
    answer: "Les cours apparaissent uniquement s'ils sont marqués comme publics par votre Team Leader. Si la page est vide, contactez votre Team Leader pour qu'il vérifie la disponibilité des cours."
  },
  {
    question: "Ma progression ne se sauvegarde pas. Que faire ?",
    answer: "Assurez-vous de cliquer sur le bouton 'Marquer comme terminé' après avoir consulté le contenu de chaque chapitre. La progression se met à jour uniquement sur action manuelle."
  },
  {
    question: "Je n'apparais dans aucun groupe. Est-ce normal ?",
    answer: "Cela signifie que votre Team Leader ne vous a pas encore assigné à un groupe. Contactez-le directement pour être ajouté aux groupes de formation qui vous correspondent."
  },
  {
    question: "Quelle est la différence entre un cours public et un cours de groupe ?",
    answer: "Les cours publics sont accessibles à tous les consultants via la page 'Courses'. Les cours de groupe sont des formations privées accessibles uniquement aux membres d'un groupe spécifique, via la page 'Groupe'."
  },
  {
    question: "Comment contacter mon Team Leader ?",
    answer: "La plateforme n'intègre pas de messagerie interne. Utilisez vos canaux de communication habituels (email professionnel, Slack, Teams, etc.) pour contacter votre Team Leader."
  }
];

export default function ConsultantHelp() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const navigate = useNavigate();

  const currentSection = sections.find(s => s.id === activeSection);

  const filteredSections = searchQuery
    ? sections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.steps.some(st => st.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : sections;

  return (
    <div className="help-page page-enter">
      {/* HEADER */}
      <div className="help-header">
        <div className="help-header-content">
          <div className="help-badge">📖 Guide Utilisateur</div>
          <h1 className="help-title">Centre d'Aide</h1>
          <p className="help-desc">
            Tout ce dont vous avez besoin pour maîtriser la plateforme LMS rapidement et efficacement.
          </p>
          <div className="help-search-wrap">
            <span className="help-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Rechercher dans le guide..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="help-search-input"
            />
            {searchQuery && (
              <button className="help-search-clear" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>
        </div>
        <div className="help-header-illustration">❓</div>
      </div>

      <div className="help-body">
        {/* SIDEBAR NAVIGATION */}
        <aside className="help-sidebar">
          <p className="help-sidebar-label">SECTIONS</p>
          {(searchQuery ? filteredSections : sections).map(section => (
            <button
              key={section.id}
              className={`help-nav-item ${activeSection === section.id ? "help-nav-item--active" : ""}`}
              onClick={() => { setActiveSection(section.id); setSearchQuery(""); }}
              style={{ "--section-color": section.color }}
            >
              <span className="help-nav-icon">{section.icon}</span>
              <div className="help-nav-text">
                <span className="help-nav-title">{section.title}</span>
                <span className="help-nav-sub">{section.subtitle}</span>
              </div>
              <span className="help-nav-arrow">›</span>
            </button>
          ))}

          <div className="help-sidebar-divider" />

          <button
            className={`help-nav-item ${activeSection === "faq" ? "help-nav-item--active" : ""}`}
            onClick={() => setActiveSection("faq")}
            style={{ "--section-color": "#64748b" }}
          >
            <span className="help-nav-icon">💬</span>
            <div className="help-nav-text">
              <span className="help-nav-title">FAQ</span>
              <span className="help-nav-sub">Questions fréquentes</span>
            </div>
            <span className="help-nav-arrow">›</span>
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <main className="help-main">
          {activeSection === "faq" ? (
            <div className="help-section-content">
              <div className="help-section-header" style={{ "--section-color": "#64748b" }}>
                <span className="help-section-emoji">💬</span>
                <div>
                  <h2 className="help-section-title">Questions Fréquentes</h2>
                  <p className="help-section-subtitle">Réponses aux questions les plus posées</p>
                </div>
              </div>

              <div className="help-faq-list">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className={`help-faq-item ${expandedFaq === index ? "help-faq-item--open" : ""}`}
                  >
                    <button
                      className="help-faq-question"
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    >
                      <span>{faq.question}</span>
                      <span className="help-faq-chevron">{expandedFaq === index ? "▲" : "▼"}</span>
                    </button>
                    {expandedFaq === index && (
                      <div className="help-faq-answer">{faq.answer}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : currentSection ? (
            <div className="help-section-content">
              {/* Section Header */}
              <div className="help-section-header" style={{ "--section-color": currentSection.color }}>
                <span className="help-section-emoji">{currentSection.icon}</span>
                <div>
                  <h2 className="help-section-title">{currentSection.title}</h2>
                  <p className="help-section-subtitle">{currentSection.subtitle}</p>
                </div>
              </div>

              {/* Steps */}
              <div className="help-steps">
                {currentSection.steps.map((step) => (
                  <div key={step.step} className="help-step">
                    <div className="help-step-number" style={{ background: currentSection.color }}>
                      {step.step}
                    </div>
                    <div className="help-step-content">
                      <h3 className="help-step-title">{step.title}</h3>
                      <p className="help-step-desc">{step.description}</p>
                      {step.tip && (
                        <div className="help-tip">
                          <span className="help-tip-icon">💡</span>
                          <span>{step.tip}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="help-quick-actions">
                <p className="help-quick-label">Accès rapide :</p>
                {currentSection.id === "dashboard" && (
                  <button className="help-quick-btn" onClick={() => navigate("/consultant/dashboard")}>
                    → Aller au Tableau de Bord
                  </button>
                )}
                {currentSection.id === "courses" && (
                  <button className="help-quick-btn" onClick={() => navigate("/consultant/courses")}>
                    → Voir mes Cours
                  </button>
                )}
                {currentSection.id === "groupe" && (
                  <button className="help-quick-btn" onClick={() => navigate("/consultant/groupe")}>
                    → Voir mes Groupes
                  </button>
                )}
                {currentSection.id === "statistique" && (
                  <button className="help-quick-btn" onClick={() => navigate("/consultant/statistique")}>
                    → Voir mes Statistiques
                  </button>
                )}
                {currentSection.id === "profil" && (
                  <button className="help-quick-btn" onClick={() => navigate("/consultant/profile")}>
                    → Aller à mon Profil
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="help-no-result">
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>🔍</div>
              <p>Aucune section ne correspond à "<strong>{searchQuery}</strong>".</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
