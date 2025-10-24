import api from "./api";
import type { Song, UUID } from "../types";

// const API_BASE_URL = import.meta.env.VITE_API_URL;

export const songApi = {
  async getSongById(id: UUID) {
    const response = await api.get<Song>(`/api/songs/${id}`);
    return response.data;
  },
};
