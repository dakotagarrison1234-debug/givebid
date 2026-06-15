"use client";

// ─── Bot icon (inline SVG) ────────────────────────────────────────────────────
function BotIcon({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="32" height="26" rx="9" fill="white" stroke="#09a7ad" strokeWidth="2.5"/>
      <circle cx="14" cy="24" r="4.5" fill="#09a7ad"/>
      <circle cx="26" cy="24" r="4.5" fill="#09a7ad"/>
      <path d="M15 32h10" stroke="#09a7ad" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="20" y1="10" x2="20" y2="5" stroke="#09a7ad" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="20" cy="3.5" r="3" fill="#09a7ad"/>
    </svg>
  );
}

// ─── Small avatar circle ──────────────────────────────────────────────────────
function Avatar({
  initial,
  color,
  size = 36,
}: {
  initial: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-black shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}

// ─── Scenario 1 ──────────────────────────────────────────────────────────────
// You set max → system places minimum → you're winning
function S1() {
  return (
    <div className="space-y-3">
      {/* 3-step horizontal flow */}
      <div className="flex items-stretch gap-2">
        {/* YOU */}
        <div className="flex-1 bg-white border-2 border-[#09a7ad]/30 rounded-2xl p-3 text-center">
          <Avatar initial="Y" color="#09a7ad" size={34} />
          <div className="mt-1.5 text-[10px] text-[#8c8778] uppercase tracking-wide">Your max</div>
          <div className="text-2xl font-black text-[#09a7ad] leading-none mt-0.5">$300</div>
          <div className="mt-1 text-[10px] text-[#8c8778]">🔒 private</div>
        </div>

        <div className="flex items-center text-[#c8c3ba] text-xl font-bold shrink-0">→</div>

        {/* System */}
        <div className="flex-1 bg-[#f2efe8] border border-[#d4cfc4] rounded-2xl p-3 text-center flex flex-col items-center">
          <BotIcon size={34} />
          <div className="mt-1 text-[10px] text-[#8c8778] uppercase tracking-wide">We auto-bid</div>
          <div className="text-2xl font-black text-[#1a1916] leading-none mt-0.5">$100</div>
          <div className="mt-1 text-[10px] text-[#8c8778]">minimum</div>
        </div>

        <div className="flex items-center text-[#c8c3ba] text-xl font-bold shrink-0">→</div>

        {/* Result */}
        <div className="flex-1 bg-[#09a7ad] rounded-2xl p-3 text-center flex flex-col items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mb-1">
            <path d="M3 8H1V5h2M17 8h2V5h-2M3 8h14v5a7 7 0 0 1-14 0V8zM7 18h6M10 13v5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="text-white font-black text-sm leading-tight">You&apos;re<br/>Winning!</div>
          <div className="text-white/70 text-[10px] mt-1">at $100</div>
        </div>
      </div>

      {/* Callout */}
      <div className="bg-[#e0f5f5] border border-[#09a7ad]/20 rounded-xl px-3 py-2.5 text-center">
        <p className="text-[#0a7f84] text-xs font-semibold">
          You didn&apos;t spend $300 — you won at $100.&nbsp; Your max stays completely secret.
        </p>
      </div>
    </div>
  );
}

// ─── Scenario 2 ──────────────────────────────────────────────────────────────
// Auto-defending — shown as a chat feed (left = your auto-bids, right = B)
function S2() {
  return (
    <div className="space-y-2.5">
      {/* Context bar */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold text-[#09a7ad] flex items-center gap-1.5">
          <Avatar initial="Y" color="#09a7ad" size={18} /> YOU — max $300
        </span>
        <span className="text-[11px] font-bold text-[#6b6659] flex items-center gap-1.5">
          BIDDER B <Avatar initial="B" color="#6b6659" size={18} />
        </span>
      </div>

      {/* Round 1 */}
      {/* B bids $150 → right */}
      <div className="flex justify-end">
        <div className="bg-[#e8e4dc] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[55%]">
          <div className="text-[10px] text-[#8c8778] mb-0.5">Bidder B bids</div>
          <div className="text-lg font-black text-[#4a4640]">$150</div>
        </div>
      </div>
      {/* Auto-bid $175 → left */}
      <div className="flex items-center gap-2.5">
        <div className="bg-[#09a7ad] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[55%]">
          <div className="text-[10px] text-white/70 mb-0.5">Auto-bid for you ⚡</div>
          <div className="text-lg font-black text-white">$175</div>
        </div>
        <span className="text-xs font-bold text-[#09a7ad] whitespace-nowrap">✓ Winning</span>
      </div>

      {/* Round 2 */}
      {/* B bids $250 → right */}
      <div className="flex justify-end">
        <div className="bg-[#e8e4dc] rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[55%]">
          <div className="text-[10px] text-[#8c8778] mb-0.5">Bidder B bids again</div>
          <div className="text-lg font-black text-[#4a4640]">$250</div>
        </div>
      </div>
      {/* Auto-bid $275 → left */}
      <div className="flex items-center gap-2.5">
        <div className="bg-[#09a7ad] rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[55%]">
          <div className="text-[10px] text-white/70 mb-0.5">Auto-bid for you ⚡</div>
          <div className="text-lg font-black text-white">$275</div>
        </div>
        <span className="text-xs font-bold text-[#09a7ad] whitespace-nowrap">✓ Still winning</span>
      </div>

      {/* Callout */}
      <div className="bg-[#e0f5f5] border border-[#09a7ad]/20 rounded-xl px-3 py-2.5 text-center mt-1">
        <p className="text-[#0a7f84] text-xs font-semibold">
          Every counter-bid happens in seconds — you never have to watch the auction.&nbsp; $275 is still under your $300 max.
        </p>
      </div>
    </div>
  );
}

// ─── Scenario 3 ──────────────────────────────────────────────────────────────
// Two max bids — yours is higher — you win at just above theirs
function S3() {
  return (
    <div className="space-y-3">
      {/* Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#f0fafa] border-2 border-[#09a7ad] rounded-2xl p-3 text-center">
          <Avatar initial="Y" color="#09a7ad" size={36} />
          <div className="text-[10px] text-[#8c8778] uppercase tracking-wide mt-1.5">Your max bid</div>
          <div className="text-3xl font-black text-[#09a7ad] leading-none mt-0.5">$300</div>
        </div>
        <div className="bg-white border-2 border-[#d4cfc4] rounded-2xl p-3 text-center">
          <Avatar initial="B" color="#6b6659" size={36} />
          <div className="text-[10px] text-[#8c8778] uppercase tracking-wide mt-1.5">Bidder B max</div>
          <div className="text-3xl font-black text-[#6b6659] leading-none mt-0.5">$200</div>
        </div>
      </div>

      {/* System resolves */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[#e5e0d5]" />
        <div className="flex items-center gap-1.5 shrink-0">
          <BotIcon size={20} />
          <span className="text-[11px] text-[#8c8778]">System resolves instantly</span>
        </div>
        <div className="flex-1 h-px bg-[#e5e0d5]" />
      </div>

      {/* Result: YOU win */}
      <div className="bg-[#09a7ad] rounded-2xl p-4 text-center">
        <div className="text-white/70 text-xs font-bold uppercase tracking-wide mb-1">🏆 You win at</div>
        <div className="text-4xl font-black text-white leading-none">$225</div>
        <div className="text-white/80 text-xs mt-2 leading-relaxed">
          That&apos;s just $25 above their $200 max — <strong className="text-white">not your full $300</strong>
        </div>
      </div>

      {/* B notified */}
      <div className="bg-[#f2efe8] border border-[#d4cfc4] rounded-xl px-3 py-2.5 flex items-center gap-2.5">
        <Avatar initial="B" color="#6b6659" size={28} />
        <p className="text-[#6b6659] text-xs">Bidder B is notified they were outbid and can raise their max to jump back in.</p>
      </div>
    </div>
  );
}

// ─── Scenario 4 ──────────────────────────────────────────────────────────────
// Two max bids — theirs is higher — you lose and get notified
function S4() {
  return (
    <div className="space-y-3">
      {/* Side by side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border-2 border-[#d4cfc4] rounded-2xl p-3 text-center">
          <Avatar initial="Y" color="#09a7ad" size={36} />
          <div className="text-[10px] text-[#8c8778] uppercase tracking-wide mt-1.5">Your max bid</div>
          <div className="text-3xl font-black text-[#4a4640] leading-none mt-0.5">$150</div>
        </div>
        <div className="bg-[#f5f1ea] border-2 border-[#4a4640] rounded-2xl p-3 text-center">
          <Avatar initial="B" color="#4a4640" size={36} />
          <div className="text-[10px] text-[#8c8778] uppercase tracking-wide mt-1.5">Bidder B max</div>
          <div className="text-3xl font-black text-[#1a1916] leading-none mt-0.5">$300</div>
        </div>
      </div>

      {/* System resolves */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[#e5e0d5]" />
        <div className="flex items-center gap-1.5 shrink-0">
          <BotIcon size={20} />
          <span className="text-[11px] text-[#8c8778]">System resolves instantly</span>
        </div>
        <div className="flex-1 h-px bg-[#e5e0d5]" />
      </div>

      {/* Result: THEY win */}
      <div className="bg-[#1a1916] rounded-2xl p-4 text-center">
        <div className="text-white/50 text-xs font-bold uppercase tracking-wide mb-1">Bidder B wins at</div>
        <div className="text-4xl font-black text-white leading-none">$175</div>
        <div className="text-white/60 text-xs mt-2 leading-relaxed">
          That&apos;s just $25 above your $150 max — <strong className="text-white/80">not their full $300</strong>
        </div>
      </div>

      {/* YOU notified */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="text-amber-500 text-lg">🔔</div>
          <div className="text-amber-800 font-bold text-sm">You&apos;re notified right away</div>
        </div>
        <p className="text-amber-700 text-xs leading-relaxed">
          You&apos;ll get an alert the moment you&apos;re outbid. Just raise your max bid and you&apos;ll immediately jump back into the lead.
        </p>
      </div>
    </div>
  );
}

// ─── Scenario card wrapper ────────────────────────────────────────────────────
function Card({
  step,
  accentColor = "#09a7ad",
  title,
  subtitle,
  children,
}: {
  step: number;
  accentColor?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 mt-0.5"
          style={{ background: accentColor }}
        >
          {step}
        </div>
        <div>
          <h3 className="font-bold text-[#1a1916] text-sm leading-snug">{title}</h3>
          <p className="text-[#8c8778] text-xs mt-0.5 leading-relaxed">{subtitle}</p>
        </div>
      </div>

      {/* Illustration */}
      {children}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function MaxBidExplainerModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#faf8f4] rounded-2xl w-full max-w-md my-4 shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-br from-[#09a7ad] to-[#0bbcc2] px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-white font-extrabold text-xl leading-tight">
                How Max Bidding Works
              </h2>
              <p className="text-white/80 text-sm mt-1 leading-relaxed">
                Set your limit once — we automatically bid for you and never go over it.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors shrink-0"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Scenarios ── */}
        <div className="divide-y divide-[#e5e0d5]">

          <div className="px-5 py-6">
            <Card
              step={1}
              title="Setting a max bid — you win at the minimum"
              subtitle="Tell us your ceiling. We place the smallest possible opening bid on your behalf — you start winning without using your full max."
            >
              <S1 />
            </Card>
          </div>

          <div className="px-5 py-6">
            <Card
              step={2}
              title="Someone bids — we instantly counter for you"
              subtitle="Every time Bidder B raises the price, we automatically counter with the smallest amount needed to keep you in the lead. All in seconds."
            >
              <S2 />
            </Card>
          </div>

          <div className="px-5 py-6">
            <Card
              step={3}
              title="Two max bids — the higher one wins right away"
              subtitle="When two people both set max bids, the system resolves it instantly. The higher max wins — but only pays just above the other person's limit."
            >
              <S3 />
            </Card>
          </div>

          <div className="px-5 py-6">
            <Card
              step={4}
              accentColor="#f59e0b"
              title="If their max is higher — you're outbid instantly"
              subtitle="Your $150 max can't beat their $300 max. The system resolves it right away and sends you a notification so you can raise your max and jump back in."
            >
              <S4 />
            </Card>
          </div>

        </div>

        {/* ── CTA ── */}
        <div className="px-5 py-4 bg-white border-t border-[#e5e0d5]">
          <button
            onClick={onClose}
            className="w-full bg-[#09a7ad] hover:bg-[#0898a0] text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
          >
            Got it — set my max bid
          </button>
        </div>

      </div>
    </div>
  );
}
