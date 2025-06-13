import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

const buttonVariants = {
  default:
    "bg-[#ffb761] text-white hover:bg-[#ffb761]/90 shadow-lg hover:shadow-xl transition-all duration-300",
  outline:
    "border-2 border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513] hover:text-white transition-all duration-300",
  secondary:
    "bg-[#8B4513] text-white hover:bg-[#8B4513]/90 shadow-lg hover:shadow-xl transition-all duration-300",
  ghost: "text-[#8B4513] hover:bg-[#ffb761]/10 transition-all duration-300",
  link: "text-[#8B4513] underline-offset-4 hover:underline hover:text-[#ffb761] transition-all duration-300",
};

const buttonSizes = {
  default: "h-11 px-6 py-2 rounded-lg",
  sm: "h-9 px-4 rounded-md text-sm",
  lg: "h-12 px-8 rounded-xl text-lg",
  icon: "h-11 w-11 rounded-lg",
};

const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      to,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = to ? Link : "button";
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb761] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        ref={ref}
        {...(to ? { to } : {})}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
