export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { requireUserOrg } from "@/lib/auth";
import PickupControls from "@/app/components/PickupControls";

function IcoPickedUp() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 8l4 4 7-7"/></svg>;
}
function IcoPending() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="8" r="5"/><circle cx="8" cy="8" r="2" fill="currentColor" stroke="none"/></svg>;
}
function IcoOpen() {
  return <svg width="16" height="16" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="8" r="5.5"/></svg>;
}
function IcoPin() {
  return <svg width="11" height="11" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="6" cy="5" r="1.8"/><path d="M6 1C3.79 1 2 2.79 2 5c0 3 4 7 4 7s4-4 4-7c0-2.21-1.79-4-4-4z"/></svg>;
}

export default async function PickupPage() {
  const membership = await requireUserOrg();
  const orgId = membership.organization.id;

  const orgItems = await prisma.item.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  });
  const orgItemIds = orgItems.map((i) => i.id);

  const wonBids = await prisma.bid.findMany({
    where: { status: "WON", itemId: { in: orgItemIds } },
    include: { item: true },
    orderBy: { placedAt: "desc" },
  });

  const winnerIds = [...new Set(wonBids.map((b) => b.clerkUserId))];

  const [payments, profiles] = await Promise.all([
    prisma.payment.findMany({ where: { itemId: { in: orgItemIds } } }),
    winnerIds.length
      ? prisma.bidderProfile.findMany({ where: { clerkUserId: { in: winnerIds } } })
      : Promise.resolve([]),
  ]);

  const profileMap = new Map(profiles.map((p) => [p.clerkUserId, p]));
  const paymentMap = new Map(payments.map((p) => [p.itemId, p]));

  // Group bids by bidder
  type WonBid = (typeof wonBids)[0];
  type Profile = (typeof profiles)[0];
  const grouped: Record<string, { profile: Profile | null; bids: WonBid[] }> = {};
  for (const bid of wonBids) {
    if (!grouped[bid.clerkUserId]) {
      grouped[bid.clerkUserId] = { profile: profileMap.get(bid.clerkUserId) ?? null, bids: [] };
    }
    grouped[bid.clerkUserId].bids.push(bid);
  }

  // Sort: people with pending items first, then fully picked up
  const sortedEntries = Object.entries(grouped).sort(([, a], [, b]) => {
    const aPending = a.bids.filter((b) => (b.item.status as string) !== "PICKED_UP").length;
    const bPending = b.bids.filter((b) => (b.item.status as string) !== "PICKED_UP").length;
    return bPending - aPending;
  });

  const totalItems = wonBids.length;
  const pickedUpItems = wonBids.filter((b) => (b.item.status as string) === "PICKED_UP").length;
  const pct = totalItems > 0 ? Math.round((pickedUpItems / totalItems) * 100) : 0;

  return (
    <>
      <header className="border-b border-gray-800 px-4 sm:px-8 py-4">
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Pickup</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {pickedUpItems} of {totalItems} items picked up
            </p>
          </div>
          {totalItems > 0 && (
            <div className="text-right shrink-0">
              <span className="text-2xl font-bold text-white">{pct}%</span>
              <p className="text-xs text-gray-500">complete</p>
            </div>
          )}
        </div>
        {totalItems > 0 && (
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </header>

      <div className="px-4 sm:px-8 py-6 space-y-4">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No winners yet — winners appear when an auction closes.
          </div>
        ) : (
          sortedEntries.map(([clerkUserId, { profile, bids }]) => {
            const pickedUp = bids.filter((b) => (b.item.status as string) === "PICKED_UP").length;
            const allDone = pickedUp === bids.length;
            const paidCount = bids.filter((b) => paymentMap.get(b.itemId)?.status === "PAID").length;
            const totalOwed = bids.reduce((sum, b) => sum + Number(b.amount), 0);

            // Items still needing action (not yet PICKED_UP)
            const pendingItemIds = bids
              .filter((b) => (b.item.status as string) !== "PICKED_UP")
              .map((b) => b.item.id);

            return (
              <div
                key={clerkUserId}
                className={`rounded-xl border overflow-hidden transition-opacity ${
                  allDone ? "border-gray-800 opacity-50" : "border-gray-700"
                }`}
              >
                {/* Winner header */}
                <div
                  className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    allDone ? "bg-gray-900/40" : "bg-gray-900"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white text-base">
                        {profile?.name ?? "Unknown Bidder"}
                      </span>
                      {allDone ? (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <IcoPickedUp /> All picked up
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                          {pickedUp}/{bids.length} done
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-gray-400">
                      {profile?.email && <span>{profile.email}</span>}
                      {profile?.phone && <span>{profile.phone}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-gray-500">
                      <span>
                        {paidCount === bids.length ? (
                          <span className="text-emerald-400 inline-flex items-center gap-0.5"><IcoPickedUp />Fully paid</span>
                        ) : (
                          <span className="text-yellow-400">{paidCount}/{bids.length} items paid</span>
                        )}
                      </span>
                      <span>Total won: ${totalOwed.toLocaleString()}</span>
                    </div>
                  </div>

                  {!allDone && pendingItemIds.length > 0 && (
                    <div className="shrink-0">
                      <PickupControls itemIds={pendingItemIds} mode="all" />
                    </div>
                  )}
                </div>

                {/* Item rows */}
                <div className="divide-y divide-gray-800/60">
                  {bids.map((bid) => {
                    const payment = paymentMap.get(bid.itemId);
                    const isPickedUp = (bid.item.status as string) === "PICKED_UP";
                    const isPendingPickup = (bid.item.status as string) === "PENDING_PICKUP";

                    return (
                      <div
                        key={bid.id}
                        className={`px-5 py-3 flex items-center gap-3 ${
                          isPickedUp ? "bg-gray-950/60" : "bg-gray-950"
                        }`}
                      >
                        {/* Status dot */}
                        <span
                          className={`text-xl shrink-0 leading-none ${
                            isPickedUp ? "text-emerald-400" : isPendingPickup ? "text-yellow-400" : "text-gray-600"
                          }`}
                        >
                          {isPickedUp ? <IcoPickedUp /> : isPendingPickup ? <IcoPending /> : <IcoOpen />}
                        </span>

                        {/* Item info */}
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-medium text-sm ${
                              isPickedUp ? "text-gray-500 line-through" : "text-white"
                            }`}
                          >
                            {bid.item.title}
                          </div>
                          {bid.item.storageLocation ? (
                            <div className="text-xs font-mono text-emerald-400 mt-0.5 flex items-center gap-0.5">
                              <IcoPin />{bid.item.storageLocation}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-600 mt-0.5">No location set</div>
                          )}
                        </div>

                        {/* Right side: amount + payment + action */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <span className="text-sm font-bold text-white hidden sm:block">
                            ${Number(bid.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {payment?.status === "PAID" ? (
                            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                              Paid
                            </span>
                          ) : (
                            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                              Unpaid
                            </span>
                          )}
                          {isPickedUp ? (
                            <span className="text-xs text-gray-600 hidden sm:block">Picked up</span>
                          ) : (
                            <PickupControls
                              itemIds={[bid.item.id]}
                              mode="single"
                              currentStatus={bid.item.status as string}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
