import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

const THEME_KEY = 'finpilot_theme';

export function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);

    // DARK IS DEFAULT
    const isLight = savedTheme === 'light';

    setLight(isLight);

    document.documentElement.classList.toggle(
      'light',
      isLight
    );

    document.documentElement.classList.toggle(
      'dark',
      !isLight
    );
  }, []);

  function toggleTheme() {
    const nextLight = !light;

    setLight(nextLight);

    localStorage.setItem(
      THEME_KEY,
      nextLight ? 'light' : 'dark'
    );

    document.documentElement.classList.toggle(
      'light',
      nextLight
    );

    document.documentElement.classList.toggle(
      'dark',
      !nextLight
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        light
          ? 'Switch to dark mode'
          : 'Switch to light mode'
      }
      title={
        light
          ? 'Switch to dark mode'
          : 'Switch to light mode'
      }
      className="
        fixed
        right-5
        top-5
        z-[9999]
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        border
        border-white/10
        bg-[#101412]/90
        text-emerald-400
        shadow-[0_8px_30px_rgba(0,0,0,0.35)]
        backdrop-blur-xl
        transition-all
        duration-300
        hover:scale-105
        hover:border-emerald-400/30
        hover:bg-[#151b18]
        active:scale-95
        light:border-black/10
        light:bg-white/90
        light:text-amber-500
        light:shadow-[0_8px_30px_rgba(0,0,0,0.12)]
        light:hover:bg-white
      "
    >
      {light ? (
        <Sun
          className="h-5 w-5"
          strokeWidth={2.3}
        />
      ) : (
        <Moon
          className="h-5 w-5"
          strokeWidth={2.3}
        />
      )}
    </button>
  );
}