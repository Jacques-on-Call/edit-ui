import { h } from 'preact';

/**
 * Reusable Button component
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'danger'} props.variant
 * @param {'sm' | 'md' | 'lg'} props.size
 * @param {boolean} props.disabled
 * @param {string} props.className
 * @param {import('preact').ComponentChildren} props.children
 * @param {Function} props.onClick
 */
export default function Button({
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
    children,
    onClick,
    ...props
}) {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const variants = {
        primary: 'bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-md hover:shadow-xl hover:-translate-y-0.5',
        secondary: 'bg-accent-lime/10 hover:bg-accent-lime/20 text-accent-lime border border-accent-lime/30 backdrop-blur-sm',
        danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 backdrop-blur-sm',
        ghost: 'bg-transparent hover:bg-white/5 text-gray-300 hover:text-white',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-6 py-3 text-sm',
        lg: 'px-8 py-4 text-base',
    };

    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = sizes[size] || sizes.md;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
