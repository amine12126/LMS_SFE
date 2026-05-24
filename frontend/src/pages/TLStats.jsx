import { useEffect, useState, useMemo } from "react";
import NavbarTL from "../components/NavbarTL.jsx";
import { statsService, groupService } from "../services/api.js";
import "./TLStats.css";

function TLStats() {
  const [tab, setTab] = useState("public"); // "public" | "group"
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  
  const [stats, setStats] = useState({ courses: [], packages: [] });
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState({ type: null, id: null, parentId: null });
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
    setSelectedItem({ type: null, id: null, parentId: null });
    setStats({ courses: [], packages: [] });

    if (tab === "group" && !selectedGroup) {
      setLoading(false);
      return;
    }

    statsService.getStats(tab, selectedGroup)
      .then(res => {
        setStats(res.data);
        const data = res.data;
        if (data.courses && data.courses.length > 0) {
          setSelectedItem({ type: "course", id: data.courses[0].id, parentId: null });
        } else if (data.packages && data.packages.length > 0) {
          setSelectedItem({ type: "package", id: data.packages[0].id, parentId: null });
        } else {
          setSelectedItem({ type: null, id: null, parentId: null });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [tab, selectedGroup]);

  // Filtrer la liste des cours selon la recherche
  const filteredCourses = useMemo(() => {
    const list = stats.courses || [];
    return list.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [stats.courses, searchQuery]);

  // Filtrer la liste des packages selon la recherche
  const filteredPackages = useMemo(() => {
    const list = stats.packages || [];
    return list.map(pkg => {
      const pkgCoursesFiltered = pkg.courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        ...pkg,
        courses: pkgCoursesFiltered,
        matches: pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) || pkgCoursesFiltered.length > 0
      };
    }).filter(pkg => pkg.matches);
  }, [stats.packages, searchQuery]);

  // Récupérer la sélection active
  const activeSelection = useMemo(() => {
    if (selectedItem.type === "course") {
      return {
        type: "course",
        data: (stats.courses || []).find(c => c.id === selectedItem.id) || null
      };
    }
    if (selectedItem.type === "package") {
      return {
        type: "package",
        data: (stats.packages || []).find(p => p.id === selectedItem.id) || null
      };
    }
    if (selectedItem.type === "package-course") {
      const pkg = (stats.packages || []).find(p => p.id === selectedItem.parentId);
      if (!pkg) return null;
      return {
        type: "package-course",
        package: pkg,
        data: pkg.courses.find(c => c.id === selectedItem.id) || null
      };
    }
    return null;
  }, [stats, selectedItem]);


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
          {/* SIDEBAR: Liste des cours et packages */}
          <aside className="tls-sidebar">
            <div className="tls-search-wrap">
              <input 
                type="text" 
                className="tls-search" 
                placeholder="Rechercher un cours/package..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {loading ? (
              <div className="tls-spinner-wrap" style={{ minHeight: "150px" }}><div className="tls-spinner"></div></div>
            ) : (filteredCourses.length === 0 && filteredPackages.length === 0) ? (
              <div className="tls-empty" style={{ padding: "40px 20px" }}>
                <div style={{ fontSize: "2rem" }}>🔍</div>
                Aucun élément trouvé.
              </div>
            ) : (
              <div className="tls-sidebar-content">
                {/* Section Cours Individuels */}
                {filteredCourses.length > 0 && (
                  <div className="tls-sidebar-section">
                    <div className="tls-sidebar-section-title">📚 Cours Individuels</div>
                    <ul className="tls-course-list">
                      {filteredCourses.map(course => (
                        <li 
                          key={`course-${course.id}`} 
                          className={`tls-course-item ${selectedItem.type === "course" && selectedItem.id === course.id ? "tls-course-item--active" : ""}`}
                          onClick={() => setSelectedItem({ type: "course", id: course.id, parentId: null })}
                        >
                          <span className="tls-course-item-title">{course.title}</span>
                          <span className="tls-course-item-meta">{course.chapters.length} chapitres • {course.viewers} apprenants</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Section Packages */}
                {filteredPackages.length > 0 && (
                  <div className="tls-sidebar-section">
                    <div className="tls-sidebar-section-title">📦 Packages de Cours</div>
                    {filteredPackages.map(pkg => (
                      <div key={`pkg-${pkg.id}`} className="tls-sidebar-package-group">
                        <div 
                          className={`tls-package-header-item ${selectedItem.type === "package" && selectedItem.id === pkg.id ? "tls-package-header-item--active" : ""}`}
                          onClick={() => setSelectedItem({ type: "package", id: pkg.id, parentId: null })}
                        >
                          <span className="tls-package-icon">📦</span>
                          <div className="tls-package-header-info">
                            <span className="tls-package-title">{pkg.name}</span>
                            <span className="tls-package-meta">{pkg.total_courses} cours • {pkg.total_chapters} ch.</span>
                          </div>
                        </div>
                        <ul className="tls-package-course-list">
                          {pkg.courses.map(course => (
                            <li 
                              key={`pkg-${pkg.id}-course-${course.id}`} 
                              className={`tls-package-course-item ${selectedItem.type === "package-course" && selectedItem.parentId === pkg.id && selectedItem.id === course.id ? "tls-package-course-item--active" : ""}`}
                              onClick={() => setSelectedItem({ type: "package-course", id: course.id, parentId: pkg.id })}
                            >
                              <span className="tls-package-course-title">├─ {course.title}</span>
                              <span className="tls-package-course-meta">{course.chapters.length} chapitres</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>

          {/* MAIN CONTENT: Statistiques du cours ou package sélectionné */}
          <main className="tls-content">
            {loading ? (
              <div className="tls-spinner-wrap"><div className="tls-spinner"></div></div>
            ) : !activeSelection ? (
              <div className="tls-empty">
                <div className="tls-empty-icon">📊</div>
                Sélectionnez un cours ou un package dans la liste de gauche pour voir ses statistiques détaillées.
              </div>
            ) : activeSelection.type === "package" ? (
              /* AFFICHAGE DES STATISTIQUES DU PACKAGE GLOBAL */
              <div className="tls-course-detail">
                <h2 className="tls-course-title">📦 Package : {activeSelection.data.name}</h2>
                {activeSelection.data.description && (
                  <p className="tls-course-desc-text">{activeSelection.data.description}</p>
                )}
                
                <div className="tls-stats-grid">
                  <div className="tls-stat-card">
                    <div className="tls-stat-value">{activeSelection.data.total_courses}</div>
                    <div className="tls-stat-label">Cours inclus</div>
                  </div>
                  <div className="tls-stat-card">
                    <div className="tls-stat-value">{activeSelection.data.total_chapters}</div>
                    <div className="tls-stat-label">Chapitres Totaux (Visibles)</div>
                  </div>
                  <div className="tls-stat-card" style={{ background: "var(--terra-dim)" }}>
                    <div className="tls-stat-value">
                      {activeSelection.data.matrix.length > 0 
                        ? Math.round(activeSelection.data.matrix.reduce((acc, curr) => acc + curr.progress, 0) / activeSelection.data.matrix.length) 
                        : 0}%
                    </div>
                    <div className="tls-stat-label">Moyenne de Progression</div>
                  </div>
                </div>

                <h3 className="tls-section-title">👥 Suivi des Consultants du Package</h3>
                {activeSelection.data.matrix.length === 0 ? (
                  <div className="tls-empty" style={{ padding: "30px", border: "1px dashed var(--border-c)" }}>
                    Aucun consultant à suivre dans ce groupe.
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
                            {activeSelection.data.courses.map(c => (
                              <th key={c.id} style={{ textAlign: "center" }}>{c.title}</th>
                            ))}
                            <th>Progression Globale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSelection.data.matrix
                            .filter(cons => cons.name.toLowerCase().includes(consultantSearchQuery.toLowerCase()))
                            .map(cons => (
                              <tr key={cons.id}>
                                <td style={{ fontWeight: 600 }}>{cons.name}</td>
                                {activeSelection.data.courses.map(c => {
                                  const prog = cons.courses_progress[c.id] ?? 0;
                                  return (
                                    <td key={c.id} style={{ textAlign: "center", fontWeight: 700 }}>
                                      <span style={{ color: prog === 100 ? "var(--moss, #2e7d32)" : "var(--terra, #c4602a)" }}>
                                        {prog}%
                                      </span>
                                    </td>
                                  );
                                })}
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
              </div>
            ) : (
              /* AFFICHAGE STATS POUR UN COURS (INDIVIDUEL OU DANS UN PACKAGE) */
              <div className="tls-course-detail">
                <h2 className="tls-course-title">
                  📖 {activeSelection.data.title}
                  {activeSelection.type === "package-course" && (
                    <span style={{ fontSize: "0.9rem", color: "#7c3aed", marginLeft: "12px", display: "inline-block", padding: "2px 8px", background: "rgba(124, 58, 237, 0.1)", borderRadius: "10px" }}>
                      Package : {activeSelection.package.name}
                    </span>
                  )}
                </h2>
                
                <div className="tls-stats-grid">
                  <div className="tls-stat-card">
                    <div className="tls-stat-value">{activeSelection.data.total_consultants}</div>
                    <div className="tls-stat-label">Consultants Ciblés</div>
                  </div>
                  <div className="tls-stat-card">
                    <div className="tls-stat-value">{activeSelection.data.viewers}</div>
                    <div className="tls-stat-label">Ont Commencé</div>
                  </div>
                  <div className="tls-stat-card" style={{ background: "var(--terra-dim)" }}>
                    <div className="tls-stat-value">
                      {activeSelection.data.total_consultants > 0 ? Math.round((activeSelection.data.viewers / activeSelection.data.total_consultants) * 100) : 0}%
                    </div>
                    <div className="tls-stat-label">Taux d'Engagement</div>
                  </div>
                </div>

                {activeSelection.data.chapters.length > 0 && (
                  <>
                    <h3 className="tls-section-title">📊 Progression par Chapitre</h3>
                    <div className="tls-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginBottom: 40 }}>
                      {activeSelection.data.chapters.map(ch => (
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
                    {activeSelection.data.matrix.length === 0 ? (
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
                                {activeSelection.data.chapters.map(ch => (
                                  <th key={ch.id} style={{ textAlign: "center" }}>{ch.title}</th>
                                ))}
                                <th>Progression Globale</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeSelection.data.matrix
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

