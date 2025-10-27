export { default as api } from "./api.js";
export { default as authAPI } from "./auth.api.js";
export { songApi } from "./song.api.js";
export { artistApi } from "./artist.api.js";
export { commentApi } from "./comment.api.js";
export { userApi } from "./user.api.js";

export type {
  SignupData,
  LoginData,
  AuthResponse,
  RefreshResponse,
  CurrentUserResponse,
} from "./auth.api.js";
