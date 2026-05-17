import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/50 px-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Food Tracker</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Plan meals, track nutrition, and manage your household&apos;s food efficiently
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline">Create Account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
