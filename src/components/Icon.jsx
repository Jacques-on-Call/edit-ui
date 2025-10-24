import {createElement} from 'react';
import {icons} from 'lucide-preact';
import {forwardRef} from "preact/compat";

const Icon = forwardRef(
    ({name, color, size, className, ...props}, ref) => {
        const lucideIcon = icons[name];
        if (!lucideIcon) {
            // Fallback for unknown icons
            return <span className="text-red-500">[?]</span>;
        }

        return createElement(lucideIcon, {
            ...props,
            ref,
            className,
            color,
            size,
        });
    }
);

export default Icon;
