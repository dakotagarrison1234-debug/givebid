import Link from "next/link";

interface Action {
  href: string;
  label: string;
  primary?: boolean;
}

interface Props {
  title: string;
  message?: string;
  actions?: Action[];
}

/**
 * Consistent full-screen "not found / stuck" card with clear ways forward.
 * Mobile-first: stacked full-width buttons with 44px+ tap targets.
 */
export default function NotFoundCard({ title, message, actions }: Props) {
  const links: Action[] = actions && actions.length > 0 ? actions : [{ href: "/auctions", label: "Browse auctions", primary: true }];
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-5">
      <div className="text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        {message && <p className="text-gray-400 text-sm mb-6">{message}</p>}
        <div className="flex flex-col gap-2.5 mt-6">
          {links.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className={
                a.primary
                  ? "w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-colors"
                  : "w-full border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium py-3 rounded-xl transition-colors"
              }
            >
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
