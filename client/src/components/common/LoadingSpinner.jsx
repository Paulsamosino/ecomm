import { Loader2 } from "lucide-react";

export const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
