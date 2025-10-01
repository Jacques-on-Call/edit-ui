import React from 'react';

/**
 * A reusable, styled button component, refactored to use Tailwind CSS utility classes directly.
 * This approach avoids issues with the build environment and CSS modules.
 * @param {object} props
 * @param {React.ReactNode} props.children - The content to display inside the button.
 * @param {function} props.onClick - The function to call when the button is clicked.
 * @param {'primary' | 'fab' | 'secondary' | 'icon'} [props.variant='primary'] - The visual style of the button.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {string} [props.className=''] - Optional additional class names.
 */
const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '' }) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 border rounded-md py-3 px-6 font-sans text-lg font-semibold leading-snug cursor-pointer transition-all duration-300 ease-in-out no-underline text-center relative disabled:cursor-not-allowed disabled:opacity-60';

  const variantClasses = {
    primary: 'bg-green text-white border-light-green border-2 hover:enabled:bg-opacity-80',
    fab: 'bg-green text-light-green border-light-green rounded-full w-14 h-14 p-0 shadow-lg -translate-y-5',
    secondary: 'bg-dark-scarlet text-white border-dark-scarlet hover:enabled:bg-[#c82333] hover:enabled:border-[#bd2130]',
    icon: 'bg-transparent border-none p-2 text-dark-grey hover:enabled:bg-black/5',
  };

  const buttonClasses = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary,
    className
  ].join(' ').trim();

  const handleClick = (e) => {
    console.log(`[Button.jsx] Clicked! Variant: ${variant}, Type: ${type}`);
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;