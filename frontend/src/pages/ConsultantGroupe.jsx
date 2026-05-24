import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { consultantCourseService } from "../services/api.js";
import FaceVerificationModal from "../components/FaceVerification/FaceVerificationModal";
import { useAuth } from "../auth/AuthContext";
import API from "../api/axios";
import "./ConsultantGroupe.css";

// 💡 Pour réactiver Face ID, mets cette constante à true.
const USE_FACE_ID = false;

const PasswordVerificationModal = ({ onSuccess, onClose }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      API.get("auth/profile/")
        .then(res => {
          if (res.data?.email) {
            setEmail(res.data.email);
          }
        })
        .catch(console.error);
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Impossible de récupérer l'adresse email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await API.post("auth/login/", { email, password });
      onSuccess();
    } catch (err) {
      setError("Mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "#fff", padding: "30px", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
        <h2 style={{ marginBottom: "15px", color: "#1a1410", fontSize: "1.4rem" }}>🔐 Sécurité du Groupe</h2>
        <p style={{ marginBottom: "20px", color: "#64748b", fontSize: "0.95rem" }}>Veuillez confirmer votre mot de passe pour accéder aux contenus confidentiels de ce groupe.</p>
        
        {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px", borderRadius: "6px", marginBottom: "16px", fontSize: "0.9rem" }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input 
            type="password" 
            placeholder="Votre mot de passe" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "12px", border: "1px solid #cbd5e1", borderRadius: "8px", marginBottom: "20px", fontSize: "16px" }}
            autoFocus
          />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 16px", background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontWeight: "600" }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ padding: "10px 16px", background: "#3b9eff", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              {loading ? "Vérification..." : "Déverrouiller"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
                <div>
                  {/* COURS DIRECTS */}
                  <h3 style={{ fontSize: "1.1rem", marginTop: "24px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>📚 Cours Individuels</h3>
                  {group.courses.length === 0 ? (
                    <p style={{ color: "var(--ink-3)", fontStyle: "italic", marginTop: "8px" }}>Aucun cours individuel assigné.</p>
                  ) : (
                    <div className="cg-courses-grid" style={{ marginTop: "12px" }}>
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
                  )}

                  {/* PACKAGES DE COURS */}
                  <h3 style={{ fontSize: "1.1rem", marginTop: "32px", color: "var(--ink)", display: "flex", alignItems: "center", gap: "8px" }}>🗂️ Packages de Cours</h3>
                  {!group.packages || group.packages.length === 0 ? (
                    <p style={{ color: "var(--ink-3)", fontStyle: "italic", marginTop: "8px" }}>Aucun package de cours assigné.</p>
                  ) : (
                    group.packages.map(pkg => (
                      <div key={pkg.id} style={{ marginTop: "16px", padding: "20px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-c, rgba(255,255,255,0.1))", borderRadius: "12px" }}>
                        <div style={{ marginBottom: "16px" }}>
                          <h4 style={{ fontSize: "1.15rem", margin: "0 0 4px", color: "#3b9eff" }}>📁 {pkg.name}</h4>
                          <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--ink-3, #aaa)" }}>{pkg.description || "Aucune description disponible pour ce package."}</p>
                        </div>
                        
                        {pkg.courses.length === 0 ? (
                          <p style={{ color: "var(--ink-3)", fontStyle: "italic", margin: 0 }}>Aucun cours dans ce package.</p>
                        ) : (
                          <div className="cg-courses-grid">
                            {pkg.courses.map(course => (
                              <div key={course.id} className="cg-course-card">
                                <h3 className="cg-course-title">{course.title}</h3>
                                <p className="cg-course-desc">{course.description || "Aucune description disponible pour ce cours."}</p>

                                <div className="cg-course-meta">
                                  <span>⏱️ {course.duration || "Non spécifiée"}</span>
                                  <span>📑 {course.chapters_count} chapitres</span>
                                </div>

                                <button
                                  className="cg-btn-open"
                                  onClick={() => navigate(`/consultant/courses/${course.id}?package_id=${pkg.id}`)}
                                >
                                  Ouvrir le cours personnalisé
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {selectedGroupToUnlock && (
        USE_FACE_ID ? (
          <FaceVerificationModal 
            groupId={selectedGroupToUnlock} 
            onSuccess={handleUnlockSuccess} 
            onClose={() => setSelectedGroupToUnlock(null)} 
          />
        ) : (
          <PasswordVerificationModal 
            onSuccess={handleUnlockSuccess} 
            onClose={() => setSelectedGroupToUnlock(null)} 
          />
        )
      )}
    </div>
  );
}

export default ConsultantGroupe;
