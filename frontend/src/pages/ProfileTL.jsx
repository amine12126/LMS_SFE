import { useEffect, useState } from "react";
import { getProfile, updateProfile, changePassword } from "../api/user.js";
import { API_BASE_URL } from "../api/axios.js";
import NavbarTL from "../components/NavbarTL.jsx";
import "./ProfileTL.css";

function profilePhotoSrc(profile) {
  const p = profile?.profile_photo;
  if (!p) return null;
  if (typeof p === "string" && (p.startsWith("http://") || p.startsWith("https://"))) return p;
  const path = typeof p === "string" ? p : "";
  if (!path) return null;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function ProfileTL() {
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

  // load profile
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

  return (
    <>
      <NavbarTL />
      <div className="profileTlPage">
        <h2 className="profileTlTitle">Mon Profil TL</h2>

        {error ? <div className="profileTlError">{error}</div> : null}
        {success ? <div className="profileTlSuccess">{success}</div> : null}

        {loadingProfile ? <p className="profileTlInfo">Chargement du profil...</p> : null}

        <form className="profileTlCard" onSubmit={handleProfileSubmit}>
          <h3>Informations</h3>

          <div className="profileTlPhotoRow">
            <div className="profileTlAvatarWrap">
              {(photoPreview || profilePhotoSrc(profile)) ? (
                <img
                  src={photoPreview || profilePhotoSrc(profile)}
                  alt=""
                  className="profileTlAvatar"
                />
              ) : (
                <div className="profileTlAvatar profileTlAvatar--placeholder" aria-hidden>
                  {profile.prenom?.[0] || profile.nom?.[0] || "?"}
                </div>
              )}
            </div>
            <div className="profileTlPhotoActions">
              <label className="profileTlBtn profileTlBtn--secondary profileTlPhotoLabel">
                Changer la photo
                <input type="file" accept="image/*" className="profileTlFileInput" onChange={handlePhotoChange} />
              </label>
              <p className="profileTlHint">JPEG, PNG ou WebP. Visible par les consultants sur la fiche cours.</p>
            </div>
          </div>

          <div className="profileTlGrid">
            <div className="profileTlField">
              <label htmlFor="nom">Nom</label>
              <input id="nom" type="text" name="nom" value={profile.nom} onChange={handleProfileChange} />
            </div>

            <div className="profileTlField">
              <label htmlFor="prenom">Prénom</label>
              <input id="prenom" type="text" name="prenom" value={profile.prenom} onChange={handleProfileChange} />
            </div>

            <div className="profileTlField profileTlFieldFull">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" value={profile.email} onChange={handleProfileChange} />
            </div>

            <div className="profileTlField">
              <label htmlFor="ggid">GGID</label>
              <input id="ggid" type="text" value={profile.ggid} disabled />
            </div>

            <div className="profileTlField">
              <label htmlFor="role">Rôle</label>
              <input id="role" type="text" value={profile.role} disabled />
            </div>
          </div>

          <button className="profileTlBtn" type="submit" disabled={savingProfile}>
            {savingProfile ? "Mise à jour..." : "Mettre à jour"}
          </button>
        </form>

        <form className="profileTlCard" onSubmit={handlePasswordSubmit}>
          <h3>Changer mot de passe</h3>

          <div className="profileTlGrid">
            <div className="profileTlField profileTlFieldFull">
              <label htmlFor="old_password">Ancien mot de passe</label>
              <input
                id="old_password"
                type="password"
                name="old_password"
                value={passwordData.old_password}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="profileTlField profileTlFieldFull">
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

          <button className="profileTlBtn" type="submit" disabled={savingPassword}>
            {savingPassword ? "Changement..." : "Changer mot de passe"}
          </button>
        </form>
      </div>
    </>
  );
}

export default ProfileTL;