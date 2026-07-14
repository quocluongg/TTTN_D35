"use client";

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
import React from "react";

type ShadcnInputProps = React.ComponentProps<typeof Input>;

interface InputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  type?: ShadcnInputProps["type"];
  disabled?: boolean;
  description?: string;
}

export function InputField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
  disabled = false,
  description,
}: InputFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel>{label}</FormLabel>}

          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              {...field}
              value={field.value ?? ""}
            />
          </FormControl>

          {description && <FormDescription>{description}</FormDescription>}

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
