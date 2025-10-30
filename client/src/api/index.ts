export { default as api } from "./api.js";
export { default as authAPI } from "./auth.api.js";
export { songApi } from "./song.api.js";
export { artistApi } from "./artist.api.js";
export { commentApi } from "./comment.api.js";
export { userApi } from "./user.api.js";
export { playlistApi } from "./playlist.api.js";
export { albumApi } from "./album.api.js";

export type {
  SignupData,
  LoginData,
  AuthResponse,
  RefreshResponse,
  CurrentUserResponse,
} from "./auth.api.js";
