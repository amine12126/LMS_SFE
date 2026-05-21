import { useState } from "react";
import { courseService } from "../services/api.js";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout.jsx";
import "./ProfileTL.css";

export default function CreateCourse() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const groupId = searchParams.get("group_id");

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    expiration_date: "",
    image: null,
    is_mandatory: false,
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    if (e.target.name === "image") {
      const file = e.target.files[0];
      if (file) {
        setForm({ ...form, image: file });
        setPreview(URL.createObjectURL(file));
      } else {
        setForm({ ...form, image: null });
        setPreview(null);
      }
    } else if (e.target.name === "is_mandatory") {
      setForm({ ...form, is_mandatory: e.target.checked });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "image") {
        if (v) {
          data.append(k, v);
        }
      } else {
        data.append(k, v);
      }
    });
    
    if (groupId) {
      data.append("group_id", groupId);
    }

    try {
      await courseService.create(data);
      if (groupId) {
        navigate("/tl/groups");
      } else {
        navigate("/tl/courses");
      }
    } catch {
      setError("Impossible de créer le cours.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="profileTlPage">
        <h2 className="profileTlTitle">Créer un cours</h2>
        {error ? <div className="profileTlError">{error}</div> : null}
        <form onSubmit={handleSubmit} className="profileTlCard">
          <div className="profileTlGrid">
            <div className="profileTlField profileTlFieldFull">
              <label>Titre</label>
              <input name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div className="profileTlField profileTlFieldFull">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                style={{ padding: 12, borderRadius: 10, border: "1px solid #cbd5e1" }}
                required
              />
            </div>
            <div className="profileTlField">
              <label>Durée</label>
              <input name="duration" value={form.duration} onChange={handleChange} required />
            </div>
            <div className="profileTlField">
              <label>Date d'expiration</label>
              <input type="date" name="expiration_date" value={form.expiration_date} onChange={handleChange} required />
            </div>
            <div className="profileTlField profileTlFieldFull">
              <label>Image</label>
              <input type="file" name="image" accept="image/*" onChange={handleChange} />
            </div>
            <div className="profileTlField profileTlFieldFull" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input 
                type="checkbox" 
                name="is_mandatory" 
                id="is_mandatory" 
                checked={form.is_mandatory} 
                onChange={handleChange} 
                style={{ width: 20, height: 20 }}
              />
              <label htmlFor="is_mandatory" style={{ margin: 0, cursor: "pointer", color: "var(--terra)", fontWeight: 600 }}>
                Marquer comme formation obligatoire
              </label>
            </div>
          </div>
          {preview ? <img src={preview} alt="preview" style={{ marginTop: 12, maxWidth: 220, borderRadius: 12 }} /> : null}
          <button className="profileTlBtn" disabled={saving}>
            {saving ? "Création..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}