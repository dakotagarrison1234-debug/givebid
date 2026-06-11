"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface User {
  clerkUserId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  bidCount: number;
  paidTotal: number;
  failedPayments: number;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/superadmin/users?search=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setLoading(false); });
  }, [query]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
  };

  return (
    <>
      <header className="border-b border-gray-800/60 px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} {query ? "results" : "total"}</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-56"
          />
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Search
          </button>
          {query && (
            <button type="button" onClick={() => { setSearch(""); setQuery(""); }} className="text-gray-400 hover:text-white text-sm px-3 py-2 rounded-xl transition-colors">
              Clear
            </button>
          )}
        </form>
      </header>

      <div className="px-4 sm:px-8 py-5 max-w-5xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center text-gray-500 text-sm">
            {query ? "No users found matching that search." : "No registered users yet."}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3">User</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Phone</th>
                  <th className="text-right px-4 py-3">Bids</th>
                  <th className="text-right px-4 py-3 hidden sm:table-cell">Paid</th>
                  <th className="text-right px-4 py-3">Failed</th>
                  <th className="text-right px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {users.map((u) => (
                  <tr key={u.clerkUserId} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <Link
                        href={`/superadmin/users/${u.clerkUserId}`}
                        className="hover:text-emerald-400 transition-colors"
                      >
                        <div className="font-medium text-white">{u.name || <span className="text-gray-500 italic">No name</span>}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{u.email || <span className="italic">No email</span>}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{u.phone || "—"}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{u.bidCount}</td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-medium hidden sm:table-cell">
                      {u.paidTotal > 0 ? `$${u.paidTotal.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.failedPayments > 0 ? (
                        <span className="text-red-400 font-semibold">{u.failedPayments}</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
