import React from 'react';

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const NeuInput: React.FC<NeuInputProps> = ({
    label,
    error,
    icon,
    className = '',
    id,
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label htmlFor={id} className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    id={id}
                    className={`
                        w-full bg-neu-bg rounded-xl border-none outline-none
                        shadow-neumorphism-inset
                        text-gray-700 placeholder-gray-400
                        transition-all duration-300 ease-in-out
                        focus:shadow-neumorphism-inset-sm focus:ring-0
                        disabled:bg-gray-100 disabled:opacity-100 disabled:cursor-not-allowed disabled:text-gray-500
                        ${icon ? 'pl-11 pr-4' : 'px-4'}
                        py-3
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-500 ml-1">{error}</p>
            )}
        </div>
    );
};
