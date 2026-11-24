import type { ReactNode } from "react";
import { Utensils } from "lucide-react";

export default function AuthLayout({ title, description, children }: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-wrap">
      <div className="auth-shell">
        <div className="auth-cover">
          <p>El buen sabor tiene recompensa.</p>
        </div>
        <div className="auth-card">
          <header className="brand">
            <span className="auth-wordmark"><Utensils aria-hidden="true" /> Ñam+</span>
            <h1>{title}</h1>
            <p className="muted">{description}</p>
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}
