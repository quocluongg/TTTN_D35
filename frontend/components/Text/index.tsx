import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

const textVariants = cva("leading-relaxed", {
  variants: {
    size: {
      xs: "text-xs", // 12px
      sm: "text-sm", // 14px
      md: "text-base", // 16px
      lg: "text-lg", // 18px
    },
    variant: {
      default: "text-gray-800",
      subtle: "text-gray-500",
      primary: "text-blue-600",
      danger: "text-red-600",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
    weight: "normal",
  },
});

interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: React.ElementType;
}

export const Text: React.FC<TextProps> = ({
  as: Component = "p",
  className,
  size,
  variant,
  weight,
  children,
  ...props
}) => {
  const finalClasses = twMerge(
    clsx(textVariants({ size, variant, weight })),
    className
  );

  return (
    <Component className={finalClasses} {...props}>
      {children}
    </Component>
  );
};
