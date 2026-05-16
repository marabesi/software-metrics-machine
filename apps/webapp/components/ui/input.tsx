import { forwardRef } from "react"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
