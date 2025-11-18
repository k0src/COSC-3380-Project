export { default as api } from "./api.js";
export { default as authAPI } from "./auth.api.js";
export { songApi } from "./song.api.js";
export { artistApi } from "./artist.api.js";
export { commentApi } from "./comment.api.js";
export { userApi } from "./user.api.js";
export { playlistApi } from "./playlist.api.js";
export { albumApi } from "./album.api.js";
export { searchApi } from "./search.api.js";
export { libraryApi } from "./library.api.js";
export { notificationsApi } from "./notifications.api.js";
export { reportApi } from "./report.api.js";

export type {
  SignupData,
  LoginData,
  AuthResponse,
  RefreshResponse,
  CurrentUserResponse,
} from "./auth.api.js";
