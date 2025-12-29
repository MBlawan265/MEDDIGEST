import React from 'react';

interface NeuCardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

export const NeuCard: React.FC<NeuCardProps> = ({
    children,
    className = '',
    title,
    action
}) => {
    return (
        <div className={`bg-neu-bg rounded-2xl shadow-neumorphism p-6 ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-6">
                    {title && <h3 className="text-lg font-bold text-gray-800">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};
