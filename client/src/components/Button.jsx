import React from "react";
import { Loader2 } from "lucide-react";

const Button = ({ children, variant = "primary", size = "md", isLoading, className = "", ...props }) => {
  const baseStyle = "inline-flex items-center justify-center font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-950 to-blue-900 text-white hover:shadow-md",
    secondary: "bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200",
    outline: "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} disabled={isLoading || props.disabled} {...props}>
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};
export default Button;
