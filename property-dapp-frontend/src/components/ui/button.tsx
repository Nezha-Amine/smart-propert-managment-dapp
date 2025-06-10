import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', style, ...props }, ref) => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      cursor: 'pointer',
      border: '1px solid',
      outline: 'none',
      textDecoration: 'none'
    };

    const sizeStyles = {
      default: {
        height: '40px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '8px',
        paddingBottom: '8px'
      },
      sm: {
        height: '36px',
        borderRadius: '6px',
        paddingLeft: '12px',
        paddingRight: '12px'
      },
      lg: {
        height: '44px',
        borderRadius: '8px',
        paddingLeft: '32px',
        paddingRight: '32px'
      },
      icon: {
        height: '40px',
        width: '40px'
      }
    };

    const variantStyles = {
      default: {
        backgroundColor: '#3b82f6',
        color: 'white',
        borderColor: '#3b82f6'
      },
      destructive: {
        backgroundColor: '#ef4444',
        color: 'white',
        borderColor: '#ef4444'
      },
      outline: {
        backgroundColor: 'transparent',
        color: '#374151',
        borderColor: '#d1d5db'
      },
      secondary: {
        backgroundColor: '#f1f5f9',
        color: '#475569',
        borderColor: '#f1f5f9'
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#374151',
        borderColor: 'transparent'
      },
      link: {
        backgroundColor: 'transparent',
        color: '#3b82f6',
        borderColor: 'transparent',
        textDecoration: 'underline'
      }
    };

    const disabledStyle: React.CSSProperties = {
      opacity: 0.5,
      cursor: 'not-allowed'
    };

    const combinedStyle = {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(props.disabled ? disabledStyle : {}),
      ...style
    };

    return (
      <button
        ref={ref}
        style={combinedStyle}
        {...props}
      />
    );
  }
)
Button.displayName = "Button"

export { Button }
