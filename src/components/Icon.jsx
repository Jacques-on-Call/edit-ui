import { createElement } from 'preact';
import { forwardRef } from "preact/compat";
import * as icons from 'lucide-preact';

const Icon = forwardRef(
    ({ name, color, size, className, ...props }, ref) => {
        // The icon names in lucide are PascalCase (e.g., 'Home', 'PlusCircle')
        // We need to convert the name prop (e.g., 'home', 'plus-circle') to the correct format.
        const pascalCaseName = name
            .split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join('');

        const lucideIcon = icons[pascalCaseName];

        if (!lucideIcon) {
            // This fallback is now more important than ever
            console.warn(`Icon not found: ${name} (tried as ${pascalCaseName})`);
            return <span className="text-red-500">[?]</span>;
        }

        return createElement(lucideIcon, {
            ...props,
            ref,
            className,
            color: color || 'currentColor', // Default color to currentColor
            size: size || 24, // Default size
        });
    }
);

export default Icon;
