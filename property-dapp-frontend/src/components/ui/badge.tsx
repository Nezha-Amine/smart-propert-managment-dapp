import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '9999px',
    border: '1px solid',
    paddingLeft: '10px',
    paddingRight: '10px',
    paddingTop: '2px',
    paddingBottom: '2px',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s'
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      ...baseStyle,
      backgroundColor: '#3b82f6',
      color: 'white',
      borderColor: 'transparent'
    },
    secondary: {
      ...baseStyle,
      backgroundColor: '#f1f5f9',
      color: '#475569',
      borderColor: 'transparent'
    },
    destructive: {
      ...baseStyle,
      backgroundColor: '#ef4444',
      color: 'white',
      borderColor: 'transparent'
    },
    outline: {
      ...baseStyle,
      backgroundColor: 'transparent',
      color: '#374151',
      borderColor: '#d1d5db'
    }
  };

  return (
    <div 
      style={variantStyles[variant]}
      className={className}
      {...props} 
    />
  );
}

export { Badge } 