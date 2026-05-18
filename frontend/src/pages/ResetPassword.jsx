import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios.js";
import "./AuthPage.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({ password: "", confirmPassword: "" });

  const tokenOk = useMemo(() => typeof token === "string" && token.length > 10, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!tokenOk) {
      setError("Token invalide.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Mot de passe trop court (min 6 caractères).");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await API.post("auth/reset-password/", { token, password: form.password });
      setSuccess("Mot de passe mis à jour. Tu peux te connecter.");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.detail ||
        data?.error ||
        (data && typeof data === "object"
          ? Object.values(data).flat().filter(Boolean).join(" | ")
          : null) ||
        "Impossible de réinitialiser le mot de passe.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-orb bg-orb--1" />
      <div className="bg-orb bg-orb--2" />
      <div className="bg-orb bg-orb--3" />

      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="36" height="36" rx="12" fill="#6366F1" />
              <path
                d="M16 26.5c3.4-4.6 7.3-6.8 16-8.5"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M19 33c5.4-0.5 9.7-2.3 14-6.2"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>
          </div>
          <div>
            <div className="brand-name">Réinitialiser</div>
            <div className="brand-tagline">Choisis un nouveau mot de passe</div>
          </div>
        </div>

        {error ? <div className="error-msg">{error}</div> : null}
        {success ? (
          <div className="success-msg">
            <p>{success}</p>
          </div>
        ) : null}

        <div className="form-title">Nouveau mot de passe</div>
        <div className="form-subtitle">
          Entre ton nouveau mot de passe. Ensuite tu seras redirigé vers le login.
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-password">Password</label>
            <div className="input-row">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                autoComplete="new-password"
                required
              />
              <button
                className="icon-btn"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? "Masquer" : "Voir"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm</label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              placeholder="Confirme le mot de passe"
              value={form.confirmPassword}
              onChange={(e) => setForm((s) => ({ ...s, confirmPassword: e.target.value }))}
              autoComplete="new-password"
              required
            />
          </div>

          <button className="btn-primary" type="submit" disabled={loading || !tokenOk}>
            {loading ? <span className="spinner" aria-label="loading" /> : "Mettre à jour"}
          </button>

          <button className="btn-link" type="button" onClick={() => navigate("/login")}>
            Retour au login
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;

