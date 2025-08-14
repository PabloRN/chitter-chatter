import { ref } from 'vue';

const currentTheme = ref('general');

const useTheme = () => {
  const availableThemes = [
    { name: 'general', label: 'General' },
    { name: 'crunchyroll', label: 'Crunchyroll' },
  ];

  const setTheme = (themeName) => {
    if (availableThemes.some((theme) => theme.name === themeName)) {
      currentTheme.value = themeName;
      document.documentElement.setAttribute('data-theme', themeName);
      localStorage.setItem('theme', themeName);
    }
  };

  const initTheme = () => {
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && availableThemes.some((theme) => theme.name === savedTheme)) {
      currentTheme.value = savedTheme;
    }

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', currentTheme.value);
  };

  const getThemeLabel = (themeName) => {
    const theme = availableThemes.find((t) => t.name === themeName);
    return theme ? theme.label : themeName;
  };

  return {
    currentTheme,
    availableThemes,
    setTheme,
    initTheme,
    getThemeLabel,
  };
};

export default useTheme;
