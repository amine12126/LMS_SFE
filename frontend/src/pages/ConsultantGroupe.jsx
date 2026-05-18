import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { consultantCourseService } from "../services/api.js";
import FaceVerificationModal from "../components/FaceVerification/FaceVerificationModal";
import "./ConsultantGroupe.css";

function ConsultantGroupe() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Nouveaux états pour la reconnaissance faciale
  const [unlockedGroups, setUnlockedGroups] = useState({});
  const [selectedGroupToUnlock, setSelectedGroupToUnlock] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    consultantCourseService.getMyGroups()
      .then(res => setGroups(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="cg-page">
        <div className="cg-spinner-wrap"><div className="cg-spinner"></div></div>
      </div>
    );
  }

  const handleUnlockSuccess = () => {
    setUnlockedGroups(prev => ({ ...prev, [selectedGroupToUnlock]: true }));
    setSelectedGroupToUnlock(null);
  };

  return (
    <div className="cg-page page-enter">
      <div className="cg-header">
        <h1 className="cg-title">Mes Groupes</h1>
        <p className="cg-desc">Retrouvez ici les groupes auxquels vous appartenez et les cours qui vous ont été spécifiquement assignés par votre Team Leader.</p>
      </div>

      {groups.length === 0 ? (
        <div className="cg-empty">
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🏢</div>
          Vous n'appartenez à aucun groupe pour le moment.
        </div>
      ) : (
        groups.map(group => {
          const isUnlocked = unlockedGroups[group.id];

          return (
            <div key={group.id} className="cg-group-block">
              <div className="cg-group-header">
                <h2 className="cg-group-name">📁 {group.name}</h2>
                <div className="cg-group-tl">
                  <span>👤 Assigné par :</span>
                  <strong>{group.created_by}</strong>
                </div>
              </div>

              {!isUnlocked ? (
                <div style={{ textAlign: "center", padding: "30px", background: "var(--surface-color, rgba(255,255,255,0.05))", borderRadius: "12px", marginTop: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <p style={{ marginBottom: "16px", color: "var(--ink-2, #ccc)", fontSize: "15px" }}>Ce groupe est sécurisé. Vous devez vérifier votre identité avec votre visage pour y accéder.</p>
                  <button 
                    onClick={() => setSelectedGroupToUnlock(group.id)}
                    style={{ padding: "12px 24px", background: "#3b9eff", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                  >
                    🔐 Déverrouiller le groupe
                  </button>
                </div>
              ) : (
                group.courses.length === 0 ? (
                  <p style={{ color: "var(--ink-3)", fontStyle: "italic", marginTop: "16px" }}>Aucun cours n'est assigné à ce groupe pour le moment.</p>
                ) : (
                  <div className="cg-courses-grid" style={{ marginTop: "16px" }}>
                    {group.courses.map(course => (
                      <div key={course.id} className="cg-course-card">
                        <h3 className="cg-course-title">{course.title}</h3>
                        <p className="cg-course-desc">{course.description || "Aucune description disponible pour ce cours."}</p>
                        
                        <div className="cg-course-meta">
                          <span>⏱️ {course.duration || "Non spécifiée"}</span>
                          <span>📑 {course.chapters_count} chapitres</span>
                        </div>
                        
                        <button 
                          className="cg-btn-open"
                          onClick={() => navigate(`/consultant/courses/${course.id}`)}
                        >
                          Ouvrir le cours
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          );
        })
      )}

      {selectedGroupToUnlock && (
        <FaceVerificationModal 
          groupId={selectedGroupToUnlock} 
          onSuccess={handleUnlockSuccess} 
          onClose={() => setSelectedGroupToUnlock(null)} 
        />
      )}
    </div>
  );
}

export default ConsultantGroupe;
