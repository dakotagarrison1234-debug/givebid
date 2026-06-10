"use client";
import { useState } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";

interface NavItem { label: string; href: string; icon: string; }

interface Props {
  navItems: NavItem[];
  orgName: string;
  role: string;
  superAdmin: boolean;
  showSuperAdmin?: boolean;
}

export default function MobileNav({ navItems, orgName, role, superAdmin, showSuperAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    window.location.href = "/";
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <Link href="/admin/dashboard" className="text-emerald-400 font-bold text-lg">GiveBid</Link>
        <button onClick={() => setOpen(true)} className="text-gray-400 hover:text-white p-1" aria-label="Open menu">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          {/* Drawer */}
          <div className="relative w-72 bg-gray-900 flex flex-col h-full shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold text-xl">GiveBid</span>
                <p className="text-gray-300 text-sm mt-0.5 font-medium truncate">{orgName}</p>
                <span className="text-xs text-emerald-600 capitalize">{role}</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white p-1">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="pt-2 border-t border-gray-800 mt-2 space-y-1">
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
                >
                  <span>⭐</span>
                  <span>My Bids</span>
                </Link>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
                >
                  <span>🏠</span>
                  <span>Browse Auctions</span>
                </Link>
              </div>

              {showSuperAdmin && (
                <div className="pt-2 border-t border-gray-800 mt-2">
                  <Link
                    href="/superadmin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 transition-colors text-sm"
                  >
                    <span>⚡</span>
                    <span>Super Admin</span>
                  </Link>
                </div>
              )}
            </nav>

            {/* Sign out */}
            <div className="px-4 pb-5 pt-3 border-t border-gray-800">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm"
              >
                <span>→</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
