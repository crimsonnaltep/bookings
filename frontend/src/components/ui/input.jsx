export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full border border-gray-300 p-2 rounded ${className}`}
      {...props}
    />
  );
}
