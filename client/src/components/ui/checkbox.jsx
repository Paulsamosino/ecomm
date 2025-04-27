import * as React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(
  ({ className, onCheckedChange, checked, defaultChecked, ...props }, ref) => {
    // Handle both onChange and onCheckedChange patterns
    const handleChange = (e) => {
      // Call the standard onChange if provided
      if (props.onChange) {
        props.onChange(e);
      }

      // Also call onCheckedChange with the checked value if provided
      if (onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
    };

    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          "h-4 w-4 rounded border-primary text-primary focus:ring-primary",
          className
        )}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
