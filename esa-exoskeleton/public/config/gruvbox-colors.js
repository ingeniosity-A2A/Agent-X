// Gruvbox Official Color Scheme
export const gruvboxTheme = {
  dark: {
    bg: '#282828',
    bg_soft: '#32302f',
    bg_selection: '#3c3836',
    fg: '#ebdbb2',
    fg_soft: '#a89984',
    fg_disabled: '#928374',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    purple: '#b16286',
    aqua: '#689d6a',
    orange: '#d65d0e',
    gray: '#928374',
    border: '#3c3836',
    shadow: 'rgba(0, 0, 0, 0.5)',
    console_bg: '#1d2021',
    chat_bg: '#32302f',
    bg_red: '#423935',
    bg_green: '#423b2f',
    bg_blue: '#264244',
    bg_purple: '#3c3836',
    bg_aqua: '#2f4135',
    bg_orange: '#423935'
  },
  light: {
    bg: '#fbf1c7',
    bg_soft: '#f2e5bc',
    bg_selection: '#ebdbb2',
    fg: '#3c3836',
    fg_soft: '#665c54',
    fg_disabled: '#928374',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#076678',
    purple: '#b16286',
    aqua: '#427b58',
    orange: '#d65d0e',
    gray: '#928374',
    border: '#d5c4a1',
    shadow: 'rgba(0, 0, 0, 0.15)',
    console_bg: '#fbf1c7',
    chat_bg: '#f2e5bc',
    bg_red: '#fbd0c8',
    bg_green: '#f4e8a0',
    bg_blue: '#c7e0e6',
    bg_purple: '#f0d5e0',
    bg_aqua: '#c5e0cf',
    bg_orange: '#fbd0c8'
  }
};

export let activeTheme = gruvboxTheme.dark;

export function toggleTheme() {
  activeTheme = activeTheme === gruvboxTheme.dark ? gruvboxTheme.light : gruvboxTheme.dark;
  return activeTheme;
}

export function getThemeName() {
  return activeTheme === gruvboxTheme.dark ? 'dark' : 'light';
}
