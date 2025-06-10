import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ type, style, ...props }, ref) => {
    const inputStyle: React.CSSProperties = {
      display: 'flex',
      height: '40px',
      width: '100%',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      backgroundColor: 'transparent',
      paddingLeft: '12px',
      paddingRight: '12px',
      paddingTop: '8px',
      paddingBottom: '8px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
      ...style
    };

    return (
      <input
        type={type}
        ref={ref}
        style={inputStyle}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
