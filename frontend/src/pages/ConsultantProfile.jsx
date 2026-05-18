import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword } from "../api/user.js";
import { API_BASE_URL } from "../api/axios.js";
import SaveFaceModal from "../components/FaceVerification/SaveFaceModal";
import "./ConsultantProfile.css";

function profilePhotoSrc(profile) {
  const p = profile?.profile_photo;
  if (!p) return null;
  if (typeof p === "string" && (p.startsWith("http://") || p.startsWith("https://"))) return p;
  const path = typeof p === "string" ? p : "";
  if (!path) return null;
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${safePath}`;
}

function getInitials(nom, prenom) {
  const n = nom ? nom.charAt(0).toUpperCase() : "";
  const p = prenom ? prenom.charAt(0).toUpperCase() : "";
  return `${p}${n}` || "👤";
}

export default function ConsultantProfile() {
  const [profile, setProfile] = useState({
    email: "",
    nom: "",
    prenom: "",
    ggid: "",
    niveau: "",
    role: "",
    profile_photo: null,
    has_face_registered: false,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showFaceModal, setShowFaceModal] = useState(false);

  const getErrorMessage = (err, fallback) => {
    const data = err?.response?.data;
    if (!data) return fallback;
    if (data.detail) return data.detail;
    if (typeof data === "object") {
      const merged = Object.values(data).flat().filter(Boolean).join(" | ");
      if (merged) return merged;
    }
    return fallback;
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    getProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => setError(getErrorMessage(err, "Impossible de charger le profil.")))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const f = e.target.files?.[0];
    setPhotoFile(f || null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingProfile(true);
    try {
      const fd = new FormData();
      fd.append("email", profile.email);
      fd.append("nom", profile.nom);
      fd.append("prenom", profile.prenom);
      if (photoFile) fd.append("profile_photo", photoFile);
      
      const res = await updateProfile(fd);
      setProfile(res.data);
      setPhotoFile(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setSuccess("Profil mis à jour avec succès.");
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors de la mise à jour du profil."));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSavingPassword(true);
    try {
      await changePassword(passwordData);
      setSuccess("Mot de passe changé avec succès.");
      setPasswordData({ old_password: "", new_password: "" });
    } catch (err) {
      setError(getErrorMessage(err, "Erreur lors du changement du mot de passe."));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="cp-page">
        <div className="cp-spinner-wrap">
          <div className="cp-spinner" />
        </div>
      </div>
    );
  }

  const currentAvatarUrl = photoPreview || profilePhotoSrc(profile);

  return (
    <div className="cp-page page-enter">
      {error && <div className="cp-alert cp-alert--error">{error}</div>}
      {success && <div className="cp-alert cp-alert--success">{success}</div>}

      {/* BLOCK 1: PROFILE INFO */}
      <form className="cp-card" onSubmit={handleProfileSubmit}>
        <h2 className="cp-card-title">Informations Personnelles</h2>
        
        <div className="cp-photo-section">
          <div className="cp-avatar-wrapper">
            {currentAvatarUrl ? (
              <img src={currentAvatarUrl} alt="Profil" className="cp-avatar" />
            ) : (
              <div className="cp-avatar-initials">
                {getInitials(profile.nom, profile.prenom)}
              </div>
            )}
          </div>
          <div className="cp-photo-actions">
            <label className="cp-btn-file">
              Changer la photo
              <input type="file" accept="image/*" className="cp-file-input" onChange={handlePhotoChange} />
            </label>
            <p className="cp-photo-hint">Format JPEG ou PNG (max 5MB)</p>
          </div>
        </div>

        <div className="cp-grid">
          <div className="cp-field">
            <label htmlFor="nom">Nom</label>
            <input className="cp-input" id="nom" type="text" name="nom" value={profile.nom} onChange={handleProfileChange} />
          </div>
          <div className="cp-field">
            <label htmlFor="prenom">Prénom</label>
            <input className="cp-input" id="prenom" type="text" name="prenom" value={profile.prenom} onChange={handleProfileChange} />
          </div>
          <div className="cp-field">
            <label htmlFor="email">Email</label>
            <input className="cp-input" id="email" type="email" name="email" value={profile.email} onChange={handleProfileChange} />
          </div>
          <div className="cp-field">
            <label htmlFor="ggid">GGID</label>
            <input className="cp-input" id="ggid" type="text" value={profile.ggid || ""} disabled />
          </div>
          <div className="cp-field">
            <label htmlFor="niveau">Niveau</label>
            <input className="cp-input" id="niveau" type="text" value={profile.niveau || ""} disabled />
          </div>
          <div className="cp-field">
            <label htmlFor="role">Rôle</label>
            <input className="cp-input" id="role" type="text" value={profile.role || ""} disabled />
          </div>
        </div>

        <button className="cp-btn-submit" type="submit" disabled={savingProfile}>
          {savingProfile ? "Mise à jour..." : "Enregistrer les modifications"}
        </button>
      </form>

      {/* BLOCK 2: PASSWORD CHANGE */}
      <form className="cp-card" onSubmit={handlePasswordSubmit}>
        <h2 className="cp-card-title">Sécurité & Mot de passe</h2>
        
        <div className="cp-grid-password">
          <div className="cp-field">
            <label htmlFor="old_password">Ancien mot de passe</label>
            <input
              className="cp-input"
              id="old_password"
              type="password"
              name="old_password"
              value={passwordData.old_password}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <div className="cp-field">
            <label htmlFor="new_password">Nouveau mot de passe</label>
            <input
              className="cp-input"
              id="new_password"
              type="password"
              name="new_password"
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              required
            />
          </div>
        </div>

        <button className="cp-btn-submit" type="submit" disabled={savingPassword}>
          {savingPassword ? "Changement..." : "Mettre à jour le mot de passe"}
        </button>
      </form>

      {/* BLOCK 3: FACE RECOGNITION */}
      {!profile.has_face_registered && (
        <div className="cp-card">
          <h2 className="cp-card-title">Sécurité Biométrique</h2>
          <p style={{ color: "var(--ink-2)", fontSize: "14px", marginBottom: "16px" }}>
            Configurez votre reconnaissance faciale pour pouvoir accéder de manière sécurisée aux groupes qui vous sont assignés.
          </p>
          <button 
            type="button"
            onClick={() => setShowFaceModal(true)}
            style={{ padding: "12px 24px", background: "#3b9eff", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            👤 Configurer la reconnaissance faciale
          </button>
        </div>
      )}

      {showFaceModal && (
        <SaveFaceModal 
          onSuccess={() => {
            setShowFaceModal(false);
            setProfile(prev => ({ ...prev, has_face_registered: true }));
          }}
          onClose={() => setShowFaceModal(false)}
        />
      )}
    </div>
  );
}
