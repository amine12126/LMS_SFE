import { useMemo, useState, useContext } from "react";
import API from "../api/axios.js";
import { AuthContext } from "../auth/AuthContext.js";
import { useNavigate } from "react-router-dom";
import "./AuthPage.css";

function AuthPage() {
  const [portal, setPortal] = useState("consultant"); // consultant | staff (admin/tl)
  const [mode, setMode] = useState("login"); // login | register
  const [step, setStep] = useState("auth"); // auth | forgot
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [forgotForm, setForgotForm] = useState({ email: "" });
  const [registerForm, setRegisterForm] = useState({
    nom: "",
    prenom: "",
    ggid: "",
    niveau: "",
    email: "",
    password: "",
  });

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const portalX = useMemo(() => (portal === "consultant" ? "0%" : "100%"), [portal]);
  const toggleX = useMemo(() => (mode === "login" ? "0%" : "100%"), [mode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await API.post("auth/login/", loginForm);
      // backend returns { tokens: {access, refresh}, role }
      const role = res?.data?.role;
      const portalOk =
        (portal === "consultant" && role === "consultant") ||
        (portal === "staff" && (role === "admin" || role === "tl"));

      if (!portalOk) {
        setError(
          portal === "consultant"
            ? "Ce compte n'est pas consultant. Utilise l’espace Admin/TL."
            : "Ce compte est consultant. Utilise l’espace Consultant."
        );
        return;
      }

      login({ ...res.data, email: loginForm.email });

      // 🔥 REDIRECTION حسب ROLE
      if (res.data.role === "admin") navigate("/admin");
      else if (res.data.role === "tl") navigate("/tl");
      else navigate("/consultant");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Login échoué. Vérifie tes informations.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await API.post("auth/register/", registerForm);
      setSuccess("Compte créé. Tu peux maintenant te connecter.");
      setMode("login");
      setLoginForm({ email: registerForm.email, password: "" });
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.detail ||
        data?.error ||
        (data && typeof data === "object"
          ? Object.values(data).flat().filter(Boolean).join(" | ")
          : null) ||
        "Création du compte échouée.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await API.post("auth/forgot-password/", forgotForm);
      setSuccess("Si cet email existe, un lien de réinitialisation a été envoyé.");
      setStep("auth");
      setMode("login");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        "Impossible d'envoyer l'email.";
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
            <div className="brand-name">Authentification</div>
            <div className="brand-tagline">Connecte-toi pour continuer</div>
          </div>
        </div>

        <div className="auth-toggle auth-toggle--portal" role="tablist" aria-label="Portals">
          <button
            type="button"
            className={`toggle-btn ${portal === "consultant" ? "active" : ""}`}
            onClick={() => {
              setPortal("consultant");
              setStep("auth");
              setMode("login");
              setError("");
              setSuccess("");
            }}
          >
            Consultant
          </button>
          <button
            type="button"
            className={`toggle-btn ${portal === "staff" ? "active" : ""}`}
            onClick={() => {
              setPortal("staff");
              setStep("auth");
              setMode("login");
              setError("");
              setSuccess("");
            }}
          >
            Admin / TL
          </button>
          <span className="toggle-indicator" style={{ transform: `translateX(${portalX})` }} />
        </div>

        {step === "auth" ? (
          portal === "consultant" ? (
            <div className="auth-toggle" role="tablist" aria-label="Auth tabs">
              <button
                type="button"
                className={`toggle-btn ${mode === "login" ? "active" : ""}`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={`toggle-btn ${mode === "register" ? "active" : ""}`}
                onClick={() => setMode("register")}
              >
                Créer compte
              </button>
              <span className="toggle-indicator" style={{ transform: `translateX(${toggleX})` }} />
            </div>
          ) : (
            <div className="staff-hint">
              Espace Admin/TL: connexion uniquement. Les comptes TL/Admin se gèrent via l’admin Django.
            </div>
          )
        ) : null}

        {error ? <div className="error-msg">{error}</div> : null}
        {success ? (
          <div className="success-msg">
            <p>{success}</p>
          </div>
        ) : null}

        <div className="form-container">
          {step === "forgot" ? (
            <div className="form-panel form-panel--visible">
              <div className="form-title">Mot de passe oublié</div>
              <div className="form-subtitle">
                Entre ton email et on t’enverra un lien de réinitialisation.
              </div>

              <form className="auth-form" onSubmit={handleForgot}>
                <div className="form-group">
                  <label htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="ex: user@email.com"
                    value={forgotForm.email}
                    onChange={(e) => setForgotForm({ email: e.target.value })}
                    autoComplete="email"
                    required
                  />
                </div>

                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? <span className="spinner" aria-label="loading" /> : "Envoyer le lien"}
                </button>

                <button
                  className="btn-link"
                  type="button"
                  onClick={() => {
                    setStep("auth");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Retour au login
                </button>
              </form>
            </div>
          ) : null}

          <div
            className={`form-panel ${
              step === "auth" && mode === "login"
                ? "form-panel--visible"
                : "form-panel--hidden form-panel--left"
            }`}
          >
            <div className="form-title">Login</div>
            <div className="form-subtitle">Entre ton email et ton mot de passe.</div>

            <form className="auth-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="ex: user@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="input-row">
                  <input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Ton mot de passe"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    className="icon-btn"
                    type="button"
                    onClick={() => setShowLoginPassword((v) => !v)}
                    aria-label={showLoginPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showLoginPassword ? "Masquer" : "Voir"}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-link" type="button" onClick={() => setStep("forgot")}>
                  Mot de passe oublié ?
                </button>
              </div>

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" aria-label="loading" /> : "Login"}
              </button>
            </form>
          </div>

          <div
            className={`form-panel ${
              portal === "consultant" && step === "auth" && mode === "register"
                ? "form-panel--visible"
                : "form-panel--hidden form-panel--right"
            }`}
          >
            <div className="form-title">Créer un compte</div>
            <div className="form-subtitle">
              La création publique est réservée aux consultants. Les comptes TL/Admin se créent via l’admin Django.
            </div>

            <form className="auth-form" onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="reg-nom">Nom</label>
                <input
                  id="reg-nom"
                  type="text"
                  placeholder="Nom"
                  value={registerForm.nom}
                  onChange={(e) => setRegisterForm({ ...registerForm, nom: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-prenom">Prénom</label>
                <input
                  id="reg-prenom"
                  type="text"
                  placeholder="Prénom"
                  value={registerForm.prenom}
                  onChange={(e) => setRegisterForm({ ...registerForm, prenom: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-ggid">GGID</label>
                <input
                  id="reg-ggid"
                  type="text"
                  placeholder="GGID entreprise"
                  value={registerForm.ggid}
                  onChange={(e) => setRegisterForm({ ...registerForm, ggid: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-niveau">Niveau</label>
                <input
                  id="reg-niveau"
                  type="text"
                  placeholder="Niveau"
                  value={registerForm.niveau}
                  onChange={(e) => setRegisterForm({ ...registerForm, niveau: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="ex: user@email.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <div className="input-row">
                  <input
                    id="reg-password"
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    className="icon-btn"
                    type="button"
                    onClick={() => setShowRegisterPassword((v) => !v)}
                    aria-label={showRegisterPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showRegisterPassword ? "Masquer" : "Voir"}
                  </button>
                </div>
              </div>

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="spinner" aria-label="loading" /> : "Créer compte"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;