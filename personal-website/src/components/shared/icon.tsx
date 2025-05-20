// Placeholder for a generic Icon component
// You might use a library like lucide-react or heroicons
// or create your own SVG icon system.

type IconProps = {
  name: string; // e.g., name of the SVG icon
  className?: string;
};

export default function Icon({ name, className }: IconProps) {
  return (
    <svg className={className} aria-hidden="true">
      {/* Placeholder, actual icon rendering logic would go here */}
      <title>{name}</title>
    </svg>
  );
} 