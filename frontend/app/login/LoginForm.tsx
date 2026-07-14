"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { InputField } from "@/shared/components/InputField";
import { PasswordField } from "@/shared/components/PasswordField";
import { Heading } from "@/components/Heading";
import { Text } from "@/components/Text";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLogin } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const loginFormSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginForm() {
  const { mutate: login, isPending } = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: LoginFormValues) {
    login({
      email: data.email,
      password: data.password,
    });
  }

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="space-y-2 text-center lg:text-left">
        <Heading className="text-3xl font-bold">Sign In</Heading>
        <Text className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </Text>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <InputField
            control={form.control}
            name="email"
            label="Email"
            placeholder="name@example.com"
            disabled={isPending}
          />

          <PasswordField
            control={form.control}
            name="password"
            label="Password"
            placeholder="••••••••"
            disabled={isPending}
          />

          <div className="flex items-center justify-between pt-1">
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              Forgot your password?
            </Link>
          </div>

          <Button
            className="w-full h-11 font-semibold transition-all"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <Text className="text-center text-xs text-muted-foreground leading-relaxed pt-2">
            By signing in, you agree to our{" "}
            <Link
              href={"/terms"}
              className="text-primary font-semibold hover:underline"
            >
              Terms of Service
            </Link>
          </Text>

          <div className="text-center text-sm pt-4 border-t border-border">
            <Text as="span" className="text-muted-foreground">
              Don't have an account?{" "}
            </Text>
            <Link
              href={"/signup"}
              className="text-primary font-bold hover:underline ml-1"
            >
              Sign Up
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
