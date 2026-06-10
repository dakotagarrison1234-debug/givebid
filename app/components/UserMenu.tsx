"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface MeData {
  orgId?: string | null;
  orgName?: string | null;
  orgSlug?: string | null;
  role?: string | null;
  isSuperAdmin?: boolean;
}

function NavLink({
  href,
  icon,
  label,
  sublabel,
  onClick,
  className = "",
}: {
  href: string;
  icon: string;
  label: string;
  sublabel?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm group ${className}`}
    >
      <span className="w-5 text-center text-base shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-gray-300 group-hover:text-white">{label}</span>
        {sublabel && <span className="block text-xs text-gray-600 truncate mt-0.5">{sublabel}</span>}
      </span>
    </Link>
  );
}

export default function UserMenu() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<MeData | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => {});
  }, [isLoaded, isSignedIn]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!isLoaded) {
    return <div className="w-9 h-9 rounded-full bg-gray-800 animate-pulse" />;
  }

  const initials = (
    user?.firstName?.[0] ||
    user?.emailAddresses?.[0]?.emailAddress?.[0] ||
    "?"
  ).toUpperCase();

  const displayName = user?.fullName || user?.firstName || "Bidder";
  const email = user?.emailAddresses?.[0]?.emailAddress || "";

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-in"
          className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap hidden sm:block"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Avatar trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-full overflow-hidden bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold text-sm hover:bg-emerald-500/30 transition-colors shrink-0"
        aria-label="Open account menu"
      >
        {user?.imageUrl ? (
          <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {/* Drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel — fixed independently so height is always full viewport */}
          <div className="fixed top-0 right-0 bottom-0 z-[61] w-72 max-w-[85vw] bg-gray-950 border-l border-gray-800 flex flex-col shadow-2xl">
            {/* User info header */}
            <div className="px-5 py-5 border-b border-gray-800 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-base shrink-0 border border-emerald-500/20">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{displayName}</p>
                  <p className="text-gray-500 text-xs truncate">{email}</p>
                  {me?.orgName && (
                    <p className="text-emerald-400 text-xs truncate mt-0.5">
                      {me.orgName}
                      {me.role && (
                        <span className="text-gray-600 capitalize"> · {me.role.toLowerCase()}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-600 hover:text-white transition-colors shrink-0 mt-0.5"
                aria-label="Close menu"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="3" y1="3" x2="15" y2="15" />
                  <line x1="15" y1="3" x2="3" y2="15" />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              <NavLink href="/" icon="🏠" label="Browse Auctions" onClick={() => setOpen(false)} />
              <NavLink href="/dashboard" icon="⭐" label="My Bids" onClick={() => setOpen(false)} />

              {me?.orgId ? (
                <NavLink
                  href="/admin/dashboard"
                  icon="⚙️"
                  label="Admin Dashboard"
                  sublabel={me.orgName ?? undefined}
                  onClick={() => setOpen(false)}
                />
              ) : (
                <NavLink
                  href="/apply"
                  icon="🏢"
                  label="Host an Auction"
                  sublabel="Apply to create your org"
                  onClick={() => setOpen(false)}
                />
              )}

              {me?.isSuperAdmin && (
                <>
                  <div className="border-t border-gray-800 my-2" />
                  <NavLink
                    href="/superadmin"
                    icon="⚡"
                    label="Super Admin"
                    onClick={() => setOpen(false)}
                    className="text-orange-400"
                  />
                </>
              )}
            </nav>

            {/* Sign out */}
            <div className="px-3 pb-4 pt-3 border-t border-gray-800">
              <button
                onClick={async () => {
                  setOpen(false);
                  await signOut();
                  router.push("/");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm"
              >
                <span className="w-5 text-center text-base shrink-0">→</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
