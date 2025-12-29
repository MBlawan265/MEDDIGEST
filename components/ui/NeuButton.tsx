import React from 'react';

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    isLoading?: boolean;
}

export const NeuButton: React.FC<NeuButtonProps> = ({
    children,
    className = '',
    variant = 'primary',
    isLoading = false,
    disabled,
    ...props
}) => {
    // Neumorphic buttons are usually the same color as bg, but we can add subtle tints.
    // However, strictly adhering to the style, we rely on shadows.
    // For "Primary", we might want a colored state or just bold text.
    // Let's make "Primary" have blue text and "Secondary" gray.

    // Base styles
    const baseStyles = "relative inline-flex items-center justify-center px-6 py-3 rounded-full font-medium transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500/50";

    // Variants - strictly soft UI usually implies checking state (pressed/unpressed)
    // We will use standard raised -> pressed on active
    const variantStyles = variant === 'primary'
        ? "bg-neu-bg text-blue-600 shadow-neumorphism hover:shadow-neumorphism-hover active:shadow-neumorphism-inset"
        : variant === 'danger'
            ? "bg-neu-bg text-red-600 shadow-neumorphism hover:shadow-neumorphism-hover active:shadow-neumorphism-inset"
            : "bg-neu-bg text-gray-700 shadow-neumorphism hover:shadow-neumorphism-hover active:shadow-neumorphism-inset";

    return (
        <button
            className={`
                ${baseStyles} 
                ${variantStyles} 
                ${disabled || isLoading ? 'opacity-60 cursor-not-allowed shadow-neumorphism-flat' : ''} 
                ${className}
            `}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {children}
        </button>
    );
};
