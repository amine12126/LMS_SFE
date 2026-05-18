import API from "./axios.js";

// 🔥 récupérer profil
export const getProfile = () => API.get("users/profile/");

// 🔥 modifier profil (objet JSON ou FormData avec profile_photo)
export const updateProfile = (data) => API.put("users/profile/", data);

// 🔥 changer mot de passe
export const changePassword = (data) =>
  API.post("users/profile/change-password/", data);

// 🔥 lister les consultants
export const getConsultants = () => API.get("users/consultants/");

// 🔥 lister les TLs (Admin only)
export const getTLs = () => API.get("users/tls/");

// 🔥 ajouter un utilisateur (Admin only)
export const addUser = (data) => API.post("users/manage/", data);

// 🔥 modifier un utilisateur (Admin only)
export const updateUser = (id, data) => API.put(`users/manage/${id}/`, data);

// 🔥 supprimer un utilisateur (Admin only)
export const deleteUser = (id) => API.delete(`users/manage/${id}/`);

// 🔥 voir détails d'un TL (Admin only)
export const getTLDetails = (id) => API.get(`users/tl-details/${id}/`);

// 🔥 Enregistrer le visage
export const saveFace = (data) => API.post("auth/save-face/", data);
