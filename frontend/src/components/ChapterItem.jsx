import { useState } from "react";
import { chapterService } from "../services/api.js";

export default function ChapterItem({ chapter, refresh, index }) {
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(chapter.title);

  const handleDelete = async () => {
    if (!window.confirm("Delete chapter?")) return;
    await chapterService.remove(chapter.id);
    refresh();
  };

  const handleUpdate = async () => {
    await chapterService.update(chapter.id, { ...chapter, title });
    setEdit(false);
    refresh();
  };

  return (
    <div className="bg-white p-3 shadow mb-3">

      <div className="flex justify-between">
        <div>
          <strong>{index + 1}. </strong>

          {edit ? (
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          ) : (
            chapter.title
          )}
        </div>

        <div>
          {edit ? (
            <button onClick={handleUpdate}>Save</button>
          ) : (
            <button onClick={() => setEdit(true)}>Edit</button>
          )}

          <button onClick={handleDelete} className="text-red-500">
            Delete
          </button>
        </div>
      </div>

      {(chapter.contents?.length > 0 || chapter.content) && (
        <p className="text-sm text-green-600">
          ✔{" "}
          {(chapter.contents && chapter.contents.length
            ? chapter.contents.map((c) => c.type).join(", ")
            : chapter.content?.type)}
        </p>
      )}
    </div>
  );
}