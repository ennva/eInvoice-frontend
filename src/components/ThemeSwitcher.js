import React from 'react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Sun, Moon } from 'lucide-react';

const ThemeSwitcher = ({ variant = 'outline', size = 'sm' }) => {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggle}
      className="flex items-center gap-2"
      data-testid="theme-switcher"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {theme === 'dark' ? 'Light' : 'Dark'}
    </Button>
  );
};

export default ThemeSwitcher;
