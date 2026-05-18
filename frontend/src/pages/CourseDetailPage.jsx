import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { consultantCourseService } from "../services/api";
import { API_BASE_URL } from "../api/axios.js";
import ChapterList from "../components/ChapterList";
import TeacherCard from "../components/TeacherCard";
import ChapterViewer from "../components/ChapterViewer";
import "./CourseDetailPage.css";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80";

const DetailSkeleton = () => (
  <div className="cdp-skeleton">
    <div className="skeleton" style={{ height: 56, width: "60%", borderRadius: 8 }} />
    <div className="skeleton" style={{ height: 20, width: "80%", borderRadius: 6, marginTop: 12 }} />
    <div className="skeleton" style={{ height: 20, width: "55%", borderRadius: 6, marginTop: 6 }} />
    <div className="cdp-skeleton__columns">
      <div className="skeleton" style={{ height: 260, borderRadius: 16 }} />
      <div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10, marginBottom: 8 }} />
        ))}
      </div>
    </div>
  </div>
);

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    consultantCourseService
      .getOne(id)
      .then(({ data }) => {
        setCourse(data);
        setSelectedChapter(null);
        setSelectedIndex(null);
      })
      .catch(() => setError("Impossible de charger ce cours."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelectChapter = (chapter) => {
    if (!chapter) {
      setSelectedChapter(null);
      setSelectedIndex(null);
      return;
    }
    const idx = course?.chapters?.findIndex((c) => c.id === chapter.id) ?? 0;
    setSelectedChapter(chapter);
    setSelectedIndex(idx);
  };

  const imageUrl = course?.image
    ? course.image.startsWith("http")
      ? course.image
      : `${API_BASE_URL}${course.image.startsWith("/") ? course.image : `/${course.image}`}`
    : FALLBACK_IMG;

  const publishedDate = course?.created_at
    ? new Date(course.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="cdp">
      <main className="cdp-main page-enter">
        <button type="button" className="cdp-back" onClick={() => navigate("/consultant/courses")}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
            <path d="M13 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Retour aux cours
        </button>

        {error ? <p className="error-banner">{error}</p> : null}

        {loading ? (
          <DetailSkeleton />
        ) : (
          course && (
            <>
              <div className="cdp-columns">
                <aside className="cdp-col-teacher">
                  <TeacherCard teacher={course.teacher ?? null} />
                </aside>

                <div className="cdp-col-main">
                  <div className="cdp-header">
                    <div className="cdp-header__content">
                      <div className="cdp-header__chips">
                        {course.duration ? (
                          <span className="cdp-chip">
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="11" height="11">
                              <circle cx="8" cy="8" r="6.5" />
                              <path d="M8 4.5V8l2.5 1.5" strokeLinecap="round" />
                            </svg>
                            {course.duration}
                          </span>
                        ) : null}
                        <span className="cdp-chip cdp-chip--count">
                          {course.chapters?.length ?? 0} chapitre{course.chapters?.length !== 1 ? "s" : ""}
                        </span>
                        {publishedDate ? <span className="cdp-chip">Publié le {publishedDate}</span> : null}
                        {course.expiration_date ? (
                          <span className="cdp-chip cdp-chip--warn">
                            Expire le {new Date(course.expiration_date).toLocaleDateString("fr-FR")}
                          </span>
                        ) : null}
                      </div>

                      <h1 className="cdp-header__title">{course.title}</h1>
                      {course.description ? <p className="cdp-header__desc">{course.description}</p> : null}
                    </div>

                    <div className="cdp-header__img">
                      <img src={imageUrl} alt={course.title} onError={(e) => { e.target.src = FALLBACK_IMG; }} />
                    </div>
                  </div>

                  <div className="cdp-sidebar__card cdp-chapters-card">
                    <h2 className="cdp-sidebar__heading">
                      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" width="17" height="17">
                        <path d="M4 6h12M4 10h8M4 14h10" strokeLinecap="round" />
                      </svg>
                      Chapitres
                    </h2>
                    <ChapterList chapters={course.chapters} selectedId={selectedChapter?.id} onSelect={handleSelectChapter} />
                  </div>

                  {selectedChapter ? (
                    <section className="cdp-viewer-section">
                      <ChapterViewer chapter={selectedChapter} index={selectedIndex} />
                    </section>
                  ) : null}
                </div>
              </div>
            </>
          )
        )}
      </main>
    </div>
  );
};

export default CourseDetailPage;
