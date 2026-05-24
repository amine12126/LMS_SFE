import API from "../api/axios.js";

const api = API;

// Courses
export const consultantCourseService = {
  browse: () => api.get("courses/browse/"),
  getOne: (id) => api.get(`courses/browse/${id}/`),
  markProgress: (chapterId, action) => api.post(`courses/chapters/${chapterId}/progress/`, { action }),
  markContentProgress: (contentId) => api.post(`courses/contents/${contentId}/progress/`),
  getStats: () => api.get("courses/consultant-stats/"),
  getMyGroups: () => api.get("courses/my-groups/"),
};

export const courseService = {
  getAll: () => api.get("courses/"),
  getOne: (id) => api.get(`courses/${id}/`),
  create: (formData) => api.post("courses/", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, data) => api.put(`courses/${id}/`, data, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`courses/${id}/`),
};

// Packages
export const packageService = {
  getAll: () => api.get("courses/packages/"),
  getOne: (id) => api.get(`courses/packages/${id}/`),
  create: (data) => api.post("courses/packages/", data),
  update: (id, data) => api.put(`courses/packages/${id}/`, data),
  remove: (id) => api.delete(`courses/packages/${id}/`),
};

// Chapters
export const chapterService = {
  create: (data) => api.post("courses/chapters/", data),
  update: (id, data) => api.put(`courses/chapters/${id}/`, data),
  remove: (id) => api.delete(`courses/chapters/${id}/`),
  reorder: (items) => api.post("courses/chapters/reorder/", items),
};

// Contents
export const contentService = {
  create: (formData) => api.post("courses/contents/", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`courses/contents/${id}/`),
};

// Groups & Stats
export const groupService = {
  getAll: () => api.get("courses/groups/"),
  create: (data) => api.post("courses/groups/", data),
  getOne: (id) => api.get(`courses/groups/${id}/`),
  update: (id, data) => api.put(`courses/groups/${id}/`, data),
  remove: (id) => api.delete(`courses/groups/${id}/`),
  assignCourse: (groupId, courseId) => api.post(`courses/groups/${groupId}/assign-course/`, { course_id: courseId }),
};

export const statsService = {
  getStats: (tab, groupId = null) => {
    let url = `courses/stats/?tab=${tab}`;
    if (groupId) url += `&group_id=${groupId}`;
    return api.get(url);
  },
  getAdminStats: () => api.get("courses/admin-stats/"),
};

export default api;

