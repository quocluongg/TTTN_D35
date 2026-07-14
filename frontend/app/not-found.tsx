import Link from "next/link";
import PublicLayout from "@/shared/layouts/PublicLayout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
        {/* illustration */}
        <div className="relative mx-auto aspect-[4/3] mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/not-found.jpg"
            alt="404 Not Found"
            className="object-cover"
          />
        </div>

        {/* heading */}
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-2">
          Oops! Page not found
        </h2>

        {/* description */}
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* home button */}
        <Link href="/" className="mt-6">
          <Button variant={"outline"}>Back to Home</Button>
        </Link>
      </div>
    </PublicLayout>
  );
}
