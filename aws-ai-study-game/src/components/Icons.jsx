// Thin Line Icons - Arcticons-inspired style
// Stroke-based, minimalist icons for AWS Study Hub

import React from 'react';

// Base icon wrapper with consistent sizing
const IconWrapper = ({ children, size = 24, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
  >
    {children}
  </svg>
);

// Cloud icon - for Cloud Practitioner, cloud concepts
export const CloudIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </IconWrapper>
);

// Brain/AI icon - for AI Practitioner
export const BrainIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1 3 3v1a3 3 0 0 1-1 2.24V16a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-2.76A3 3 0 0 1 5 11v-1a3 3 0 0 1 3-3V6a4 4 0 0 1 4-4z" />
    <path d="M12 2v4" />
    <path d="M8 10h8" />
    <path d="M9 14h6" />
    <circle cx="9" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="7" r="1" fill="currentColor" stroke="none" />
  </IconWrapper>
);

// Robot icon - alternative AI icon
export const RobotIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <rect x="5" y="8" width="14" height="12" rx="2" />
    <path d="M12 2v4" />
    <circle cx="12" cy="2" r="1" />
    <circle cx="9" cy="13" r="1.5" />
    <circle cx="15" cy="13" r="1.5" />
    <path d="M9 17h6" />
    <path d="M3 12h2" />
    <path d="M19 12h2" />
  </IconWrapper>
);

// Lock/Security icon
export const SecurityIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M12 16v2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </IconWrapper>
);

// Gear/Settings icon - for technology/services
export const GearIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </IconWrapper>
);

// Dollar/Pricing icon
export const PricingIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v12" />
    <path d="M9 9.5a2.5 2.5 0 0 1 2.5-2.5h1a2.5 2.5 0 0 1 0 5h-1a2.5 2.5 0 0 0 0 5h1a2.5 2.5 0 0 0 2.5-2.5" />
  </IconWrapper>
);

// Book/Study icon
export const BookIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M8 7h8" />
    <path d="M8 11h6" />
  </IconWrapper>
);

// Flashcard icon
export const FlashcardIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <rect x="2" y="4" width="16" height="14" rx="2" />
    <rect x="6" y="6" width="16" height="14" rx="2" />
    <path d="M10 10h8" />
    <path d="M10 14h5" />
  </IconWrapper>
);

// Game controller icon
export const GameIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M6 12h4M8 10v4" />
    <circle cx="17" cy="10" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
    <rect x="2" y="6" width="20" height="12" rx="4" />
  </IconWrapper>
);

// Chart/Stats icon
export const StatsIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M3 3v18h18" />
    <path d="M7 16l4-4 4 4 5-6" />
  </IconWrapper>
);

// Target/Goal icon
export const TargetIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </IconWrapper>
);

// Graduation cap icon
export const GraduationIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M22 10l-10-5L2 10l10 5 10-5z" />
    <path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" />
    <path d="M22 10v6" />
  </IconWrapper>
);

// Document/File icon
export const DocumentIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <path d="M8 13h8" />
    <path d="M8 17h6" />
  </IconWrapper>
);

// Gift/Free icon
export const GiftIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <rect x="3" y="8" width="18" height="14" rx="1" />
    <path d="M12 8v14" />
    <path d="M3 12h18" />
    <path d="M12 8a4 4 0 0 0-4-4c-1.5 0-3 1-3 2.5C5 8 7 8 7 8h5" />
    <path d="M12 8a4 4 0 0 1 4-4c1.5 0 3 1 3 2.5 0 1.5-2 1.5-2 1.5h-5" />
  </IconWrapper>
);

// Mobile/Phone icon
export const MobileIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M12 18h.01" />
  </IconWrapper>
);

// Save/Disk icon
export const SaveIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
  </IconWrapper>
);

// Sound on icon
export const SoundOnIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </IconWrapper>
);

// Sound off icon
export const SoundOffIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </IconWrapper>
);

// Check/Success icon
export const CheckIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <polyline points="20,6 9,17 4,12" />
  </IconWrapper>
);

// X/Close icon
export const CloseIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </IconWrapper>
);

// Arrow right icon
export const ArrowRightIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12,5 19,12 12,19" />
  </IconWrapper>
);

// External link icon
export const ExternalLinkIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15,3 21,3 21,9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </IconWrapper>
);

// Clock/Time icon
export const ClockIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </IconWrapper>
);

// List/Questions icon
export const ListIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </IconWrapper>
);

// Building/Architecture icon
export const ArchitectureIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 21v-4h6v4" />
    <path d="M9 10h1" />
    <path d="M14 10h1" />
    <path d="M9 14h1" />
    <path d="M14 14h1" />
  </IconWrapper>
);

// Code/Developer icon
export const CodeIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <polyline points="16,18 22,12 16,6" />
    <polyline points="8,6 2,12 8,18" />
    <line x1="14" y1="4" x2="10" y2="20" />
  </IconWrapper>
);

// Server/Database icon
export const ServerIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <rect x="2" y="2" width="20" height="6" rx="1" />
    <rect x="2" y="10" width="20" height="6" rx="1" />
    <circle cx="6" cy="5" r="1" fill="currentColor" />
    <circle cx="6" cy="13" r="1" fill="currentColor" />
    <path d="M6 20h12" />
    <path d="M12 16v4" />
  </IconWrapper>
);

// Network/Globe icon
export const NetworkIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <ellipse cx="12" cy="12" rx="4" ry="10" />
    <path d="M2 12h20" />
  </IconWrapper>
);

// Trophy/Achievement icon
export const TrophyIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
    <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
    <path d="M12 16v2" />
    <path d="M8 21h8" />
    <path d="M12 18a2 2 0 0 0-2 2h4a2 2 0 0 0-2-2z" />
  </IconWrapper>
);

// Lightbulb/Hint icon
export const LightbulbIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" />
  </IconWrapper>
);

// Star icon
export const StarIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
  </IconWrapper>
);

// Fire/Streak icon
export const FireIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M12 22c-4.97 0-9-3.58-9-8 0-3.5 2-6 4-8 0 3 2 5 4 6 0-4 2-8 4-10 1 2 3 4 3 8 1-1 2-2 2-4 2 2 4 4.5 4 8 0 4.42-4.03 8-9 8z" />
    <path d="M12 22c-2 0-4-1.5-4-4 0-2 1.5-3 2-4 .5 1.5 1 2 2 2s1.5-.5 2-2c.5 1 2 2 2 4 0 2.5-2 4-4 4z" />
  </IconWrapper>
);

// Refresh/Retry icon
export const RefreshIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <polyline points="23,4 23,10 17,10" />
    <polyline points="1,20 1,14 7,14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </IconWrapper>
);

// Home icon
export const HomeIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9,22 9,12 15,12 15,22" />
  </IconWrapper>
);

// Info icon
export const InfoIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </IconWrapper>
);

// AWS logo simplified
export const AwsIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M7.5 14.5c-2-1-3.5-2.5-3.5-5 0-3.5 3-6 7-6 3 0 5.5 1.5 6.5 3.5" />
    <path d="M5 16c1.5 1 4 2 7 2 4 0 7-1.5 8-3" />
    <path d="M17 11l3-1.5L17 8" />
    <path d="M20 9.5v5" />
  </IconWrapper>
);

// Level up icon
export const LevelUpIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <polyline points="12,3 12,15" />
    <polyline points="8,7 12,3 16,7" />
    <path d="M5 21h14" />
    <path d="M5 17h14" />
  </IconWrapper>
);

// Shield icon - for compliance
export const ShieldIcon = ({ size, className, style }) => (
  <IconWrapper size={size} className={className} style={style}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9,12 11,14 15,10" />
  </IconWrapper>
);

// Export all icons as a map for easy lookup
export const Icons = {
  cloud: CloudIcon,
  brain: BrainIcon,
  robot: RobotIcon,
  security: SecurityIcon,
  gear: GearIcon,
  pricing: PricingIcon,
  book: BookIcon,
  flashcard: FlashcardIcon,
  game: GameIcon,
  stats: StatsIcon,
  target: TargetIcon,
  graduation: GraduationIcon,
  document: DocumentIcon,
  gift: GiftIcon,
  mobile: MobileIcon,
  save: SaveIcon,
  soundOn: SoundOnIcon,
  soundOff: SoundOffIcon,
  check: CheckIcon,
  close: CloseIcon,
  arrowRight: ArrowRightIcon,
  externalLink: ExternalLinkIcon,
  clock: ClockIcon,
  list: ListIcon,
  architecture: ArchitectureIcon,
  code: CodeIcon,
  server: ServerIcon,
  network: NetworkIcon,
  trophy: TrophyIcon,
  lightbulb: LightbulbIcon,
  star: StarIcon,
  fire: FireIcon,
  refresh: RefreshIcon,
  home: HomeIcon,
  info: InfoIcon,
  aws: AwsIcon,
  levelUp: LevelUpIcon,
  shield: ShieldIcon
};

export default Icons;
