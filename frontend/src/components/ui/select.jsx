import React from "react";

export function Select({ value, onValueChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="w-full border border-gray-300 p-2 rounded"
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }) {
  return <option disabled>{placeholder}</option>;
}

export function SelectContent({ children }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
