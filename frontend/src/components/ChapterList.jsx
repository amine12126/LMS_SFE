import "./ChapterList.css";

const ChapterList = ({ chapters, selectedId, onSelect }) => {
  if (!chapters?.length) {
    return (
      <div className="chapter-list__empty">
        <span>📚</span>
        <p>Aucun chapitre disponible.</p>
      </div>
    );
  }

  return (
    <ol className="chapter-list">
      {chapters.map((ch, i) => {
        const isActive = ch.id === selectedId;
        const types = ch.contents?.length ? [...new Set(ch.contents.map((c) => c.type))] : [];
        return (
          <li key={ch.id} className={`chapter-list__item ${isActive ? "chapter-list__item--active" : ""}`}>
            <button type="button" className="chapter-list__btn" onClick={() => onSelect(isActive ? null : ch)}>
              <span className="chapter-list__num">{String(i + 1).padStart(2, "0")}</span>
              <span className="chapter-list__title">{ch.title}</span>
              <span className="chapter-list__arrow">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <path d="M4 8h8M9 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
            {types.length > 0 ? (
              <div className="chapter-list__pills">
                {types.map((type) => (
                  <span key={type} className={`chapter-list__pill chapter-list__pill--${type}`}>
                    {type === "pdf" ? "📄" : type === "video" ? "🎬" : type === "image" ? "🖼️" : "🔗"}
                    {type}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
};

export default ChapterList;
