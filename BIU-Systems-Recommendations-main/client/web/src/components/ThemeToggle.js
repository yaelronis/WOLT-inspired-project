// @ts-check
import { useState, useEffect } from "react";

/** @typedef {'light' | 'dark'} Theme */

/**
 * @param {any} obj 
 * @returns {obj is Theme}
 */
function is_theme(obj) {
    return ['light', 'dark'].includes(obj);
}

export default function ThemeToggle() {
    const [theme, theme_set] = useState( /** @type {Theme} */ ('light'));
    const label = theme === 'light' ? '☀️': '🌙';

    useEffect(() => {
        const theme_from_storage = localStorage.getItem('theme');
        const theme_new = is_theme(theme_from_storage) ? theme_from_storage : 'light';
        theme_set(theme_new);
        document.documentElement.setAttribute('theme', theme_new);
    }, []);

    function toggle_theme() {
        const theme_new = theme === 'light' ? 'dark' : 'light';
        theme_set(theme_new);
        document.documentElement.setAttribute('theme', theme_new);
        localStorage.setItem('theme', theme_new);
    }

    return (
        <button id='theme-toggle' style={{maxWidth: '24px'}} onClick={toggle_theme}>{label}</button>
    );
}
