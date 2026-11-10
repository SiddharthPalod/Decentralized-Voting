import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('trueledger_theme');
      if (saved) return saved === 'dark';
      return true; // Default theme is dark
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      try {
        localStorage.setItem('trueledger_theme', 'dark');
      } catch {
        // ignore storage errors
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      try {
        localStorage.setItem('trueledger_theme', 'light');
      } catch {
        // ignore storage errors
      }
    }
  }, [isDark]);

  return (
    <button
      type="button"
      onClick={() => setIsDark((prev) => !prev)}
      className="p-2.5 rounded-xl bg-[#1c1c1c] hover:bg-[#242424] border border-[#282828] text-neutral-200 hover:text-white transition flex items-center justify-center shadow-lg group shrink-0"
      title={isDark ? 'Switch to Day Mode (Light Theme)' : 'Switch to Night Mode (Dark Theme)'}
      aria-label="Toggle Day/Night theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform" />
      )}
    </button>
  );
};

export default ThemeToggle;
