"use client";
import { useState, useEffect } from "react";

interface Member {
  id: string;
  clerkUserId: string;
  role: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}

export default function StaffPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"STAFF" | "ADMIN">("STAFF");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/orgs/invite")
      .then((r) => r.json())
      .then((d) => {
        setMembers(d.members || []);
        setInvites(d.invites || []);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    if (!email.trim()) { setError("Email is required."); return; }
    setSending(true);
    setError("");
    setInviteUrl("");
    try {
      const res = await fetch("/api/orgs/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteUrl(data.inviteUrl);
        setEmail("");
        load();
      } else {
        setError(data.error || "Failed to create invite.");
      }
    } catch {
      setError("Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  const roleLabel = (role: string) => {
    if (role === "OWNER") return "Owner";
    if (role === "ADMIN") return "Admin";
    return "Staff";
  };

  const roleColor = (role: string) => {
    if (role === "OWNER") return "text-orange-400";
    if (role === "ADMIN") return "text-emerald-400";
    return "text-gray-400";
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-gray-800 px-8 py-4">
        <h1 className="text-xl font-semibold">Team Members</h1>
      </header>

      <div className="px-8 py-6 max-w-2xl space-y-8">
        {/* Current Members */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Current Members ({members.length})
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
            {members.map((member) => (
              <div key={member.id} className="px-5 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-400 font-mono">{member.clerkUserId.substring(0, 20)}...</div>
                <span className={`text-xs font-semibold ${roleColor(member.role)}`}>
                  {roleLabel(member.role)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Pending Invites ({invites.length})
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
              {invites.map((invite) => (
                <div key={invite.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm">{invite.email}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{roleLabel(invite.role)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Invite Form */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Invite Someone
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "STAFF" | "ADMIN")}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="STAFF">Staff — can manage items and auctions</option>
                <option value="ADMIN">Admin — can manage everything including team</option>
              </select>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleInvite}
              disabled={sending}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
            >
              {sending ? "Generating Invite..." : "Generate Invite Link"}
            </button>

            {inviteUrl && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-emerald-400 text-sm font-semibold mb-2">Invite link created! Share this:</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(inviteUrl)}
                    className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-2 rounded-lg"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-gray-600 text-xs mt-2">Expires in 7 days. One-time use.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
