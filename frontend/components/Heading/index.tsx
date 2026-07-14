import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

const headingVariants = cva("font-bold leading-tight tracking-tight", {
  variants: {
    size: {
      sm: "text-xl", // 20px
      md: "text-3xl", // 30px
      lg: "text-4xl", // 36px
      xl: "text-6xl", // 60px
    },
    variant: {
      default: "text-gray-900",
      primary: "text-blue-600",
      subtle: "text-gray-500 font-medium",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  /**
   * Thẻ HTML (semantic tag) để render. Đây là chìa khóa SEO.
   * Mặc định là 'h2'.
   */
  as?: React.ElementType;
}

export const Heading: React.FC<HeadingProps> = ({
  as: Component = "h2", // Mặc định là h2
  className,
  size,
  variant,
  children,
  ...props // Các props khác như id, aria-label...
}) => {
  const finalClasses = twMerge(
    clsx(headingVariants({ size, variant })),
    className
  );

  return (
    <Component className={finalClasses} {...props}>
      {children}
    </Component>
  );
};
