import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword } from "../api/user.js";
import { API_BASE_URL } from "../api/axios.js";
import "./AdminProfile.css";

function profilePhotoSrc(profile) {
  const p = profile?.profile_photo;
  if (!p) return null;
  if (typeof p === "string" && (p.startsWith("http://") || p.startsWith("https://"))) return p;
  const path = typeof p === "string" ? p : "";
  if (!path) return null;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function AdminProfile() {
  const [profile, setProfile] = useState({
    email: "",
    nom: "",
    prenom: "",
    ggid: "",
    role: "",
    profile_photo: null,
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setLoadingProfile(true);
    setError("");
    getProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => setError(getErrorMessage(err, "Erreur chargement profil")))
      .finally(() => setLoadingProfile(false));
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

  if (loadingProfile) return <div className="admp-page">Chargement de votre profil...</div>;

  return (
    <div className="admp-page">
      <div className="admp-header">
        <h1 className="admp-title">Mon Profil</h1>
        <p className="admp-desc">Gérez vos informations personnelles et sécurisez votre compte.</p>
      </div>

      {error && <div className="admp-msg admp-msg--error">{error}</div>}
      {success && <div className="admp-msg admp-msg--success">{success}</div>}

      <div className="admp-card">
        <h2 className="admp-section-title">Informations Générales</h2>
        <form onSubmit={handleProfileSubmit}>
          <div className="admp-photo-row">
            <div className="admp-avatar-wrap">
              {(photoPreview || profilePhotoSrc(profile)) ? (
                <img
                  src={photoPreview || profilePhotoSrc(profile)}
                  alt="Avatar"
                  className="admp-avatar"
                />
              ) : (
                <div className="admp-avatar--placeholder" aria-hidden>
                  {profile.prenom?.[0] || profile.nom?.[0] || "A"}
                </div>
              )}
            </div>
            <div className="admp-photo-actions">
              <label className="admp-btn-photo">
                Choisir une photo
                <input type="file" accept="image/*" className="admp-file-input" onChange={handlePhotoChange} />
              </label>
              <p style={{ fontSize: "0.8rem", color: "var(--ink-3)" }}>Format recommandé: Carré, max 2Mo.</p>
            </div>
          </div>

          <div className="admp-grid">
            <div className="admp-field">
              <label htmlFor="nom">Nom de famille</label>
              <input id="nom" type="text" name="nom" value={profile.nom} onChange={handleProfileChange} />
            </div>
            <div className="admp-field">
              <label htmlFor="prenom">Prénom</label>
              <input id="prenom" type="text" name="prenom" value={profile.prenom} onChange={handleProfileChange} />
            </div>
            <div className="admp-field admp-field--full">
              <label htmlFor="email">Adresse e-mail Professionnelle</label>
              <input id="email" type="email" name="email" value={profile.email} onChange={handleProfileChange} />
            </div>
            <div className="admp-field">
              <label htmlFor="ggid">Identifiant GGID</label>
              <input id="ggid" type="text" value={profile.ggid} disabled />
            </div>
            <div className="admp-field">
              <label htmlFor="role">Rôle Système</label>
              <input id="role" type="text" value="Administrateur Central" disabled />
            </div>
          </div>

          <button className="admp-btn-save" type="submit" disabled={savingProfile}>
            {savingProfile ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>

      <div className="admp-card">
        <h2 className="admp-section-title">Sécurité</h2>
        <form onSubmit={handlePasswordSubmit}>
          <div className="admp-grid">
            <div className="admp-field admp-field--full">
              <label htmlFor="old_password">Mot de passe actuel</label>
              <input
                id="old_password"
                type="password"
                name="old_password"
                value={passwordData.old_password}
                onChange={handlePasswordChange}
              />
            </div>
            <div className="admp-field admp-field--full">
              <label htmlFor="new_password">Nouveau mot de passe</label>
              <input
                id="new_password"
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
              />
            </div>
          </div>
          <button className="admp-btn-save" type="submit" disabled={savingPassword}>
            {savingPassword ? "Mise à jour..." : "Modifier mon mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminProfile;
