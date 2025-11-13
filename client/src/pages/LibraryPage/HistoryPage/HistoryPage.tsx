import { memo, useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth, useContextMenu } from "@contexts";
import type {
  ContextMenuAction,
  ContextMenuEntity,
  ContextMenuEntityType,
} from "@contexts";
import type { LibraryPlaylist } from "@types";
import {
  LibraryRecent,
  LibraryPlaylists,
  LibrarySongs,
  LibraryAlbums,
  LibraryArtists,
} from "@components";
import styles from "./HistoryPage.module.css";
import classNames from "classnames";
import {
  LuDisc3,
  LuDiscAlbum,
  LuHistory,
  LuListMusic,
  LuMicVocal,
  LuPlus,
  LuSearch,
  LuX,
  LuPin,
  LuPencil,
  LuTrash,
} from "react-icons/lu";
