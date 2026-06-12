import Link from "next/link";

export default function PaymentCancelled() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md w-full">
        {/* SVG illustration */}
        <div className="flex justify-center mb-8">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="38" stroke="#374151" strokeWidth="1.5"/>
            <circle cx="40" cy="40" r="28" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.3"/>
            <circle cx="40" cy="40" r="18" fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth="1.5"/>
            {/* X mark */}
            <path d="M33 33l14 14M47 33L33 47" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-3">Payment Not Completed</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          No charge was made. Your winning bid is still reserved — you can complete payment anytime from your dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-semibold transition-colors hover:shadow-[0_0_20px_rgba(52,211,153,0.25)]"
          >
            Complete Payment
          </Link>
          <Link
            href="/auctions"
            className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
          >
            Browse Auctions
          </Link>
        </div>
      </div>
    </main>
  );
}
