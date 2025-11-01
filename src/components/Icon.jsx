import { lazy, Suspense } from 'preact/compat';
import { memo } from 'preact/compat';

// A simple cache for the imported icons
const iconCache = new Map();

const Icon = memo(({ name, ...props }) => {
  // Ensure the name is in PascalCase as required by lucide-preact
  const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

  let LazyIcon = iconCache.get(formattedName);

  if (!LazyIcon) {
    LazyIcon = lazy(() =>
      import('lucide-preact/dist/esm/icons/index.js')
        .then(module => ({ default: module[formattedName] }))
        .catch(err => {
          console.error(`Failed to load icon: ${formattedName}`, err);
          // Return a fallback component
          return { default: () => <div title="Icon not found">?</div> };
        })
    );
    iconCache.set(formattedName, LazyIcon);
  }

  return (
    <Suspense fallback={<div style={{ width: props.size || 24, height: props.size || 24 }} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
});

export default Icon;
