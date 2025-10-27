import { useState, memo } from "react";
import { FaXTwitter, FaFacebook, FaReddit, FaEnvelope } from "react-icons/fa6";
import { LuCopy, LuX } from "react-icons/lu";
import styles from "./ShareModal.module.css";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageUrl?: string;
  pageTitle?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  pageUrl = window.location.href,
  pageTitle = document.title,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  interface ShareLink {
    name: string;
    icon: React.ComponentType;
    url: string;
    isEmail?: boolean;
  }

  const shareLinks: ShareLink[] = [
    {
      name: "Twitter",
      icon: FaXTwitter,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        pageUrl
      )}&text=${encodeURIComponent(pageTitle)}`,
    },
    {
      name: "Facebook",
      icon: FaFacebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        pageUrl
      )}`,
    },
    {
      name: "Reddit",
      icon: FaReddit,
      url: `https://reddit.com/submit?url=${encodeURIComponent(
        pageUrl
      )}&title=${encodeURIComponent(pageTitle)}`,
    },
    {
      name: "Email",
      icon: FaEnvelope,
      url: `mailto:?subject=${encodeURIComponent(
        pageTitle
      )}&body=${encodeURIComponent(pageUrl)}`,
      isEmail: true,
    },
  ];

  const handleShareClick = (link: ShareLink): void => {
    if (link.isEmail) {
      window.location.href = link.url;
    } else {
      window.open(
        link.url,
        "_blank",
        "noopener,noreferrer,width=600,height=400"
      );
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Share</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <LuX />
          </button>
        </div>

        <div className={styles.socialIcons}>
          {shareLinks.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.name}
                className={styles.socialButton}
                onClick={() => handleShareClick(link)}
                aria-label={`Share on ${link.name}`}
              >
                <Icon />
                <span className={styles.socialLabel}>{link.name}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.linkSection}>
          <label className={styles.linkLabel}>Page Link</label>
          <div className={styles.linkInputWrapper}>
            <input
              type="text"
              value={pageUrl}
              readOnly
              className={styles.linkInput}
            />
            <button
              className={styles.copyButton}
              onClick={handleCopy}
              aria-label="Copy link"
            >
              <LuCopy />
            </button>
            {copied && <div className={styles.tooltip}>Copied!</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ShareModal);
