import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Food Tracker",
  description: "Sign in to your Food Tracker account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/50">
      {children}
    </div>
  );
}
