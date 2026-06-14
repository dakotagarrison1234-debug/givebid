"use client";

// ─── shared design tokens ─────────────────────────────────────────────────────
const T  = "#09a7ad";  // teal  — "you winning"
const TL = "#e0f5f5";  // teal light bg
const TD = "#0a7f84";  // teal dark text
const G  = "#6b6659";  // gray  — body text
const GL = "#f2efe8";  // gray light — subtle bg
const D  = "#1a1916";  // dark  — headings
const M  = "#b0a99a";  // muted — arrows / borders
const A  = "#f59e0b";  // amber — alert
const AL = "#fef3c7";  // amber light bg

// ─── tiny arrow-head marker (each scenario needs a unique id) ────────────────
function AH({ id, fill = M }: { id: string; fill?: string }) {
  return (
    <defs>
      <marker id={id} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <polygon points="0 0, 7 3.5, 0 7" fill={fill} />
      </marker>
    </defs>
  );
}

// ─── person avatar ────────────────────────────────────────────────────────────
function Person({
  cx, cy, initial, color, label,
}: {
  cx: number; cy: number; initial: string; color: string; label: string;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={22} fill={color} opacity={0.12} />
      <circle cx={cx} cy={cy} r={16} fill={color} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} fontWeight="900" fill="white">
        {initial}
      </text>
      <text x={cx} y={cy + 38} textAnchor="middle" fontSize={10} fontWeight="700" fill={D}>
        {label}
      </text>
    </g>
  );
}

// ─── bot icon ────────────────────────────────────────────────────────────────
function Bot({ cx, cy, label }: { cx: number; cy: number; label?: string }) {
  return (
    <g>
      <rect x={cx - 18} y={cy - 18} width={36} height={36} rx={8} fill="white" stroke={T} strokeWidth={1.5} />
      <circle cx={cx - 6} cy={cy - 1} r={4} fill={T} />
      <circle cx={cx + 6} cy={cy - 1} r={4} fill={T} />
      <path d={`M${cx - 8} ${cy + 11}h16`} stroke={T} strokeWidth={2} strokeLinecap="round" />
      {/* antenna */}
      <line x1={cx} y1={cy - 18} x2={cx} y2={cy - 26} stroke={T} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy - 28} r={3} fill={T} />
      {label && (
        <text x={cx} y={cy + 40} textAnchor="middle" fontSize={9} fill={G}>
          {label}
        </text>
      )}
    </g>
  );
}

// ─── bid pill ────────────────────────────────────────────────────────────────
function Pill({
  cx, cy, text, color = T, bg,
}: {
  cx: number; cy: number; text: string; color?: string; bg?: string;
}) {
  const w = Math.max(64, text.length * 9 + 18);
  return (
    <g>
      <rect x={cx - w / 2} y={cy - 14} width={w} height={28} rx={14}
        fill={bg ?? color} fillOpacity={bg ? 1 : 0.12}
        stroke={bg ? "none" : color} strokeWidth={1.5}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight="800"
        fill={bg ? "white" : color}
      >
        {text}
      </text>
    </g>
  );
}

// ─── winning badge (solid teal) ───────────────────────────────────────────────
function WinBadge({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 42} y={cy - 13} width={84} height={26} rx={13} fill={T} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={11} fontWeight="700" fill="white">
        ✓ Winning!
      </text>
    </g>
  );
}

// ─── outbid / notified badge (amber) ─────────────────────────────────────────
function OutBadge({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <rect x={cx - 48} y={cy - 13} width={96} height={26} rx={13} fill={AL} stroke={A} strokeWidth={1.5} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={10} fontWeight="700" fill="#92400e">
        Outbid — you&apos;re notified
      </text>
    </g>
  );
}

// ─── scenario 1: basic max bid ────────────────────────────────────────────────
// YOU set max → system places minimum → Winning at start price
function Scenario1() {
  const y = 60;
  return (
    <svg viewBox="0 0 320 145" className="w-full h-auto" style={{ display: "block" }}>
      <AH id="s1a" />

      {/* YOU */}
      <Person cx={40} cy={y} initial="Y" color={T} label="YOU" />
      {/* Your max label */}
      <text x={40} y={y + 55} textAnchor="middle" fontSize={9} fill={TD}>max: $300</text>

      {/* arrow: YOU → pill */}
      <line x1={62} y1={y} x2={82} y2={y} stroke={M} strokeWidth={1.5} markerEnd="url(#s1a)" />

      {/* MAX pill */}
      <rect x={84} y={y - 16} width={70} height={32} rx={16}
        fill={T} fillOpacity={0.1} stroke={T} strokeWidth={1.5} />
      <text x={119} y={y - 4} textAnchor="middle" fontSize={8.5} fill={G}>YOUR MAX</text>
      <text x={119} y={y + 11} textAnchor="middle" fontSize={14} fontWeight="800" fill={T}>$300</text>
      <text x={119} y={y + 40} textAnchor="middle" fontSize={8.5} fill={G}>🔒 stays private</text>

      {/* arrow: pill → bot */}
      <line x1={156} y1={y} x2={174} y2={y} stroke={M} strokeWidth={1.5} markerEnd="url(#s1a)" />

      {/* BOT */}
      <Bot cx={194} cy={y} label="auto-bids" />

      {/* arrow: bot → result */}
      <line x1={214} y1={y} x2={232} y2={y} stroke={M} strokeWidth={1.5} markerEnd="url(#s1a)" />

      {/* result box */}
      <rect x={234} y={y - 22} width={76} height={44} rx={10}
        fill="white" stroke={T} strokeWidth={2} />
      <text x={272} y={y - 6} textAnchor="middle" fontSize={8.5} fill={G}>Current bid</text>
      <text x={272} y={y + 13} textAnchor="middle" fontSize={18} fontWeight="900" fill={T}>$100</text>

      {/* winning badge */}
      <WinBadge cx={272} cy={y + 52} />

      {/* bottom note */}
      <rect x={74} y={118} width={156} height={18} rx={6} fill={TL} />
      <text x={152} y={130} textAnchor="middle" fontSize={9} fill={TD}>
        Minimum bid placed for you automatically
      </text>
    </svg>
  );
}

// ─── scenario 2: auto-defending ───────────────────────────────────────────────
// B bids → system instantly counters for YOU → you stay winning
function Scenario2() {
  return (
    <svg viewBox="0 0 320 175" className="w-full h-auto" style={{ display: "block" }}>
      <AH id="s2a" fill={M} />
      <AH id="s2t" fill={T} />

      {/* Column headers */}
      <rect x={4} y={6} width={80} height={22} rx={11} fill={TL} />
      <text x={44} y={21} textAnchor="middle" fontSize={9.5} fontWeight="700" fill={TD}>YOU (max $300)</text>

      <rect x={236} y={6} width={80} height={22} rx={11} fill={GL} />
      <text x={276} y={21} textAnchor="middle" fontSize={9.5} fontWeight="700" fill={G}>BIDDER B</text>

      {/* Vertical divider */}
      <line x1={160} y1={36} x2={160} y2={168} stroke={M} strokeWidth={1} strokeDasharray="3,3" />

      {/* ROW 1: you winning at $100 */}
      <Pill cx={80} cy={58} text="$100 ✓" color={T} />
      <text x={80} y={78} textAnchor="middle" fontSize={8.5} fill={G}>winning</text>

      {/* ROW 2: B bids $150 */}
      <Pill cx={240} cy={58} text="bids $150" color={G} />

      {/* Arrow: B bids → auto responds */}
      <line x1={200} y1={58} x2={132} y2={92} stroke={M} strokeWidth={1.5} markerEnd="url(#s2a)" />
      <text x={164} y={80} textAnchor="middle" fontSize={8} fill={M} transform="rotate(-22 164 80)">triggers</text>

      {/* ROW 3: auto-bid $175 */}
      <Pill cx={80} cy={105} text="$175 ✓" color={T} bg={T} />
      <text x={80} y={125} textAnchor="middle" fontSize={8.5} fill={G}>auto-bid! still winning</text>

      {/* ROW 4: B bids $250 */}
      <Pill cx={240} cy={105} text="bids $250" color={G} />

      {/* Arrow: B bids again → auto responds */}
      <line x1={200} y1={105} x2={132} y2={138} stroke={M} strokeWidth={1.5} markerEnd="url(#s2a)" />

      {/* ROW 5: auto-bid $275 */}
      <Pill cx={80} cy={152} text="$275 ✓" color={T} bg={T} />
      <text x={80} y={170} textAnchor="middle" fontSize={8.5} fill={G}>still under $300 max!</text>

      {/* "Instant" labels */}
      <text x={130} y={93} textAnchor="middle" fontSize={8} fill={T}>instant!</text>
      <text x={130} y={140} textAnchor="middle" fontSize={8} fill={T}>instant!</text>
    </svg>
  );
}

// ─── scenario 3: two max bids — higher wins ────────────────────────────────────
// YOU max $300 vs THEM max $200 → YOU win at $225
function Scenario3() {
  return (
    <svg viewBox="0 0 320 190" className="w-full h-auto" style={{ display: "block" }}>
      <AH id="s3a" />

      {/* Persons at top */}
      <Person cx={72} cy={52} initial="Y" color={T} label="YOU" />
      <text x={72} y={96} textAnchor="middle" fontSize={9.5} fontWeight="700" fill={TD}>max bid: $300</text>

      <Person cx={248} cy={52} initial="B" color={G} label="BIDDER B" />
      <text x={248} y={96} textAnchor="middle" fontSize={9.5} fontWeight="700" fill={G}>max bid: $200</text>

      {/* "vs" */}
      <circle cx={160} cy={52} r={18} fill={GL} />
      <text x={160} y={57} textAnchor="middle" fontSize={12} fontWeight="900" fill={G}>vs</text>

      {/* Arrows: both down toward system */}
      <line x1={96} y1={68} x2={140} y2={105} stroke={M} strokeWidth={1.5} markerEnd="url(#s3a)" />
      <line x1={224} y1={68} x2={180} y2={105} stroke={M} strokeWidth={1.5} markerEnd="url(#s3a)" />

      {/* System BOT in middle */}
      <Bot cx={160} cy={120} label="resolves instantly" />

      {/* Arrow down to result */}
      <line x1={160} y1={140} x2={160} y2={156} stroke={T} strokeWidth={2} markerEnd="url(#s3a)" />

      {/* Result box */}
      <rect x={90} y={158} width={140} height={26} rx={13} fill={T} />
      <text x={160} y={175} textAnchor="middle" fontSize={12} fontWeight="800" fill="white">YOU win at $225</text>

      {/* Note */}
      <text x={160} y={195} textAnchor="middle" fontSize={9} fill={G}>
        just $25 above their $200 max — not your full $300
      </text>
    </svg>
  );
}

// ─── scenario 4: two max bids — you lose, notified ────────────────────────────
// YOU max $150 vs THEM max $300 → THEY win at $175, YOU notified
function Scenario4() {
  return (
    <svg viewBox="0 0 320 210" className="w-full h-auto" style={{ display: "block" }}>
      <AH id="s4a" />

      {/* Persons at top */}
      <Person cx={72} cy={52} initial="Y" color={T} label="YOU" />
      <text x={72} y={96} textAnchor="middle" fontSize={9.5} fontWeight="700" fill={TD}>max bid: $150</text>

      <Person cx={248} cy={52} initial="B" color={G} label="BIDDER B" />
      <text x={248} y={96} textAnchor="middle" fontSize={9.5} fontWeight="700" fill={G}>max bid: $300</text>

      {/* "vs" */}
      <circle cx={160} cy={52} r={18} fill={GL} />
      <text x={160} y={57} textAnchor="middle" fontSize={12} fontWeight="900" fill={G}>vs</text>

      {/* Arrows down toward system */}
      <line x1={96} y1={68} x2={140} y2={105} stroke={M} strokeWidth={1.5} markerEnd="url(#s4a)" />
      <line x1={224} y1={68} x2={180} y2={105} stroke={M} strokeWidth={1.5} markerEnd="url(#s4a)" />

      {/* System BOT */}
      <Bot cx={160} cy={120} label="resolves instantly" />

      {/* Arrow down to result */}
      <line x1={160} y1={140} x2={160} y2={156} stroke={M} strokeWidth={2} markerEnd="url(#s4a)" />

      {/* Result: THEY win */}
      <rect x={82} y={158} width={156} height={26} rx={13} fill="#4a4640" />
      <text x={160} y={175} textAnchor="middle" fontSize={12} fontWeight="800" fill="white">THEY win at $175</text>
      <text x={160} y={195} textAnchor="middle" fontSize={9} fill={G}>
        just $25 above your $150 max
      </text>

      {/* Notification arrow → YOU */}
      <line x1={82} y1={171} x2={72} y2={190} stroke={A} strokeWidth={1.5} markerEnd="url(#s4a)" />

      {/* YOU notified badge */}
      <OutBadge cx={72} cy={207} />
    </svg>
  );
}

// ─── scenario card wrapper ────────────────────────────────────────────────────
function ScenarioCard({
  step,
  stepColor = T,
  title,
  children,
  note,
}: {
  step: number;
  stepColor?: string;
  title: string;
  children: React.ReactNode;
  note: string;
}) {
  return (
    <div className="border border-[#e5e0d5] rounded-2xl overflow-hidden">
      {/* header bar */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#f5f1ea] border-b border-[#e5e0d5]">
        <span
          className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
          style={{ background: stepColor }}
        >
          {step}
        </span>
        <h3 className="font-bold text-[#1a1916] text-sm">{title}</h3>
      </div>

      {/* illustration */}
      <div className="bg-[#faf8f4] px-3 pt-3 pb-1">{children}</div>

      {/* note */}
      <div className="px-4 py-3 bg-white">
        <p className="text-[#6b6659] text-xs leading-relaxed">{note}</p>
      </div>
    </div>
  );
}

// ─── main modal ───────────────────────────────────────────────────────────────
export default function MaxBidExplainerModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md my-4 shadow-2xl overflow-hidden">

        {/* ── header ── */}
        <div className="bg-gradient-to-r from-[#09a7ad] to-[#0bbcc2] px-5 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-extrabold text-lg text-white leading-tight">
                How Max Bidding Works
              </h2>
              <p className="text-white/80 text-sm mt-0.5">
                Set your limit once — we handle the rest automatically
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-white/70 hover:text-white w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors shrink-0 mt-0.5"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── scenarios ── */}
        <div className="divide-y divide-[#e5e0d5]">

          {/* 1 */}
          <div className="p-4">
            <ScenarioCard
              step={1}
              title="Setting a max bid"
              note="You tell us your ceiling. We automatically place the lowest possible opening bid on your behalf — so you start winning without spending your max. Your limit stays completely private."
            >
              <Scenario1 />
            </ScenarioCard>
          </div>

          {/* 2 */}
          <div className="p-4">
            <ScenarioCard
              step={2}
              title="We auto-bid to keep you winning"
              note="Every time someone places a bid below your max, we instantly counter-bid the minimum amount needed to stay in the lead. This happens automatically in seconds — no action needed from you."
            >
              <Scenario2 />
            </ScenarioCard>
          </div>

          {/* 3 */}
          <div className="p-4">
            <ScenarioCard
              step={3}
              title="Two max bids — higher one wins instantly"
              note="When two people set max bids at the same time, the system immediately resolves it: the higher max wins — but only at one increment above the other person's max. Not at their full limit."
            >
              <Scenario3 />
            </ScenarioCard>
          </div>

          {/* 4 */}
          <div className="p-4">
            <ScenarioCard
              step={4}
              stepColor={A}
              title="What happens if you're outbid"
              note="If someone else's max is higher than yours, they win right away and you're notified immediately. You can then choose to raise your max bid and jump back into the lead — or step aside."
            >
              <Scenario4 />
            </ScenarioCard>
          </div>

        </div>

        {/* ── CTA ── */}
        <div className="p-4 bg-[#faf8f4] border-t border-[#e5e0d5]">
          <button
            onClick={onClose}
            className="w-full bg-[#09a7ad] hover:bg-[#0898a0] text-white font-bold py-3 rounded-xl transition-colors"
          >
            Got it — set my max bid
          </button>
        </div>

      </div>
    </div>
  );
}
