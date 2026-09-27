import { useEffect } from 'react';

// Applies 'light' | 'dark' | 'system' to <html class="dark"> so Tailwind's
// class-based dark mode actually reflects the saved preference, instead of
// the setting being stored but doing nothing visually.
export function useThemeEffect(theme) {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      root.classList.toggle('dark', resolved === 'dark');
    };

    apply();

    if (theme === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [theme]);
}
