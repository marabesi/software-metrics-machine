'use client';

import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import React, { useEffect, useState } from 'react';
import { ThemeContextProvider } from './theme-context';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [muiTheme, setMuiTheme] = useState(
    createTheme({
      palette: {
        mode: 'light',
      },
    })
  );
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Listen for theme changes from ThemeContext
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setMuiTheme(
        createTheme({
          palette: {
            mode: isDark ? 'dark' : 'light',
          },
        })
      );
    };

    // Initial setup
    handleThemeChange();
    setIsMounted(true);

    // Listen for changes to the dark class
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  if (!isMounted) {
    return (
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        <ThemeContextProvider>{children}</ThemeContextProvider>
      </MuiThemeProvider>
    );
  }

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      <ThemeContextProvider>{children}</ThemeContextProvider>
    </MuiThemeProvider>
  );
}
