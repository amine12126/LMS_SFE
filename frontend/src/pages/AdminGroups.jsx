import { useEffect, useState, useMemo } from "react";
import { groupService } from "../services/api.js";
import { getConsultants, getTLs } from "../api/user.js";
import "./AdminGroups.css";

function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [tls, setTls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection states
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Form states
  const [groupName, setGroupName] = useState("");
  const [selectedConsultantIds, setSelectedConsultantIds] = useState(new Set());
  const [selectedTLIds, setSelectedTLIds] = useState(new Set());
  
  // Search states
  const [searchConsultant, setSearchConsultant] = useState("");
  const [searchTL, setSearchTL] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [grpRes, consRes, tlsRes] = await Promise.all([
        groupService.getAll(),
        getConsultants(),
        getTLs()
      ]);
      setGroups(grpRes.data);
      setConsultants(consRes.data);
      setTls(tlsRes.data);
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
      `${c.prenom} ${c.nom} ${c.email}`.toLowerCase().includes(searchConsultant.toLowerCase())
    );
  }, [consultants, searchConsultant]);

  const filteredTLs = useMemo(() => {
    return tls.filter(t => 
      `${t.prenom} ${t.nom} ${t.email}`.toLowerCase().includes(searchTL.toLowerCase())
    );
  }, [tls, searchTL]);

  const toggleSelection = (id, set, setter) => {
    const newSet = new Set(set);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setter(newSet);
  };

  const handleGroupSelect = (group) => {
    if (group) {
      setSelectedGroup(group);
      setGroupName(group.name);
      setSelectedConsultantIds(new Set(group.consultants || []));
      setSelectedTLIds(new Set(group.team_leaders || []));
    } else {
      setSelectedGroup(null);
      setGroupName("");
      setSelectedConsultantIds(new Set());
      setSelectedTLIds(new Set());
    }
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!groupName.trim()) {
      setError("Le nom du groupe est requis.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: groupName,
        consultants: Array.from(selectedConsultantIds),
        team_leaders: Array.from(selectedTLIds)
      };

      if (selectedGroup) {
        // Update
        await groupService.update(selectedGroup.id, payload);
        setSuccess("Groupe mis à jour avec succès !");
      } else {
        // Create
        await groupService.create(payload);
        setSuccess("Groupe créé avec succès !");
        handleGroupSelect(null);
      }
      
      const grpRes = await groupService.getAll();
      setGroups(grpRes.data);
      
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup || !window.confirm("Voulez-vous vraiment supprimer ce groupe ?")) return;
    
    setSaving(true);
    try {
      await groupService.remove(selectedGroup.id);
      setSuccess("Groupe supprimé.");
      handleGroupSelect(null);
      const grpRes = await groupService.getAll();
      setGroups(grpRes.data);
    } catch (err) {
      setError("Erreur lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admg-page">
      <div className="admg-header">
        <h1 className="admg-title">Gestion des Groupes</h1>
        <p className="admg-desc">Supervisez et contrôlez tous les groupes de la plateforme.</p>
      </div>

      <div className="admg-layout">
        
        {/* LISTE DES GROUPES */}
        <div className="admg-list-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h2 className="admg-section-title" style={{ borderBottom: "none", margin: 0 }}>Groupes ({groups.length})</h2>
            <button 
              className="admg-btn-submit" 
              style={{ width: "auto", margin: 0, padding: "8px 16px", fontSize: "0.9rem" }}
              onClick={() => handleGroupSelect(null)}
            >
              + Nouveau
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>Chargement...</div>
          ) : (
            <div className="admg-groups">
              {groups.map(g => (
                <div 
                  key={g.id} 
                  className={`admg-group-card ${selectedGroup?.id === g.id ? "admg-group-card--active" : ""}`}
                  onClick={() => handleGroupSelect(g)}
                >
                  <div className="admg-group-name">{g.name}</div>
                  <div className="admg-group-meta">
                    <span>👥 {g.consultants_count} consultant(s)</span>
                    <span>👔 {g.team_leaders_info?.length || 0} TL(s)</span>
                  </div>
                </div>
              ))}
              {groups.length === 0 && <div style={{ color: "var(--ink-3)", textAlign: "center" }}>Aucun groupe.</div>}
            </div>
          )}
        </div>

        {/* FORMULAIRE D'ÉDITION / CRÉATION */}
        <div className="admg-form-section">
          <h2 className="admg-section-title">
            {selectedGroup ? `Modifier : ${selectedGroup.name}` : "Créer un nouveau groupe"}
          </h2>

          {error && <div className="admg-alert admg-alert--error">⚠️ {error}</div>}
          {success && <div className="admg-alert admg-alert--success">✅ {success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="admg-field">
              <label className="admg-label">Nom du groupe</label>
              <input 
                type="text" 
                className="admg-input" 
                placeholder="Ex: Équipe Innovation 2026"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
            </div>

            {/* SELECTION DES TLs */}
            <div className="admg-field">
              <label className="admg-label">Team Leaders (Responsables)</label>
              <div className="admg-search-wrap">
                <input 
                  type="text" 
                  className="admg-input" 
                  placeholder="🔍 Rechercher un TL..." 
                  value={searchTL}
                  onChange={e => setSearchTL(e.target.value)}
                />
              </div>
              <div className="admg-users-list">
                {filteredTLs.map(t => (
                  <label 
                    key={t.id} 
                    className={`admg-user-item ${selectedTLIds.has(t.id) ? "admg-user-item--selected" : ""}`}
                  >
                    <input 
                      type="checkbox" 
                      className="admg-checkbox"
                      checked={selectedTLIds.has(t.id)}
                      onChange={() => toggleSelection(t.id, selectedTLIds, setSelectedTLIds)}
                    />
                    <div className="admg-user-info">
                      <span className="admg-user-name">{t.prenom} {t.nom}</span>
                      <span className="admg-user-email">{t.email}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* SELECTION DES CONSULTANTS */}
            <div className="admg-field">
              <label className="admg-label">Consultants (Membres)</label>
              <div className="admg-search-wrap">
                <input 
                  type="text" 
                  className="admg-input" 
                  placeholder="🔍 Rechercher un consultant..." 
                  value={searchConsultant}
                  onChange={e => setSearchConsultant(e.target.value)}
                />
              </div>
              <div className="admg-users-list">
                {filteredConsultants.map(c => (
                  <label 
                    key={c.id} 
                    className={`admg-user-item ${selectedConsultantIds.has(c.id) ? "admg-user-item--selected" : ""}`}
                  >
                    <input 
                      type="checkbox" 
                      className="admg-checkbox"
                      checked={selectedConsultantIds.has(c.id)}
                      onChange={() => toggleSelection(c.id, selectedConsultantIds, setSelectedConsultantIds)}
                    />
                    <div className="admg-user-info">
                      <span className="admg-user-name">{c.prenom} {c.nom}</span>
                      <span className="admg-user-email">{c.email}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <button 
                type="submit" 
                className="admg-btn-submit"
                disabled={saving}
              >
                {saving ? "Opération en cours..." : selectedGroup ? "Mettre à jour le groupe" : "Créer le groupe"}
              </button>
              
              {selectedGroup && (
                <button 
                  type="button" 
                  className="admg-btn-submit admg-btn-danger"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Supprimer le groupe
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default AdminGroups;
