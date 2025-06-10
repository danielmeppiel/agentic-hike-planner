import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Optional icon to display in the button */
  icon?: React.ReactNode;
}

/**
 * Reusable button component with multiple variants, sizes, and states.
 * Supports loading states, icons, and follows design system patterns.
 * 
 * @param props - Component props extending standard button attributes
 * @param props.variant - Visual style: 'primary', 'secondary', 'outline', or 'ghost'
 * @param props.size - Button size: 'sm', 'md', 'lg', or 'xl'
 * @param props.isLoading - Shows loading spinner when true
 * @param props.icon - Optional React node to display as an icon
 * @param props.children - Button content/text
 * 
 * @example
 * ```tsx
 * import { PlusIcon } from '@heroicons/react/24/outline';
 * 
 * function MyComponent() {
 *   const [isLoading, setIsLoading] = useState(false);
 * 
 *   return (
 *     <div>
 *       <Button variant="primary" size="md">
 *         Save Changes
 *       </Button>
 *       
 *       <Button 
 *         variant="outline" 
 *         icon={<PlusIcon className="w-4 h-4" />}
 *         isLoading={isLoading}
 *         onClick={() => setIsLoading(true)}
 *       >
 *         Add Item
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'btn inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'bg-transparent border-2 border-primary-300 text-primary-700 hover:bg-primary-50 hover:border-primary-400 focus:ring-primary-500 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-primary-700 hover:bg-primary-50 focus:ring-primary-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};