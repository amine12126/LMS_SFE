import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavbarTL from "../components/NavbarTL.jsx";
import { groupService, courseService, packageService } from "../services/api.js";
import { getConsultants } from "../api/user.js";
import "./TLGroups.css";

function TLGroups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [courses, setCourses] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Group Details
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [courseToAssign, setCourseToAssign] = useState("");
  const [packageToAssign, setPackageToAssign] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assigningPackage, setAssigningPackage] = useState(false);

  // Edit/Delete state
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [selectedConsultants, setSelectedConsultants] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [grpRes, consRes, crsRes, pkgRes] = await Promise.all([
        groupService.getAll(),
        getConsultants(),
        courseService.getAll(),
        packageService.getAll()
      ]);
      setGroups(grpRes.data);
      setConsultants(consRes.data);
      setCourses(crsRes.data);
      setPackages(pkgRes.data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredConsultants = useMemo(() => {
    return consultants.filter(c => 
      `${c.prenom} ${c.nom} ${c.email}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [consultants, searchQuery]);

  const toggleConsultant = (id) => {
    const newSet = new Set(selectedConsultants);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedConsultants(newSet);
  };

  const handleSelectAllFiltered = () => {
    const newSet = new Set(selectedConsultants);
    let allSelected = true;
    for (const c of filteredConsultants) {
      if (!newSet.has(c.id)) {
        allSelected = false;
        break;
      }
    }

    if (allSelected) {
      filteredConsultants.forEach(c => newSet.delete(c.id));
    } else {
      filteredConsultants.forEach(c => newSet.add(c.id));
    }
    setSelectedConsultants(newSet);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!groupName.trim()) {
      setError("Le nom du groupe est requis.");
      return;
    }
    if (selectedConsultants.size === 0) {
      setError("Veuillez sélectionner au moins un consultant.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: groupName,
        consultants: Array.from(selectedConsultants)
      };
      
      if (isEditing && selectedGroup) {
        await groupService.update(selectedGroup.id, payload);
        setSuccess(`Le groupe "${groupName}" a été mis à jour avec succès !`);
      } else {
        await groupService.create(payload);
        setSuccess(`Le groupe "${groupName}" a été créé avec succès !`);
      }
      
      const grpRes = await groupService.getAll();
      setGroups(grpRes.data);
      
      if (isEditing) {
        const updatedGroup = grpRes.data.find(g => g.id === selectedGroup.id);
        setSelectedGroup(updatedGroup);
        setIsEditing(false);
      } else {
        setGroupName("");
        setSelectedConsultants(new Set());
        setSearchQuery("");
      }
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(isEditing ? "Erreur lors de la mise à jour du groupe." : "Erreur lors de la création du groupe.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.")) return;
    
    setDeleting(true);
    try {
      await groupService.remove(selectedGroup.id);
      setSuccess("Groupe supprimé avec succès.");
      setSelectedGroup(null);
      setIsEditing(false);
      const grpRes = await groupService.getAll();
      setGroups(grpRes.data);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression du groupe.");
    } finally {
      setDeleting(false);
    }
  };

  const handleAssignCourse = async () => {
    if (!courseToAssign) return;
    setAssigning(true);
    setError("");
    setSuccess("");

    try {
      await groupService.assignCourse(selectedGroup.id, courseToAssign);
      setSuccess("Cours assigné avec succès au groupe !");
      setCourseToAssign("");
      
      // Refresh groups to get updated assigned_courses
      const grpRes = await groupService.getAll();
      setGroups(grpRes.data);
      
      // Update selected group reference
      const updatedGroup = grpRes.data.find(g => g.id === selectedGroup.id);
      setSelectedGroup(updatedGroup);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'assignation du cours.");
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignPackage = async () => {
    if (!packageToAssign) return;
    setAssigningPackage(true);
    setError("");
    setSuccess("");

    try {
      await groupService.assignPackage(selectedGroup.id, packageToAssign);
      setSuccess("Package de cours assigné avec succès au groupe !");
      setPackageToAssign("");
      
      const grpRes = await groupService.getAll();
      setGroups(grpRes.data);
      
      const updatedGroup = grpRes.data.find(g => g.id === selectedGroup.id);
      setSelectedGroup(updatedGroup);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'assignation du package.");
    } finally {
      setAssigningPackage(false);
    }
  };

  const handleUnassignPackage = async (packageId) => {
    if (!window.confirm("Voulez-vous vraiment retirer ce package de ce groupe ?")) return;
    setError("");
    setSuccess("");

    try {
      await groupService.unassignPackage(selectedGroup.id, packageId);
      setSuccess("Package retiré avec succès du groupe !");
      
      const grpRes = await groupService.getAll();
      setGroups(grpRes.data);
      
      const updatedGroup = grpRes.data.find(g => g.id === selectedGroup.id);
      setSelectedGroup(updatedGroup);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du retrait du package.");
    }
  };

  return (
    <>
      <NavbarTL />
      <div className="tlg-page page-enter">
        <div className="tlg-header">
          <h1 className="tlg-title">Gestion des Groupes</h1>
          <p className="tlg-desc">Créez des groupes et assignez-leur des parcours d'apprentissage.</p>
        </div>

        <div className="tlg-layout">
          
          {/* COLONNE GAUCHE : LISTE DES GROUPES */}
          <div className="tlg-list-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "2px solid var(--cream-2)", paddingBottom: 16 }}>
              <h2 className="tlg-section-title" style={{ borderBottom: "none", margin: 0, padding: 0 }}>Mes Groupes Existants</h2>
              <button 
                onClick={() => { setSelectedGroup(null); setIsEditing(false); setError(""); setSuccess(""); setGroupName(""); setSelectedConsultants(new Set()); }}
                style={{ background: "var(--terra-dim)", color: "var(--terra)", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
              >
                + Nouveau
              </button>
            </div>

            {loading ? (
              <div>Chargement...</div>
            ) : groups.length === 0 ? (
              <div style={{ color: "var(--ink-3)", fontStyle: "italic" }}>
                Vous n'avez pas encore créé de groupe.
              </div>
            ) : (
              <div className="tlg-groups">
                {groups.map(g => (
                  <div 
                    key={g.id} 
                    className={`tlg-group-card ${selectedGroup?.id === g.id ? "tlg-group-card--active" : ""}`}
                    onClick={() => { setSelectedGroup(g); setIsEditing(false); setError(""); setSuccess(""); }}
                    style={{ cursor: "pointer", border: selectedGroup?.id === g.id ? "2px solid var(--terra)" : "" }}
                  >
                    <h3 className="tlg-group-name">{g.name}</h3>
                    <div className="tlg-group-count">
                      👥 {g.consultants_count} consultant{g.consultants_count > 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLONNE DROITE : DÉTAILS OU CRÉATION */}
          <div className="tlg-form-section">
            
            {error && <div className="tlg-alert tlg-alert--error">{error}</div>}
            {success && <div className="tlg-alert tlg-alert--success">{success}</div>}

            {selectedGroup && !isEditing ? (
              // VUE : DÉTAILS DU GROUPE
              <div className="tlg-group-detail">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 className="tlg-section-title" style={{ margin: 0 }}>🏢 Groupe : {selectedGroup.name}</h2>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={() => {
                        setGroupName(selectedGroup.name);
                        setSelectedConsultants(new Set(selectedGroup.consultants || []));
                        setIsEditing(true);
                        setError("");
                        setSuccess("");
                      }}
                      style={{ background: "rgba(59, 158, 255, 0.1)", color: "#3b9eff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{ background: "rgba(255, 69, 58, 0.1)", color: "#ff453a", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", transition: "background 0.2s" }}
                    >
                      🗑️ {deleting ? "..." : "Supprimer"}
                    </button>
                  </div>
                </div>
                
                {/* ASSIGNER UN COURS */}
                <div style={{ background: "var(--cream)", padding: "20px", borderRadius: "12px", marginBottom: "32px", border: "1px solid var(--border-c)" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "var(--ink)" }}>📚 Assigner un Cours</h3>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <select 
                      className="tlg-input" 
                      style={{ flex: 1, minWidth: "200px" }}
                      value={courseToAssign}
                      onChange={e => setCourseToAssign(e.target.value)}
                    >
                      <option value="">-- Choisir un cours existant --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                    <button 
                      className="tlg-btn-submit" 
                      style={{ marginTop: 0, width: "auto", padding: "12px 24px" }}
                      disabled={!courseToAssign || assigning}
                      onClick={handleAssignCourse}
                    >
                      {assigning ? "..." : "Assigner"}
                    </button>
                    <span style={{ color: "var(--ink-3)", fontSize: "0.9rem", fontWeight: 600 }}>ou</span>
                    <button 
                      className="tlg-btn-submit" 
                      style={{ marginTop: 0, width: "auto", padding: "12px 24px", background: "transparent", color: "var(--terra)", border: "2px solid var(--terra)" }}
                      onClick={() => navigate(`/tl/courses/create?group_id=${selectedGroup.id}`)}
                    >
                      + Créer un nouveau cours
                    </button>
                  </div>
                </div>

                {/* COURS DÉJÀ ASSIGNÉS */}
                <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Cours Actuels du Groupe</h3>
                {selectedGroup.assigned_courses && selectedGroup.assigned_courses.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: "32px" }}>
                    {selectedGroup.assigned_courses.map(c => (
                      <li key={c.id} style={{ padding: "12px 16px", background: "#fff", border: "1px solid var(--border-c)", borderRadius: "8px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "1.2rem" }}>📖</span>
                        <strong style={{ color: "var(--ink)" }}>{c.title}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "var(--ink-3)", fontStyle: "italic", marginBottom: "32px" }}>Aucun cours n'est assigné à ce groupe pour le moment.</p>
                )}

                {/* ASSIGNER UN PACKAGE */}
                <div style={{
                  background: "linear-gradient(135deg, rgba(59,158,255,0.07) 0%, rgba(120,80,255,0.07) 100%)",
                  padding: "24px",
                  borderRadius: "14px",
                  marginBottom: "32px",
                  border: "2px solid rgba(59,158,255,0.25)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "1.5rem" }}>🗂️</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--ink)", fontWeight: 700 }}>Assigner un Package de Cours</h3>
                      <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--ink-3)" }}>
                        Un package regroupe plusieurs cours personnalisables (exclusions de chapitres par consultant).
                      </p>
                    </div>
                  </div>

                  {packages.length === 0 ? (
                    <div style={{
                      background: "rgba(255,200,80,0.1)",
                      border: "1px solid rgba(255,200,80,0.4)",
                      borderRadius: "10px",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "1.3rem" }}>⚠️</span>
                        <span style={{ color: "#a06000", fontSize: "0.92rem", fontWeight: 600 }}>
                          Vous n'avez aucun package créé. Créez d'abord un package depuis la page "Cours".
                        </span>
                      </div>
                      <button
                        onClick={() => navigate("/tl/courses")}
                        style={{
                          background: "#f59e0b",
                          color: "#fff",
                          border: "none",
                          padding: "8px 18px",
                          borderRadius: "8px",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontSize: "0.88rem",
                          whiteSpace: "nowrap"
                        }}
                      >
                        ➕ Créer un package
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        className="tlg-input"
                        style={{ flex: 1, minWidth: "220px", borderColor: "rgba(59,158,255,0.4)" }}
                        value={packageToAssign}
                        onChange={e => setPackageToAssign(e.target.value)}
                      >
                        <option value="">-- Choisir un package ({packages.length} disponible{packages.length > 1 ? "s" : ""}) --</option>
                        {packages.map(p => (
                          <option key={p.id} value={p.id}>📦 {p.name}</option>
                        ))}
                      </select>
                      <button
                        className="tlg-btn-submit"
                        style={{ marginTop: 0, width: "auto", padding: "12px 28px", background: "linear-gradient(135deg, #3b9eff, #7850ff)" }}
                        disabled={!packageToAssign || assigningPackage}
                        onClick={handleAssignPackage}
                      >
                        {assigningPackage ? "⏳ Assignation..." : "✅ Assigner le Package"}
                      </button>
                    </div>
                  )}
                </div>

                {/* PACKAGES DÉJÀ ASSIGNÉS */}
                <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>Packages Actuels du Groupe</h3>
                {selectedGroup.assigned_packages && selectedGroup.assigned_packages.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, marginBottom: "32px" }}>
                    {selectedGroup.assigned_packages.map(p => (
                      <li key={p.id} style={{ padding: "12px 16px", background: "#fff", border: "1px solid var(--border-c)", borderRadius: "8px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "1.2rem" }}>🗂️</span>
                          <div>
                            <strong style={{ color: "var(--ink)" }}>{p.name}</strong>
                            <div style={{ fontSize: "0.82rem", color: "var(--ink-3)" }}>{p.courses.length} cours inclus</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnassignPackage(p.id)}
                          style={{ background: "rgba(255, 69, 58, 0.1)", color: "#ff453a", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                        >
                          Retirer
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "var(--ink-3)", fontStyle: "italic", marginBottom: "32px" }}>Aucun package de cours n'est assigné à ce groupe pour le moment.</p>
                )}

              </div>
            ) : (
              // VUE : CRÉATION OU MODIFICATION D'UN GROUPE
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <h2 className="tlg-section-title" style={{ margin: 0 }}>{isEditing ? "✏️ Modifier le groupe" : "➕ Créer un nouveau groupe"}</h2>
                  {isEditing && (
                    <button 
                      onClick={() => setIsEditing(false)} 
                      style={{ background: "transparent", color: "var(--ink-3)", border: "1px solid var(--border-c)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                    >
                      Annuler
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="tlg-field">
                    <label className="tlg-label">Nom du groupe</label>
                    <input 
                      type="text" 
                      className="tlg-input" 
                      placeholder="Ex: Équipe Alpha, Nouvelle Recrue 2026..." 
                      value={groupName}
                      onChange={e => setGroupName(e.target.value)}
                    />
                  </div>

                  <div className="tlg-field">
                    <label className="tlg-label">Sélectionner les consultants</label>
                    
                    <div className="tlg-search-wrap">
                      <input 
                        type="text" 
                        className="tlg-input" 
                        placeholder="🔍 Rechercher par nom, prénom ou email..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <button 
                        type="button" 
                        onClick={handleSelectAllFiltered}
                        style={{ background: "none", border: "none", color: "var(--terra)", fontWeight: 700, cursor: "pointer", padding: 0 }}
                      >
                        Tout sélectionner / désélectionner (résultats actuels)
                      </button>
                      <span className="tlg-selection-summary">
                        {selectedConsultants.size} sélectionné(s)
                      </span>
                    </div>

                    <div className="tlg-consultants-list">
                      {filteredConsultants.length === 0 ? (
                        <div style={{ padding: 20, textAlign: "center", color: "var(--ink-3)" }}>
                          Aucun consultant trouvé.
                        </div>
                      ) : (
                        filteredConsultants.map(c => {
                          const isSelected = selectedConsultants.has(c.id);
                          return (
                            <label 
                              key={c.id} 
                              className={`tlg-consultant-item ${isSelected ? "tlg-consultant-item--selected" : ""}`}
                            >
                              <input 
                                type="checkbox" 
                                className="tlg-checkbox"
                                checked={isSelected}
                                onChange={() => toggleConsultant(c.id)}
                              />
                              <div className="tlg-cons-info">
                                <span className="tlg-cons-name">{c.prenom} {c.nom}</span>
                                <span className="tlg-cons-email">{c.email}</span>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="tlg-btn-submit"
                    disabled={saving || loading}
                  >
                    {saving ? "Enregistrement en cours..." : (isEditing ? "Enregistrer les modifications" : "Créer le groupe")}
                  </button>
                </form>
              </>
            )}

          </div>

        </div>
      </div>
    </>
  );
}

export default TLGroups;
