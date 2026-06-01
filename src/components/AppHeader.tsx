import Link from "next/link";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  badge?: string;
}

export function AppHeader({
  title,
  subtitle,
  showBack = false,
  badge,
}: AppHeaderProps) {
  return (
    <header className="border-b border-white/5 px-6 py-4 flex items-center gap-3">
      {showBack ? (
        <Link
          href="/"
          className="shrink-0 w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:border-white/25 transition-colors"
          aria-label="Back to products"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M4 8h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
            />
          </svg>
        </div>
      )}

      <div className="min-w-0">
        <h1 className="text-sm font-bold tracking-tight text-white truncate">{title}</h1>
        {subtitle && (
          <p className="text-[11px] text-white/40 truncate">{subtitle}</p>
        )}
      </div>

      {badge && (
        <div className="ml-auto shrink-0">
          <span className="text-[11px] bg-violet-600/20 text-violet-300 border border-violet-600/30 rounded-full px-3 py-1">
            {badge}
          </span>
        </div>
      )}
    </header>
  );
}
