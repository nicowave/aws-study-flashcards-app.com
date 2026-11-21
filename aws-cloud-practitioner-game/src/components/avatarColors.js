// Why: avatars saved before the Arcade repaint still carry the old swatch
// colours (the old default was an orange). Map them to the new palette when
// they are shown, so no saved profile brings the old colours back.
const LEGACY_AVATAR_COLORS = {
  '#ff9900': '#a78bfa',
  '#58a6ff': '#f472b6',
  '#d29922': '#67e8f9',
  '#56d4dd': '#22d3ee',
  '#f778ba': '#ec4899',
  '#6e7681': '#8493ab',
  '#e6edf3': '#f2f5f9',
  '#388bfd': '#fbcfe8',
  '#bc8cff': '#c4b5fd',
  '#ff6b6b': '#9366f7',
};

export const fixAvatarColor = (color) =>
  (typeof color === 'string' && LEGACY_AVATAR_COLORS[color.toLowerCase()]) || color;
