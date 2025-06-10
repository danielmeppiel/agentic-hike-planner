import React from 'react';

interface CardProps {
  /** Content to display inside the card */
  children: React.ReactNode;
  /** Additional CSS classes to apply */
  className?: string;
  /** Padding size for the card content */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Whether to apply hover effects */
  hover?: boolean;
  /** Whether to apply glass-morphism styling */
  glass?: boolean;
}

/**
 * Versatile card component with customizable styling options.
 * Supports different padding sizes, hover effects, and glass-morphism design.
 * 
 * @param props - Component props
 * @param props.children - Content to render inside the card
 * @param props.className - Additional CSS classes to apply to the card
 * @param props.padding - Padding size: 'none', 'sm', 'md', or 'lg'
 * @param props.hover - Enable hover effects when true
 * @param props.glass - Apply glass-morphism styling when true
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   return (
 *     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 *       <Card padding="md" hover glass>
 *         <h3>Trail Statistics</h3>
 *         <p>Your hiking progress this month</p>
 *       </Card>
 *       
 *       <Card padding="lg" className="bg-blue-50">
 *         <h3>Upcoming Trips</h3>
 *         <div>Trip details...</div>
 *       </Card>
 *     </div>
 *   );
 * }
 * ```
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  glass = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = `
    card
    ${hover ? 'card-hover' : ''}
    ${glass ? 'glass' : ''}
    ${paddingClasses[padding]}
    ${className}
  `.trim();

  return (
    <div className={classes}>
      {children}
    </div>
  );
};