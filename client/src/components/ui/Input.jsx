import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
export const Input = React.forwardRef(({ className = '', label, error, type = 'text', containerClassName = '', id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    return (<div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (<label htmlFor={id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>)}
        <div className="relative flex items-center">
          <input id={id} ref={ref} type={inputType} className={`flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${error ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:border-primary'} ${isPassword ? 'pr-10' : ''} ${className}`} {...props}/>
          {isPassword && (<button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>)}
        </div>
        {error && (<span className="text-xs text-destructive font-medium animate-pulse">
            {error}
          </span>)}
      </div>);
});
Input.displayName = 'Input';
