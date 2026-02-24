import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantCls: Record<Variant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
  secondary:
    'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${variantCls[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
