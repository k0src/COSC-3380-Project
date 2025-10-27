// import { WaveformPlayer } from "@components";
// import type { Song, CoverGradient } from "@types";
// import styles from "./SongContainer.module.css";
// import musicPlaceholder from "@assets/music-placeholder.png";
// import { LuPlay, LuThumbsUp, LuMessageSquareText } from "react-icons/lu";

// export interface SongContainerProps {
//   coverGradient: CoverGradient;
// }

// const SongContainer: React.FC = () => {
//   return (
//     <div
//       className={styles.songContainer}
//       style={
//         {
//           "--cover-gradient-color1": `rgba(${coverGradient.color1.r}, ${coverGradient.color1.g}, ${coverGradient.color1.b}, 0.2)`,
//           "--cover-gradient-color2": `rgba(${coverGradient.color2.r}, ${coverGradient.color2.g}, ${coverGradient.color2.b}, 0.2)`,
//         } as React.CSSProperties
//       }
//     >
//       <img
//         src={song.image_url ? song.image_url : musicPlaceholder}
//         alt={`${song.title} Cover`}
//         className={styles.coverImage}
//       />
//       <div className={styles.songRight}>
//         <div className={styles.songInfoContainer}>
//           <span className={styles.artistName}>{mainArtist?.display_name}</span>
//           <span className={styles.songTitle}>{song.title}</span>
//           <div className={styles.interactionsContainer}>
//             <div className={styles.interactionStat}>
//               <LuPlay />
//               <span className={styles.interactionText}>
//                 {song?.streams ?? 0}
//               </span>
//             </div>
//             <div className={styles.interactionStat}>
//               <LuThumbsUp />
//               <span className={styles.interactionText}>{song?.likes ?? 0}</span>
//             </div>
//             <div className={styles.interactionStat}>
//               <LuMessageSquareText />
//               <span className={styles.interactionText}>
//                 {comments ? comments.length : 0}
//               </span>
//             </div>
//           </div>
//         </div>
//         <WaveformPlayer audioSrc={song.audio_url} captureKeyboard={true} />
//       </div>
//     </div>
//   );
// };

// export default SongContainer;
