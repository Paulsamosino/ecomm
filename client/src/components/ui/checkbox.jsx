import * as React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={cn(
      "h-4 w-4 rounded border-primary text-primary focus:ring-primary",
      className
    )}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
