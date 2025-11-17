import type {
  Song,
  Album,
  LibraryPlaylist,
  Artist,
  LibrarySong,
  LibraryAlbum,
  LibraryArtist,
} from "@types";

export interface LibrarySearchResults {
  songs: Song[];
  albums: Album[];
  playlists: LibraryPlaylist[];
  artists: Artist[];
}

export interface RecentlyPlayedItems {
  songs: LibrarySong[];
  albums: LibraryAlbum[];
  playlists: LibraryPlaylist[];
  artists: LibraryArtist[];
}

export type RecentlyPlayedItemsArray = Array<
  LibrarySong | LibraryAlbum | LibraryPlaylist | LibraryArtist
>;
