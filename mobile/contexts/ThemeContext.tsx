import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as _useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => { },
    setTheme: () => { }
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = _useColorScheme();
    const [theme, setThemeState] = useState<Theme>(systemScheme || 'light');
    const [manualOverride, setManualOverride] = useState(false);

    useEffect(() => {
        const loadTheme = async () => {
            const saved = await AsyncStorage.getItem('user_theme');
            if (saved) {
                setThemeState(saved as Theme);
                setManualOverride(true);
            } else if (systemScheme) {
                setThemeState(systemScheme);
            }
        };
        loadTheme();
    }, []);

    useEffect(() => {
        if (!manualOverride && systemScheme) {
            setThemeState(systemScheme);
        }
    }, [systemScheme, manualOverride]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        setManualOverride(true);
        AsyncStorage.setItem('user_theme', newTheme);
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        setManualOverride(true);
        AsyncStorage.setItem('user_theme', newTheme);
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
