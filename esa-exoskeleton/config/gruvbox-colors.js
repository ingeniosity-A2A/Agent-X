/**
 * Gruvbox Color Theme for ESA EXOSKELETON
 * Dark/Light toggleable color scheme
 */

export const gruvbox = {
  dark: {
    bg: '#282828',
    bg0: '#1d2021',
    bg0_soft: '#32302f',
    bg1: '#3c3836',
    bg2: '#504945',
    fg: '#ebdbb2',
    fg0: '#fbf1c7',
    fg_soft: '#a89984',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    purple: '#b16286',
    aqua: '#689d6a',
    orange: '#d65d0e',
    border: '#3c3836',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  light: {
    '#fbf1c7': '#fbf1c7',
    bg0: '#f9f5d7',
    bg0_soft: '#ebdbb2',
    bg1: '#d5c4a1',
    bg2: '#bdae93',
    fg: '#3c3836',
    fg0: '#282828',
    fg_soft: '#7c6f64',
    red: '#9d0006',
    green: '#79740e',
    yellow: '#b57614',
    blue: '#076678',
    purple: '#8f3f71',
    aqua: '#427b58',
    orange: '#af3a03',
    border: '#d5c4a1',
    shadow: 'rgba(0, 0, 0, 0.15)'
  }
};

// Active theme (default dark)
let currentMode = 'dark';

export const activeTheme = new Proxy(gruvbox.dark, {
  get(target, prop) {
    return gruvbox[currentMode][prop] || target[prop];
  }
});

export function setTheme(mode) {
  if (gruvbox[mode]) {
    currentMode = mode;
    document.documentElement.setAttribute('data-theme', mode);
    console.log(`%c[ESA.Theme] Switched to ${mode} mode`, 
      `color: ${activeTheme.aqua}`);
  }
}

export function toggleTheme() {
  setTheme(currentMode === 'dark' ? 'light' : 'dark');
}

export { gruvbox };
export default activeTheme;
