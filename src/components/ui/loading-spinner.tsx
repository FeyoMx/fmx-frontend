import React from "react";

import { cn } from "@/lib/utils";

export interface ISVGProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  containerClassName?: string;
  fullPage?: boolean;
}

export const LoadingSpinner = ({ size = 45, className, containerClassName, fullPage = false, ...props }: ISVGProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullPage ? "min-h-screen" : "min-h-32",
        containerClassName,
      )}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        {...props}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("animate-spin", className)}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </div>
  );
};
