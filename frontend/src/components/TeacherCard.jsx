import { API_BASE_URL } from "../api/axios.js";
import "./TeacherCard.css";

const AVATAR_FALLBACK = "https://ui-avatars.com/api/?background=c4602a&color=fff&bold=true&size=128&name=";

const TeacherCard = ({ teacher }) => {
  if (!teacher) return null;

  const displayName =
    teacher.name?.trim() ||
    `${teacher.prenom ?? ""} ${teacher.nom ?? ""}`.trim() ||
    teacher.email ||
    "Enseignant";

  const avatarSrc = teacher.photo
    ? teacher.photo.startsWith("http")
      ? teacher.photo
      : `${API_BASE_URL}${teacher.photo.startsWith("/") ? teacher.photo : `/${teacher.photo}`}`
    : `${AVATAR_FALLBACK}${encodeURIComponent(displayName)}`;

  return (
    <div className="teacher-card">
      <div className="teacher-card__header">
        <p className="teacher-card__eyebrow">Votre enseignant</p>
        <h3 className="teacher-card__name">{displayName}</h3>
      </div>

      <div className="teacher-card__profile">
        <div className="teacher-card__avatar-wrap">
          <img
            src={avatarSrc}
            alt=""
            className="teacher-card__avatar"
            onError={(e) => {
              e.target.src = `${AVATAR_FALLBACK}${encodeURIComponent(displayName)}`;
            }}
          />
          <span className="teacher-card__status-dot" title="Actif" />
        </div>
        <div>
          <p className="teacher-card__role">Teacher Lead</p>
          {teacher.email ? <p className="teacher-card__email">{teacher.email}</p> : null}
        </div>
      </div>

      {teacher.bio ? <p className="teacher-card__bio">{teacher.bio}</p> : null}

      <div className="teacher-card__divider" />
      <p className="teacher-card__note">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 6v4M8 5v.5" strokeLinecap="round" />
        </svg>
        Sélectionnez un chapitre pour commencer votre apprentissage.
      </p>
    </div>
  );
};

export default TeacherCard;
