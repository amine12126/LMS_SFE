import { useEffect, useState, useMemo } from "react";
import NavbarTL from "../components/NavbarTL.jsx";
import { statsService, groupService } from "../services/api.js";
import "./TLStats.css";

function TLStats() {
  const [tab, setTab] = useState("public"); // "public" | "group"
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [consultantSearchQuery, setConsultantSearchQuery] = useState("");

  // Charger les groupes au montage
  useEffect(() => {
    groupService.getAll().then(res => {
      setGroups(res.data);
      if (res.data.length > 0) setSelectedGroup(res.data[0].id);
    }).catch(err => console.error(err));
  }, []);

  // Recharger les statistiques si on change d'onglet ou de groupe
  useEffect(() => {
    setLoading(true);
    setSearchQuery("");
    setSelectedCourseId(null);
    setStats([]);

    if (tab === "group" && !selectedGroup) {
      setLoading(false);
      return;
    }

    statsService.getStats(tab, selectedGroup)
      .then(res => {
        setStats(res.data);
        if (res.data.length > 0) {
          setSelectedCourseId(res.data[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [tab, selectedGroup]);

  // Filtrer la liste des cours selon la recherche
  const filteredCourses = useMemo(() => {
    return stats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [stats, searchQuery]);

  // Récupérer le cours sélectionné
  const selectedCourse = useMemo(() => {
    return stats.find(c => c.id === selectedCourseId) || null;
  }, [stats, selectedCourseId]);

  return (
    <>
      <NavbarTL />
      <div className="tls-page page-enter">
        <div className="tls-header">
          <h1 className="tls-title">Statistiques d'Apprentissage</h1>
          <p className="tls-desc">Analysez la progression de vos consultants de manière fluide et professionnelle.</p>
        </div>

        <div className="tls-topbar">
          <div className="tls-tabs">
            <button 
              className={`tls-tab ${tab === "public" ? "tls-tab--active" : ""}`}
              onClick={() => setTab("public")}
            >
              🌍 Cours Publics
            </button>
            <button 
              className={`tls-tab ${tab === "group" ? "tls-tab--active" : ""}`}
              onClick={() => setTab("group")}
            >
              🏢 Cours par Groupe
            </button>
          </div>

          {tab === "group" && (
            <div className="tls-group-select-wrapper">
              <label style={{ fontWeight: 700, color: "var(--ink-2)" }}>Groupe :</label>
              <select 
                className="tls-group-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                {groups.length === 0 && <option value="">Aucun groupe disponible</option>}
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.consultants_count} pers.)</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="tls-layout">
          {/* SIDEBAR: Liste des cours */}
          <aside className="tls-sidebar">
            <div className="tls-search-wrap">
              <input 
                type="text" 
                className="tls-search" 
                placeholder="Rechercher un cours..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {loading ? (
              <div className="tls-spinner-wrap" style={{ minHeight: "150px" }}><div className="tls-spinner"></div></div>
            ) : filteredCourses.length === 0 ? (
              <div className="tls-empty" style={{ padding: "40px 20px" }}>
                <div style={{ fontSize: "2rem" }}>🔍</div>
                Aucun cours trouvé.
              </div>
            ) : (
              <ul className="tls-course-list">
                {filteredCourses.map(course => (
                  <li 
                    key={course.id} 
                    className={`tls-course-item ${selectedCourseId === course.id ? "tls-course-item--active" : ""}`}
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <span className="tls-course-item-title">{course.title}</span>
                    <span className="tls-course-item-meta">{course.chapters.length} chapitres • {course.viewers} apprenants</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* MAIN CONTENT: Statistiques du cours sélectionné */}
          <main className="tls-content">
            {loading ? (
              <div className="tls-spinner-wrap"><div className="tls-spinner"></div></div>
            ) : !selectedCourse ? (
              <div className="tls-empty">
                <div className="tls-empty-icon">📊</div>
                Sélectionnez un cours dans la liste de gauche pour voir ses statistiques détaillées.
              </div>
            ) : (
              <div className="tls-course-detail">
                <h2 className="tls-course-title">📖 {selectedCourse.title}</h2>
                
                <div className="tls-stats-grid">
                  <div className="tls-stat-card">
                    <div className="tls-stat-value">{selectedCourse.total_consultants}</div>
                    <div className="tls-stat-label">Consultants Ciblés</div>
                  </div>
                  <div className="tls-stat-card">
                    <div className="tls-stat-value">{selectedCourse.viewers}</div>
                    <div className="tls-stat-label">Ont Commencé</div>
                  </div>
                  <div className="tls-stat-card" style={{ background: "var(--terra-dim)" }}>
                    <div className="tls-stat-value">
                      {selectedCourse.total_consultants > 0 ? Math.round((selectedCourse.viewers / selectedCourse.total_consultants) * 100) : 0}%
                    </div>
                    <div className="tls-stat-label">Taux d'Engagement</div>
                  </div>
                </div>

                {selectedCourse.chapters.length > 0 && (
                  <>
                    <h3 className="tls-section-title">📊 Progression par Chapitre</h3>
                    <div className="tls-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 40 }}>
                      {selectedCourse.chapters.map(ch => (
                        <div key={ch.id} className="tls-stat-card" style={{ padding: "16px" }}>
                          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: "0.95rem" }}>{ch.title}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--ink-3)" }}>
                            👀 {ch.viewed} vus<br/>
                            ✅ {ch.completed} terminés
                          </div>
                        </div>
                      ))}
                    </div>

                    <h3 className="tls-section-title">👥 Suivi des Consultants</h3>
                    {selectedCourse.matrix.length === 0 ? (
                      <div className="tls-empty" style={{ padding: "30px", border: "1px dashed var(--border-c)" }}>
                        Aucun consultant à suivre pour ce cours.
                      </div>
                    ) : (
                      <>
                        <input 
                          type="text" 
                          className="tls-search" 
                          placeholder="Rechercher un consultant par nom..." 
                          value={consultantSearchQuery}
                          onChange={(e) => setConsultantSearchQuery(e.target.value)}
                          style={{ marginBottom: "16px", maxWidth: "400px" }}
                        />
                        <div className="tls-table-wrapper">
                        <table className="tls-table">
                          <thead>
                            <tr>
                              <th>Nom du Consultant</th>
                              {selectedCourse.chapters.map(ch => (
                                <th key={ch.id} style={{ textAlign: "center" }}>{ch.title}</th>
                              ))}
                              <th>Progression Globale</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedCourse.matrix
                              .filter(cons => cons.name.toLowerCase().includes(consultantSearchQuery.toLowerCase()))
                              .map(cons => (
                              <tr key={cons.id}>
                                <td style={{ fontWeight: 600 }}>{cons.name}</td>
                                {cons.chapters.map(ch => (
                                  <td key={ch.id} className="tls-cell-check">
                                    {ch.completed ? "✔️" : "❌"}
                                  </td>
                                ))}
                                <td>
                                  <div style={{ fontWeight: 800, color: "var(--terra)" }}>{cons.progress}%</div>
                                  <div className="tls-prog-bar">
                                    <div className="tls-prog-fill" style={{ width: `${cons.progress}%` }}></div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>

      </div>
    </>
  );
}

export default TLStats;
