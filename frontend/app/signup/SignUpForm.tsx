"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

// components
import { Form } from "@/components/ui/form";
import { InputField } from "@/shared/components/InputField";
import { PasswordField } from "@/shared/components/PasswordField";
import { Heading } from "@/components/Heading";
import { Text } from "@/components/Text";
import { Button } from "@/components/ui/button";

import { notifyError, notifySuccess } from "@/components/Notify";
import { authService } from "@/services/authServices";

const signUpFormSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters.").min(1, "Name is required."),
    email: z.string().email("Invalid email address.").min(1, "Email is required."),
    password: z.string().min(6, "Password must be at least 6 characters.").min(1, "Password is required."),
    repeatPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Passwords do not match",
    path: ["repeatPassword"],
  });

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export default function SignUpForm() {
  const router = useRouter();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      repeatPassword: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: SignUpFormValues) {
    try {
      const payload = {
        fullName: data.name,
        email: data.email,
        password: data.password,
      };

      await authService.register(payload);

      notifySuccess("Account created successfully! Please login.");
      router.push("/login");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
      notifyError(errorMessage);
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="space-y-2 text-center lg:text-left">
        <Heading className="text-3xl font-bold">Sign Up</Heading>
        <Text className="text-sm text-muted-foreground">
          Create an account to get started
        </Text>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            control={form.control}
            name="name"
            label="Display Name"
            placeholder="John Doe"
            disabled={isSubmitting}
          />

          <InputField
            control={form.control}
            name="email"
            label="Email"
            placeholder="name@example.com"
            disabled={isSubmitting}
          />

          <PasswordField
            control={form.control}
            name="password"
            label="Password"
            placeholder="••••••••"
            disabled={isSubmitting}
          />

          <PasswordField
            control={form.control}
            name="repeatPassword"
            label="Confirm Password"
            placeholder="••••••••"
            disabled={isSubmitting}
          />

          <Button
            className="w-full h-11 font-semibold transition-all mt-6"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>

          <Text className="text-center text-xs text-muted-foreground leading-relaxed pt-2">
            By signing up, you agree to our{" "}
            <Link
              href={"/terms"}
              className="text-primary font-semibold hover:underline"
            >
              Terms of Service
            </Link>
          </Text>

          <div className="text-center text-sm pt-4 border-t border-border">
            <Text as="span" className="text-muted-foreground">
              Already have an account?{" "}
            </Text>
            <Link
              href={"/login"}
              className="text-primary font-bold hover:underline ml-1"
            >
              Login
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
