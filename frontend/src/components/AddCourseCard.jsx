import { useNavigate } from "react-router-dom";
import "./AddCourseCard.css";

const AddCourseCard = () => {
  const navigate = useNavigate();
  return (
    <button className="add-course-card" onClick={() => navigate("/tl/courses/create")} aria-label="Créer un nouveau cours">
      <span className="add-course-card__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      </span>
      <span className="add-course-card__label">Nouveau cours</span>
    </button>
  );
};

export default AddCourseCard;

