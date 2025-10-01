import React from 'react';

/**
 * A reusable, styled button component using Tailwind CSS.
 * @param {object} props
 * @param {React.ReactNode} props.children - The content to display inside the button.
 * @param {function} props.onClick - The function to call when the button is clicked.
 * @param {'primary' | 'secondary' | 'fab' | 'icon'} [props.variant='primary'] - The visual style of the button.
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - The button's type.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {string} [props.className=''] - Optional additional class names.
 */
const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '' }) => {

  const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-md py-3 px-6 font-sans text-lg font-semibold leading-snug cursor-pointer transition-all duration-300 ease-in-out no-underline text-center relative disabled:cursor-not-allowed disabled:opacity-60';

  const variantStyles = {
    primary: 'bg-blue text-white border border-[#a0cfff] hover:bg-[#002a52] hover:border-[#a0cfff]',
    secondary: 'bg-dark-scarlet text-white border-dark-scarlet hover:bg-[#c82333] hover:border-[#bd2130]',
    fab: 'bg-green text-white rounded-full w-14 h-14 p-0 shadow-lg -translate-y-5',
    icon: 'bg-transparent border-none p-2 text-dark-grey hover:bg-black/5',
  };

  // Combine the base styles, the selected variant style, and any additional classes.
  const buttonClasses = [
    baseStyles,
    variantStyles[variant],
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