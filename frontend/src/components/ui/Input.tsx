import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text to display above the input */
  label?: string;
  /** Error message to display below the input */
  error?: string;
  /** Helper text to display below the input when no error */
  helperText?: string;
}

/**
 * Form input component with label, error handling, and helper text support.
 * Extends standard HTML input attributes and provides consistent styling
 * and accessibility features.
 * 
 * @param props - Component props extending standard input attributes
 * @param props.label - Optional label text displayed above the input
 * @param props.error - Error message displayed below input (overrides helperText)
 * @param props.helperText - Helper text displayed below input when no error
 * @param props.className - Additional CSS classes to apply
 * @param props.id - Input ID (auto-generated if not provided)
 * 
 * @example
 * ```tsx
 * function ContactForm() {
 *   const [email, setEmail] = useState('');
 *   const [emailError, setEmailError] = useState('');
 * 
 *   return (
 *     <form>
 *       <Input
 *         label="Email Address"
 *         type="email"
 *         value={email}
 *         onChange={(e) => setEmail(e.target.value)}
 *         error={emailError}
 *         helperText="We'll never share your email"
 *         placeholder="Enter your email"
 *         required
 *       />
 *     </form>
 *   );
 * }
 * ```
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const inputClasses = `
    block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
    placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
    ${className}
  `.trim();

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};