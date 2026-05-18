import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/axios.js";
import "./TLCourseCard.css";

const FALLBACK = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80";

const TLCourseCard = ({ course, style, detailBase = "/tl/courses" }) => {
  const navigate = useNavigate();
  const imageUrl = course.image
    ? course.image.startsWith("http")
      ? course.image
      : `${API_BASE_URL}${course.image.startsWith("/") ? course.image : `/${course.image}`}`
    : FALLBACK;

  return (
    <article className="tl-course-card" style={style}>
      <div className="tl-course-card__thumb">
        <img src={imageUrl} alt={course.title} onError={(e) => { e.target.src = FALLBACK; }} />
        <span className="tl-course-card__badge">{course.duration ?? "—"}</span>
        {course.is_mandatory && (
          <span className="tl-course-card__badge" style={{ left: 12, right: "auto", background: "var(--terra, #bd4e28)", color: "#fff", padding: "4px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Obligatoire
          </span>
        )}
      </div>
      <div className="tl-course-card__body">
        <h3 className="tl-course-card__title">{course.title}</h3>
        {typeof course.chapters_count === "number" ? (
          <p className="tl-course-card__exp">{course.chapters_count} chapitre{course.chapters_count !== 1 ? "s" : ""}</p>
        ) : null}
        {course.expiration_date && (
          <p className="tl-course-card__exp">Expire le {new Date(course.expiration_date).toLocaleDateString("fr-FR")}</p>
        )}
        <button type="button" className="tl-course-card__btn" onClick={() => navigate(`${detailBase}/${course.id}`)}>
          Voir le cours
        </button>
      </div>
    </article>
  );
};

export default TLCourseCard;
