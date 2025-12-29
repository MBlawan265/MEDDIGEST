import React from 'react';
import { FaChevronDown } from 'react-icons/fa';

interface NeuSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    options?: { value: string; label: string }[];
}

export const NeuSelect: React.FC<NeuSelectProps> = ({
    label,
    error,
    icon,
    className = '',
    id,
    children,
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
                <select
                    id={id}
                    className={`
                        w-full bg-neu-bg rounded-xl border-none outline-none
                        shadow-neumorphism-inset
                        text-gray-700 placeholder-gray-400
                        appearance-none
                        transition-all duration-300 ease-in-out
                        focus:shadow-neumorphism-inset-sm focus:ring-0
                        disabled:opacity-60 disabled:cursor-not-allowed
                        ${icon ? 'pl-11 pr-10' : 'px-4 pr-10'}
                        py-3
                        ${className}
                    `}
                    {...props}
                >
                    {children}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500">
                    <FaChevronDown className="text-xs" />
                </div>
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-500 ml-1">{error}</p>
            )}
        </div>
    );
};
