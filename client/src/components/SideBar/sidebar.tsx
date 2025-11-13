import React, { useState } from 'react';
import styles from './sideBar.module.css';

const Sidebar: React.FC = () => {
    const [activeIcon, setActiveIcon] = useState<string>('home');

    const icons = [
        { id: 'expand', src: '/SideBar/Expand.svg', alt: 'Expand' },
        { id: 'songs', src: '/SideBar/SongOrder.svg', alt: 'Songs' },
        { id: 'playlists', src: '/SideBar/Vector-2.svg', alt: 'Playlists' },
        { id: 'artists', src: '/SideBar/Vector-3.svg', alt: 'Artists' },
        { id: 'albums', src: '/SideBar/Vector-4.svg', alt: 'Albums' },
    ];

    return (
        <div className={styles.sideBarContainer}>
            <div className={styles["sidebar-icons"]}>
                <div className={styles.logoContainer}>
                    <img src="/SideBar/Logo.svg" className={styles.logoIcon} alt="Logo" />
                </div>

                {icons.map(icon => (
                    <div
                        key={icon.id}
                        className={`${styles["sidebar-icon"]} ${activeIcon === icon.id ? styles.active : ''}`}
                        onClick={() => setActiveIcon(icon.id)}
                    >
                        <img src={icon.src} alt={icon.alt} />
                    </div>
                ))}

                <div className={styles.sidebarBottom}>
                    <div className={styles["sidebar-icon"]}>
                        <img src="/SideBar/LogoutButton.svg" alt="Logout" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;