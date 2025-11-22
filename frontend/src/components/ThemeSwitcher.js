import React from 'react';
import { Button } from 'react-bootstrap';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeSwitcher = ({ theme, toggleTheme }) => {
  return (
    <Button variant="secondary" onClick={toggleTheme} className="theme-switcher-button" size="sm">
      {theme === 'light' ? <FaMoon /> : <FaSun />}
    </Button>
  );
};

export default ThemeSwitcher;
