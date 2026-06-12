"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
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

function IcoHome() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7L8 2l6 5v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7z"/><path d="M6 14V9h4v5"/></svg>;
}
function IcoGavel() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L6 6l4 4 4-4-4-4zM2 14l5-5"/><path d="M6 10l-4 4"/></svg>;
}
function IcoSettings() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>;
}
function IcoBuilding() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="12" height="10" rx="1"/><path d="M5 14V9h6v5"/><path d="M5 7h2M9 7h2"/></svg>;
}
function IcoBolt() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L4 9h4l-1 5 6-7H9l1-5z"/></svg>;
}

function NavLink({
  href,
  iconEl,
  label,
  sublabel,
  onClick,
  className = "",
}: {
  href: string;
  iconEl: React.ReactNode;
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
      <span className="w-5 flex items-center justify-center shrink-0 text-gray-500 group-hover:text-gray-300">{iconEl}</span>
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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Portal requires document — only available after mount
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => {});
  }, [isLoaded, isSignedIn]);

  // Lock body scroll when drawer open
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

  const drawer = (
    <>
      {/* Full-screen backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.65)" }}
        onClick={() => setOpen(false)}
      />

      {/* Drawer panel — rendered via portal, anchored to viewport edges with inline style */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          width: "288px",
          maxWidth: "85vw",
          display: "flex",
          flexDirection: "column",
          background: "#030712",
          borderLeft: "1px solid #1f2937",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.5)",
          overflowY: "hidden",
        }}
      >
        {/* User info header */}
        <div style={{ padding: "20px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "flex-start", gap: "12px", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
              <p style={{ color: "#6b7280", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</p>
              {me?.orgName && (
                <p style={{ color: "#10b981", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                  {me.orgName}
                  {me.role && <span style={{ color: "#4b5563" }}> · {me.role.toLowerCase()}</span>}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ color: "#4b5563", background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
            aria-label="Close menu"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="3" x2="15" y2="15" />
              <line x1="15" y1="3" x2="3" y2="15" />
            </svg>
          </button>
        </div>

        {/* Navigation — flex-1 with overflow scroll */}
        <nav style={{ flex: 1, padding: "12px", overflowY: "auto", minHeight: 0 }}>
          <NavLink href="/auctions" iconEl={<IcoHome />} label="Browse Auctions" onClick={() => setOpen(false)} />
          <NavLink href="/dashboard" iconEl={<IcoGavel />} label="My Bids" onClick={() => setOpen(false)} />

          {me?.orgId ? (
            <NavLink
              href="/admin/dashboard"
              iconEl={<IcoSettings />}
              label="Admin Dashboard"
              sublabel={me.orgName ?? undefined}
              onClick={() => setOpen(false)}
            />
          ) : (
            <NavLink
              href="/apply"
              iconEl={<IcoBuilding />}
              label="Host an Auction"
              sublabel="Apply to create your org"
              onClick={() => setOpen(false)}
            />
          )}

          {me?.isSuperAdmin && (
            <>
              <div style={{ borderTop: "1px solid #1f2937", margin: "8px 0" }} />
              <NavLink
                href="/superadmin"
                iconEl={<IcoBolt />}
                label="Super Admin"
                onClick={() => setOpen(false)}
                className="text-orange-400"
              />
            </>
          )}
        </nav>

        {/* Sign out */}
        <div style={{ padding: "12px 12px 16px", borderTop: "1px solid #1f2937", flexShrink: 0 }}>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push("/");
            }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, color: "#f87171", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
          >
            <span style={{ width: 20, textAlign: "center", flexShrink: 0 }}>→</span>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );

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
        ) : initials}
      </button>

      {/* Portal: renders directly on document.body, bypasses all stacking contexts */}
      {open && mounted && createPortal(drawer, document.body)}
    </>
  );
}
