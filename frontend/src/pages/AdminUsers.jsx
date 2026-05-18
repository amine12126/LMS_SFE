import React, { useState, useEffect, useMemo } from "react";
import { getTLs, getConsultants, addUser, updateUser, deleteUser, getTLDetails } from "../api/user.js";
import { API_BASE_URL } from "../api/axios.js";
import "./AdminUsers.css";

/* ── helpers ── */
const GRADIENT_PALETTE = [
  "linear-gradient(135deg,#4f46e5,#7c3aed)",
  "linear-gradient(135deg,#0ea5e9,#6366f1)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#14b8a6,#3b82f6)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#22c55e,#0ea5e9)",
];
const gradientFor = (str = "") => GRADIENT_PALETTE[str.charCodeAt(0) % GRADIENT_PALETTE.length];
const initials = (u) => `${(u.prenom || "?")[0]}${(u.nom || "?")[0]}`.toUpperCase();

/**
 * Returns an absolute photo URL.
 * DRF returns absolute URLs when request context is passed,
 * but this is a safety net for any relative URLs.
 */
const photoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
};

const EMPTY_FORM = { nom: "", prenom: "", email: "", ggid: "", password: "" };

/* ──────────────────────────────────────────── */
export default function AdminUsers() {
  const [tab, setTab]             = useState("tl");
  const [tlList, setTlList]       = useState([]);
  const [consList, setConsList]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");

  /* modal state */
  const [modal, setModal]         = useState(null); // null | "add" | "edit" | "view"
  const [selected, setSelected]   = useState(null);
  const [tlDetails, setTlDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  /* fetch on tab change */
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tlRes, consRes] = await Promise.all([getTLs(), getConsultants()]);
      setTlList(tlRes.data);
      setConsList(consRes.data);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  const users = tab === "tl" ? tlList : consList;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      `${u.prenom} ${u.nom} ${u.email} ${u.ggid}`.toLowerCase().includes(q)
    );
  }, [users, search]);

  /* open modals */
  const openAdd = () => {
    setForm({ ...EMPTY_FORM, role: tab });
    setSelected(null);
    setModal("add");
  };

  const openEdit = (u) => {
    setForm({ nom: u.nom, prenom: u.prenom, email: u.email, ggid: u.ggid, password: "", role: tab });
    setSelected(u);
    setModal("edit");
  };

  const openView = async (u) => {
    setSelected(u);
    setTlDetails(null);
    setModal("view");
    setDetailLoading(true);
    try {
      const res = await getTLDetails(u.id);
      setTlDetails(res.data);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const closeModal = () => { setModal(null); setSelected(null); setTlDetails(null); };

  /* submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === "add") {
        await addUser({ ...form, role: tab });
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await updateUser(selected.id, payload);
      }
      closeModal();
      fetchAll();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement.");
    } finally { setSaving(false); }
  };

  /* delete */
  const handleDelete = async (u) => {
    if (!window.confirm(`Supprimer ${u.prenom} ${u.nom} ?`)) return;
    try {
      await deleteUser(u.id);
      fetchAll();
    } catch (e) { console.error(e); }
  };

  /* ── render ── */
  return (
    <div className="au-page">
      <div className="au-inner">

        {/* HEADER */}
        <header className="au-header">
          <div className="au-title-area">
            <div className="au-breadcrumb">
              <span>Administration</span>
              <span className="au-breadcrumb-sep">›</span>
              <span>Gestion des utilisateurs</span>
            </div>
            <h1 className="au-title">TL &amp; Consultants</h1>
            <p className="au-subtitle">Gérez les membres de votre plateforme LMS</p>
          </div>
          <button className="au-add-btn" onClick={openAdd}>
            <span className="au-add-icon">+</span>
            Ajouter un {tab === "tl" ? "Team Leader" : "Consultant"}
          </button>
        </header>

        {/* STATS */}
        <div className="au-stats-row">
          <div className="au-stat-card">
            <div className="au-stat-icon au-stat-icon--purple">👥</div>
            <div className="au-stat-num">{tlList.length}</div>
            <div className="au-stat-lbl">Team Leaders</div>
          </div>
          <div className="au-stat-card">
            <div className="au-stat-icon au-stat-icon--blue">🎓</div>
            <div className="au-stat-num">{consList.length}</div>
            <div className="au-stat-lbl">Consultants</div>
          </div>
          <div className="au-stat-card">
            <div className="au-stat-icon au-stat-icon--green">📚</div>
            <div className="au-stat-num">
              {tlList.reduce((acc, t) => acc + (t.courses_count || 0), 0)}
            </div>
            <div className="au-stat-lbl">Cours créés</div>
          </div>
          <div className="au-stat-card">
            <div className="au-stat-icon au-stat-icon--orange">🗂️</div>
            <div className="au-stat-num">
              {tlList.reduce((acc, t) => acc + (t.groups_count || 0), 0)}
            </div>
            <div className="au-stat-lbl">Groupes créés</div>
          </div>
        </div>

        {/* TABS + SEARCH */}
        <div className="au-tabs-bar">
          <div className="au-tabs">
            <button className={`au-tab ${tab === "tl" ? "active" : ""}`} onClick={() => { setTab("tl"); setSearch(""); }}>
              👤 Team Leaders
              <span className="au-tab-badge">{tlList.length}</span>
            </button>
            <button className={`au-tab ${tab === "consultant" ? "active" : ""}`} onClick={() => { setTab("consultant"); setSearch(""); }}>
              🎓 Consultants
              <span className="au-tab-badge">{consList.length}</span>
            </button>
          </div>
          <div className="au-search-wrap">
            <span className="au-search-icon">🔍</span>
            <input
              className="au-search"
              placeholder="Rechercher par nom, email, GGID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* GRID */}
        {loading ? (
          <div className="au-loading">
            <div className="au-spinner" />
            <div className="au-loading-txt">Chargement des utilisateurs…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="au-empty">
            <div className="au-empty-icon">🔍</div>
            <div className="au-empty-text">Aucun utilisateur trouvé</div>
            <div className="au-empty-sub">Essayez une autre recherche ou ajoutez un utilisateur.</div>
          </div>
        ) : (
          <div className="au-grid">
            {filtered.map(u => (
              <div className="au-card" key={u.id}>
                <div className="au-card-body">
                  <div className="au-card-head">
                    <div className="au-avatar-wrap">
                      {photoUrl(u.profile_photo) ? (
                        <img
                          src={photoUrl(u.profile_photo)}
                          alt={`${u.prenom} ${u.nom}`}
                          className="au-avatar"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'grid'; }}
                        />
                      ) : null}
                      <div
                        className="au-avatar-ph"
                        style={{
                          background: gradientFor(u.nom),
                          display: photoUrl(u.profile_photo) ? 'none' : 'grid'
                        }}
                      >
                        {initials(u)}
                      </div>
                      <div className="au-online-dot" />
                    </div>
                    <div className="au-card-meta">
                      <div className="au-card-name">{u.prenom} {u.nom}</div>
                      <div className="au-card-email">{u.email}</div>
                      <span className="au-card-ggid">🔖 {u.ggid}</span>
                    </div>
                  </div>

                  {tab === "tl" && (
                    <div className="au-card-stats">
                      <div className="au-chip">
                        <span className="au-chip-val au-chip-val--purple">{u.courses_count ?? 0}</span>
                        <span className="au-chip-lbl">Cours</span>
                      </div>
                      <div className="au-chip">
                        <span className="au-chip-val au-chip-val--blue">{u.groups_count ?? 0}</span>
                        <span className="au-chip-lbl">Groupes</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="au-card-divider" />

                <div className="au-card-actions">
                  {tab === "tl" && (
                    <button className="au-btn au-btn-view" onClick={() => openView(u)}>
                      👁 Voir
                    </button>
                  )}
                  <button className="au-btn au-btn-edit" onClick={() => openEdit(u)}>
                    ✏️ Modifier
                  </button>
                  <button className="au-btn au-btn-del" onClick={() => handleDelete(u)}>
                    🗑 Suppr.
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      {modal && (modal === "add" || modal === "edit") && (
        <div className="au-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="au-modal">
            <div className="au-modal-header">
              <div className="au-modal-icon">{modal === "add" ? "➕" : "✏️"}</div>
              <div className="au-modal-title-wrap">
                <div className="au-modal-title">
                  {modal === "add" ? "Ajouter" : "Modifier"} un {tab === "tl" ? "Team Leader" : "Consultant"}
                </div>
                <div className="au-modal-sub">
                  {modal === "add" ? "Remplissez les informations du nouveau membre" : `Mise à jour de ${selected?.prenom} ${selected?.nom}`}
                </div>
              </div>
              <button className="au-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="au-modal-divider" />

            <form onSubmit={handleSubmit}>
              <div className="au-modal-body">
                <div className="au-form-row">
                  <div className="au-field">
                    <label>Prénom</label>
                    <input
                      type="text"
                      placeholder="Ex: Ahmed"
                      value={form.prenom}
                      onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="au-field">
                    <label>Nom</label>
                    <input
                      type="text"
                      placeholder="Ex: Benali"
                      value={form.nom}
                      onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="au-field">
                  <label>Adresse e-mail</label>
                  <input
                    type="email"
                    placeholder="exemple@company.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="au-field">
                  <label>GGID</label>
                  <input
                    type="text"
                    placeholder="Identifiant unique"
                    value={form.ggid}
                    onChange={e => setForm(f => ({ ...f, ggid: e.target.value }))}
                    required
                    disabled={modal === "edit"}
                  />
                </div>

                <div className="au-field">
                  <label>{modal === "add" ? "Mot de passe" : "Nouveau mot de passe (optionnel)"}</label>
                  <input
                    type="password"
                    placeholder={modal === "add" ? "Laisser vide = Welcome123!" : "Laisser vide pour ne pas changer"}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  {modal === "add" && (
                    <div className="au-field-note">Si vide, le mot de passe par défaut sera <strong>Welcome123!</strong></div>
                  )}
                </div>
              </div>

              <div className="au-modal-footer">
                <button type="button" className="au-btn-cancel" onClick={closeModal}>Annuler</button>
                <button type="submit" className="au-btn-save" disabled={saving}>
                  {saving ? "Enregistrement…" : modal === "add" ? "Créer le compte" : "Sauvegarder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW TL MODAL ── */}
      {modal === "view" && selected && (
        <div className="au-modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="au-modal">
            <div className="au-modal-header">
              <div className="au-modal-icon">📊</div>
              <div className="au-modal-title-wrap">
                <div className="au-modal-title">Profil Team Leader</div>
                <div className="au-modal-sub">Cours et groupes gérés</div>
              </div>
              <button className="au-modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="au-modal-divider" />

            <div className="au-modal-body">
              {/* TL header card */}
              <div className="au-tl-header-card">
                {photoUrl(selected.profile_photo) ? (
                  <img
                    src={photoUrl(selected.profile_photo)}
                    alt={`${selected.prenom} ${selected.nom}`}
                    style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
                    onError={e => { e.target.style.display='none'; }}
                  />
                ) : (
                  <div className="au-avatar-ph" style={{ background: gradientFor(selected.nom), width: 64, height: 64, fontSize: "1.5rem", borderRadius: 18 }}>
                    {initials(selected)}
                  </div>
                )}
                <div>
                  <div className="au-tl-hname">{selected.prenom} {selected.nom}</div>
                  <div className="au-tl-hemail">{selected.email}</div>
                  <span className="au-card-ggid" style={{ marginTop: 6, display: "inline-flex" }}>🔖 {selected.ggid}</span>
                </div>
              </div>

              {detailLoading ? (
                <div className="au-loading" style={{ padding: 40 }}>
                  <div className="au-spinner" />
                </div>
              ) : tlDetails ? (
                <>
                  {/* Courses */}
                  <div className="au-section-head">
                    <div className="au-section-title">Cours créés</div>
                    <span className="au-section-count">{tlDetails.courses.length}</span>
                  </div>
                  <div className="au-detail-list">
                    {tlDetails.courses.length === 0
                      ? <div className="au-detail-empty">Aucun cours créé pour l'instant</div>
                      : tlDetails.courses.map(c => (
                          <div key={c.id} className="au-detail-item">
                            <span className="au-detail-dot" />
                            {c.title}
                          </div>
                        ))
                    }
                  </div>

                  {/* Groups */}
                  <div className="au-section-head">
                    <div className="au-section-title">Groupes créés</div>
                    <span className="au-section-count">{tlDetails.groups.length}</span>
                  </div>
                  <div className="au-detail-list">
                    {tlDetails.groups.length === 0
                      ? <div className="au-detail-empty">Aucun groupe créé pour l'instant</div>
                      : tlDetails.groups.map(g => (
                          <div key={g.id} className="au-detail-item">
                            <span className="au-detail-dot" style={{ background: "#22c55e" }} />
                            {g.name}
                          </div>
                        ))
                    }
                  </div>
                </>
              ) : (
                <div className="au-detail-empty">Impossible de charger les données.</div>
              )}
            </div>

            <div className="au-modal-footer">
              <button className="au-btn-cancel" onClick={closeModal}>Fermer</button>
              <button className="au-btn-save" style={{ flex: 1 }} onClick={() => { closeModal(); openEdit(selected); }}>
                ✏️ Modifier ce TL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
