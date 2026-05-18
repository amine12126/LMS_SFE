import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/axios.js";
import "./CourseCard.css";

const FALLBACK = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80";

export const CourseCardSkeleton = () => (
  <div className="c-card c-card--skeleton">
    <div className="skeleton c-card__thumb-sk" />
    <div className="c-card__body">
      <div className="skeleton" style={{ height: 18, width: "75%", borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 13, width: "50%", borderRadius: 4, marginTop: 8 }} />
      <div className="skeleton" style={{ height: 13, width: "40%", borderRadius: 4, marginTop: 4 }} />
      <div className="skeleton" style={{ height: 36, width: 100, borderRadius: 50, marginTop: 16 }} />
    </div>
  </div>
);

const CourseCard = ({ course, style, coursesBasePath = "/consultant/courses" }) => {
  const navigate = useNavigate();

  const imageUrl = course.image
    ? course.image.startsWith("http")
      ? course.image
      : `${API_BASE_URL}${course.image.startsWith("/") ? course.image : `/${course.image}`}`
    : FALLBACK;

  const publishedDate = course.created_at
    ? new Date(course.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <article className="c-card" style={style}>
      <div className="c-card__thumb">
        <img src={imageUrl} alt={course.title} onError={(e) => { e.target.src = FALLBACK; }} />
        {course.duration && (
          <span className="c-card__duration-badge">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" width="11" height="11">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" />
            </svg>
            {course.duration}
          </span>
        )}
        {course.is_mandatory && (
          <span className="c-card__mandatory-badge" style={{ position: "absolute", top: 12, right: 12, background: "var(--terra, #bd4e28)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            Obligatoire
          </span>
        )}
      </div>

      <div className="c-card__body">
        <h3 className="c-card__title">{course.title}</h3>

        <div className="c-card__meta">
          {course.teacher_name && (
            <span className="c-card__meta-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
                <circle cx="8" cy="5" r="3" />
                <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
              </svg>
              {course.teacher_name}
            </span>
          )}
          {publishedDate && (
            <span className="c-card__meta-item">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="12" height="12">
                <rect x="1" y="3" width="14" height="12" rx="2" />
                <path d="M1 7h14M5 1v4M11 1v4" strokeLinecap="round" />
              </svg>
              {publishedDate}
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn btn--terra c-card__cta"
          onClick={() => navigate(`${coursesBasePath}/${course.id}`)}
        >
          Voir le cours
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" width="13" height="13">
            <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </article>
  );
};

export default CourseCard;
