/** Where the visitor's light/dark choice is remembered on this device. */
export const THEME_STORAGE_KEY = 'theme';

/**
 * Runs in <head> before the first paint, so the page never flashes the wrong theme.
 * A saved choice wins; otherwise the phone's light/dark setting decides.
 * Kept apart from the theme hooks so the (server) root layout can import it.
 */
export const THEME_SCRIPT = `(function(){var t;try{t=localStorage.getItem('${THEME_STORAGE_KEY}')}catch(e){}if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t})()`;
