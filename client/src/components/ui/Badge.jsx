import React from 'react';
export const Badge = ({ className = '', variant = 'default', ...props }) => {
    const baseStyle = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    const variants = {
        default: 'bg-primary/10 text-primary hover:bg-primary/20',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        success: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
        destructive: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
        info: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
    };
    return (<span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}/>);
};
