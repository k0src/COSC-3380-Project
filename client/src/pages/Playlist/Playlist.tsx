// import React, { useState } from "react";
// import { Helmet } from "react-helmet-async";
// import styles from "./Playlist.module.css";
// import type { Playlist } from "@types";

// // import Sidebar from "../../components/SideBar/sidebar";
// // import Topbar from "../../components/TopBar/topBar";
// // import PlayerBar from "../../components/PlayerBar/playerBar";
// // import { usePlayer } from "@contexts";

// const Playlist: React.FC = () => {
//   // Local mock songs for UI-only work. Replace with real data when backend is ready.
//   const [songs] = useState<Array<any>>([
//     {
//       id: "1",
//       title: "Crimson Skies",
//       artist: "Night Drive",
//       album: "Midnight EP",
//       duration: "3:42",
//       image_url: "/PlayerBar/Mask group.png",
//       streams: "1.2M",
//     },
//     {
//       id: "2",
//       title: "Neon Boulevard",
//       artist: "City Lights",
//       album: "Neon Dreams",
//       duration: "4:05",
//       image_url: "/PlayerBar/Mask group.png",
//       streams: "856K",
//     },
//     {
//       id: "3",
//       title: "Late Night Code",
//       artist: "Debugger",
//       album: "Compile",
//       duration: "2:58",
//       image_url: "/PlayerBar/Mask group.png",
//       streams: "412K",
//     },
//     {
//       id: "4",
//       title: "Sunday Loops",
//       artist: "Sampler",
//       album: "Looped",
//       duration: "5:12",
//       image_url: "/PlayerBar/Mask group.png",
//       streams: "98K",
//     },
//   ]);

//   const { playSong, current, playing, togglePlay } = usePlayer();
//   const [liked, setLiked] = useState<Record<string, boolean>>({});
//   const [openMenu, setOpenMenu] = useState<string | null>(null);

//   const toggleLike = (id: string) => {
//     setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
//   };

//   const toggleMenu = (id: string) => {
//     setOpenMenu((prev) => (prev === id ? null : id));
//   };

//   const handlePlayAll = () => {
//     if (songs.length > 0) {
//       playSong(songs[0]);
//     }
//   };

//   const handlePlay = (s: any) => playSong(s);

//   return (
//     <>
//       <Helmet>
//         <title>Playlist</title>
//       </Helmet>

//       <main className={styles.contentWrapper}>
//         <section className={styles.playlistHeader}>
//           <div className={styles.cover}>
//             <img src="/PlayerBar/Mask group.png" alt="cover" />
//           </div>

//           <div className={styles.playlistInfo}>
//             <h1 className={styles.playlistTitle}>Chill Vibes</h1>
//             <div className={styles.playlistOwner}>curated by you</div>

//             <div className={styles.controls}>
//               <button className={styles.playBtn} aria-label="Play" onClick={handlePlayAll}>
//                 <img src="/PlayerBar/Play.svg" alt="Play" />
//                 <span className={styles.playText}>Play</span>
//               </button>
//               <button className={styles.shuffleBtn} aria-label="Shuffle">
//                 <img src="/PlayerBar/MixSong.svg" alt="Shuffle" />
//               </button>
//             </div>
//           </div>
//         </section>

//         <div className={styles.divider} />

//         <section className={styles.songList}>
//           {/* header labels removed for a cleaner look */}

//           {songs.map((s: any, idx: number) => {
//             const isCurrent = current && String(current.id) === String(s.id) && playing;
//             const likedState = !!liked[s.id];
//             return (
//             <div
//               key={s.id}
//               className={styles.songRow}
//               onDoubleClick={() => handlePlay(s)}
//               title={`Double-click to play ${s.title}`}>
//               <div
//                 className={styles.trackNum}
//                 onClick={() => handlePlay(s)}
//                 role="button"
//                 aria-label={`Play ${s.title}`}>
//                 <span className="numLabel">{idx + 1}</span>
//               </div>

//               <div className={styles.songMain}>
//                 <div className={styles.songThumb}>
//                   <img src={s.image_url} alt={`${s.title} cover`} />
//                 </div>
//                 <div className={styles.songMeta}>
//                   <div className={styles.songTitle}>{s.title}</div>
//                   <div className={styles.songArtist}>{s.artist} <span className={styles.dot}>•</span> <span className={styles.album}>{s.album}</span></div>
//                 </div>
//               </div>

//               <div className={styles.songExtra}>
//                 {/* play button placed next to streams/duration */}
//                 {(() => {
//                   const isPlayingThis = current && String(current.id) === String(s.id) && playing;
//                   const handleSideClick = (e: React.MouseEvent) => {
//                     e.stopPropagation();
//                     if (isPlayingThis) {
//                       // pause
//                       togglePlay();
//                     } else {
//                       // play this song
//                       playSong(s);
//                     }
//                   };

//                   return (
//                     <button
//                       className={`${styles.sidePlayBtn} ${isPlayingThis ? styles.sidePlayActive : ''}`}
//                       onClick={handleSideClick}
//                       aria-label={isPlayingThis ? `Pause ${s.title}` : `Play ${s.title}`}
//                     >
//                       {/* swap SVG depending on state */}
//                       {isPlayingThis ? (
//                         <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
//                           <rect x="1" y="1" width="3" height="12" fill="currentColor" rx="0.5" />
//                           <rect x="7" y="1" width="3" height="12" fill="currentColor" rx="0.5" />
//                         </svg>
//                       ) : (
//                         <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
//                           <path d="M1 1L11 7L1 13V1Z" fill="currentColor" />
//                         </svg>
//                       )}
//                     </button>
//                   );
//                 })()}

//                 <div className={styles.streams}>{s.streams}</div>
//                 <div className={styles.songDuration}>{s.duration}</div>
//               </div>

//               <div className={styles.songActions}>
//                 <button
//                   onClick={() => toggleLike(s.id)}
//                   className={`${styles.likeBtn} ${likedState ? styles.liked : ''}`}
//                   aria-pressed={likedState}
//                   aria-label={likedState ? `Unlike ${s.title}` : `Like ${s.title}`}
//                 >
//                   {likedState ? '♥' : '♡'}
//                 </button>

//                 {/* show equalizer inside the track number instead of right-side play button */}
//                 {isCurrent && (
//                   <div style={{ marginRight: 8 }}>
//                     {/* apply both classes from the CSS module: equalizer + red */}
//                     <span className={`${styles.equalizer} ${styles.red} equalizer--local`} aria-hidden>
//                       <div></div>
//                       <div></div>
//                       <div></div>
//                     </span>
//                   </div>
//                 )}

//                 <div className={styles.menuWrapper}>
//                   <button className={styles.menuBtn} onClick={() => toggleMenu(s.id)} aria-label="More">⋯</button>
//                   {openMenu === s.id && (
//                     <div className={styles.menuPopover} role="menu">
//                       <button role="menuitem">Add to queue</button>
//                       <button role="menuitem">Add to playlist</button>
//                       <button role="menuitem">Share</button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           );
//           })}
//         </section>
//       </main>

//     </>
//   );
// };

// export default Playlist;