import React from 'react';
import styles from './Button.module.css';

/**
 * A reusable, styled button component.
 * @param {object} props
 * @param {React.ReactNode} props.children - The content to display inside the button.
 * @param {function} props.onClick - The function to call when the button is clicked.
 * @param {'primary' | 'fab' | 'icon'} [props.variant='primary'] - The visual style of the button.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {string} [props.className=''] - Optional additional class names.
 */
const Button = ({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '' }) => {
  // Combine the base button class, the variant class, and any additional classes.
  const buttonClasses = [
    styles.button,
    styles[variant],
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