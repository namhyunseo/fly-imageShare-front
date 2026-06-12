"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  return (
    <section
      className="flex min-h-[100dvh] flex-col justify-center px-5 py-6"
      style={{ background: "var(--grad-night)" }}
    >
      <div className="animate-fade-up mx-auto w-full max-w-[380px] rounded-[24px] border border-[var(--line)] bg-[var(--card)] p-7 shadow-[0_24px_70px_rgba(30,50,90,0.12)]">
        <LoginForm
          onLoggedIn={() => router.push("/upload")}
          onBrowse={() => router.push("/gallery")}
        />
      </div>
    </section>
  );
}
