import api from "./api";
import type { Song, UUID } from "../types";

export const songApi = {
  async getSongById(id: UUID) {
    const response = await api.get<Song>(`/songs/${id}`);
    return response.data;
  },
};
