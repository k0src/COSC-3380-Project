import type { Song, Album, LibraryPlaylist, Artist } from "@types";

export interface LibrarySearchResults {
  songs: Song[];
  albums: Album[];
  playlists: LibraryPlaylist[];
  artists: Artist[];
}

export interface RecentlyPlayedItems {
  songs: Song[];
  albums: Album[];
  playlists: LibraryPlaylist[];
  artists: Artist[];
}
