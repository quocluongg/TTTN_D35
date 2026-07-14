"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Control, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface PasswordFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
}

export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled = false,
  description,
}: PasswordFieldProps<T>) {
  const [showPassword, setShowPassword] = React.useState(false);

  const toggleVisibility = () => setShowPassword(!showPassword);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}

          <div className="relative">
            <FormControl>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={placeholder}
                disabled={disabled}
                {...field}
                value={field.value ?? ""}
                className="pr-10"
              />
            </FormControl>

            <button
              type="button"
              onClick={toggleVisibility}
              disabled={disabled}
              className="absolute inset-y-0 right-0 flex items-center justify-center h-full w-10 text-muted-foreground hover:text-primary"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
