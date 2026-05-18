import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { courseService } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import TLCourseCard from "../components/TLCourseCard.jsx";
import AddCourseCard from "../components/AddCourseCard";
import "./TLCoursesPage.css";

const CoursesHero = ({ name, count }) => (
  <div className="courses-hero">
    <div className="courses-hero__inner">
      <div>
        <p className="courses-hero__greeting">Bonjour, {name} 👋</p>
        <h1 className="courses-hero__title">Mes cours</h1>
        <p className="courses-hero__sub">
          Vous gérez actuellement <strong>{count}</strong> cours actif{count !== 1 ? "s" : ""}.
        </p>
      </div>
      <div className="courses-hero__stats">
        <div className="stat-chip">
          <span className="stat-chip__val">{count}</span>
          <span className="stat-chip__label">Cours</span>
        </div>
      </div>
    </div>
  </div>
);

const CoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    courseService
      .getAll()
      .then(({ data }) => setCourses(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => setError("Impossible de charger les cours."))
      .finally(() => setLoading(false));
  }, []);

  const heroName = user?.prenom ?? "Enseignant";

  return (
    <DashboardLayout hero={<CoursesHero name={heroName} count={courses.length} />}>
      <div className="page-enter">
        {error && <p className="error-banner">{error}</p>}

        {loading ? (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        ) : (
          <div className="courses-grid">
            <AddCourseCard />
            {courses.map((course, i) => (
              <TLCourseCard key={course.id} course={course} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CoursesPage;

