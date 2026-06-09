import Link from "next/link";

export default function PaymentCancelled() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">😕</div>
        <h1 className="text-3xl font-bold mb-4">Payment Cancelled</h1>
        <p className="text-gray-400 mb-8">
          Your payment was cancelled. Your winning bid is still reserved — you can complete payment at any time.
        </p>
        <Link href="/" className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-semibold">
          Back to Auctions
        </Link>
      </div>
    </main>
  );
}