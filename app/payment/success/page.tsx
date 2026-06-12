import Link from "next/link";

function SuccessIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-32 h-32" aria-hidden="true">
      <defs>
        <radialGradient id="sg1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sg2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Outer glow rings */}
      <circle cx="100" cy="100" r="95" fill="url(#sg1)" />
      <circle cx="100" cy="100" r="70" fill="url(#sg2)" />
      <circle cx="100" cy="100" r="90" stroke="#10b981" strokeOpacity="0.12" strokeWidth="1" />
      <circle cx="100" cy="100" r="72" stroke="#10b981" strokeOpacity="0.18" strokeWidth="1" />
      <circle cx="100" cy="100" r="55" stroke="#10b981" strokeOpacity="0.25" strokeWidth="1.5" />
      {/* Main circle */}
      <circle cx="100" cy="100" r="44" fill="#052e16" stroke="#10b981" strokeWidth="1.5" />
      {/* Checkmark */}
      <path d="M82 100l12 12 24-24" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Sparkle dots */}
      <circle cx="30" cy="60" r="2.5" fill="#34d399" opacity="0.5" />
      <circle cx="170" cy="70" r="2" fill="#34d399" opacity="0.4" />
      <circle cx="155" cy="150" r="3" fill="#34d399" opacity="0.3" />
      <circle cx="45" cy="155" r="2" fill="#34d399" opacity="0.4" />
      <circle cx="100" cy="20" r="2" fill="#34d399" opacity="0.5" />
    </svg>
  );
}

export default function PaymentSuccess() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative text-center max-w-md w-full">
        {/* Illustration */}
        <div className="flex justify-center mb-8">
          <SuccessIllustration />
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          Payment confirmed
        </h1>

        <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8">
          You&apos;re all set. A confirmation email is on its way with pickup details.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3.5 rounded-2xl transition-all hover:shadow-[0_0_30px_rgba(52,211,153,0.3)] text-sm"
          >
            Go to My Dashboard
          </Link>
          <Link
            href="/auctions"
            className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white font-semibold px-8 py-3.5 rounded-2xl transition-colors text-sm"
          >
            Browse More Auctions
          </Link>
        </div>
      </div>
    </main>
  );
}
