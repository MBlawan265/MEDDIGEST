import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                neu: {
                    bg: '#eef2f6',
                    'shadow-light': '#ffffff',
                    'shadow-dark': '#d1d9e6',
                },
                blue: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb', // Primary
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554',
                },
            },
            boxShadow: {
                'neumorphism': '9px 9px 16px rgb(209, 217, 230), -9px -9px 16px rgba(255, 255, 255, 0.5)',
                'neumorphism-sm': '5px 5px 10px rgb(209, 217, 230), -5px -5px 10px rgba(255, 255, 255, 0.5)',
                'neumorphism-xs': '3px 3px 6px rgb(209, 217, 230), -3px -3px 6px rgba(255, 255, 255, 0.5)',
                'neumorphism-inset': 'inset 6px 6px 10px rgb(209, 217, 230), inset -6px -6px 10px rgba(255, 255, 255, 0.5)',
                'neumorphism-inset-sm': 'inset 3px 3px 6px rgb(209, 217, 230), inset -3px -3px 6px rgba(255, 255, 255, 0.5)',
                'neumorphism-flat': '0px 0px 0px rgba(0,0,0,0)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms')
    ],
};
export default config;
