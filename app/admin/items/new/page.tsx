"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function NewItemForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAuctionId = searchParams.get("auctionId") || "";

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [auctions, setAuctions] = useState<{ id: string; title: string }[]>([]);
  const [orgId, setOrgId] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "", description: "", condition: "GOOD", category: "",
    retailValue: "", startingBid: "", reservePrice: "", donorName: "",
    taxDeductible: false, storageLocation: "", notes: "",
    auctionId: preselectedAuctionId,
  });

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.orgId) setOrgId(d.orgId);
    });
    fetch("/api/auctions").then(r => r.json()).then(d => {
      if (d.auctions) {
        // Only show auctions that can accept new items (not closed/settled)
        setAuctions(d.auctions.filter((a: { id: string; title: string; status: string }) =>
          ["DRAFT", "OPEN", "CLOSING"].includes(a.status)
        ));
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 10) { alert("Maximum 10 photos per item"); return; }
    setUploading(true);
    const failed: string[] = [];
    for (const file of files) {
      // Derive MIME type from extension when browser doesn't populate file.type (common on mobile)
      let fileType = file.type;
      if (!fileType) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        const extMap: Record<string, string> = {
          jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
          webp: "image/webp", gif: "image/gif", heic: "image/heic",
          heif: "image/heif", avif: "image/avif",
        };
        fileType = extMap[ext] ?? "image/jpeg";
      }
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileType }),
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const { signedUrl, publicUrl } = await res.json();
        const putRes = await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": fileType } });
        if (!putRes.ok) throw new Error(`Storage error ${putRes.status}`);
        setPhotos(prev => [...prev, publicUrl]);
      } catch (err) {
        console.error(`Upload failed for ${file.name}:`, err);
        failed.push(file.name);
      }
    }
    e.target.value = "";
    setUploading(false);
    if (failed.length) alert(`Failed to upload: ${failed.join(", ")}\n\nCheck that files are under 10MB and a supported format (JPG, PNG, WebP, HEIC).`);
  };

  const handleSave = async () => {
    if (!formData.title) { alert("Please enter an item title"); return; }
    if (!orgId) { alert("Organization not loaded. Please refresh."); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, photos, organizationId: orgId }),
      });
      const data = await res.json();
      if (data.success) {
        // Redirect back to the auction if we came from one
        if (preselectedAuctionId) {
          router.push(`/admin/auctions/${preselectedAuctionId}`);
        } else {
          router.push("/admin/auctions");
        }
      } else {
        alert("Error saving item: " + data.error);
      }
    } catch { alert("Something went wrong."); }
    finally { setSaving(false); }
  };

  return (
    <>
      <header className="border-b border-gray-800 px-4 sm:px-8 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          {preselectedAuctionId ? (
            <Link href={`/admin/auctions/${preselectedAuctionId}`} className="text-gray-400 hover:text-white text-sm shrink-0">
              ← Auction
            </Link>
          ) : (
            <Link href="/admin/items" className="text-gray-400 hover:text-white text-sm shrink-0">← Items</Link>
          )}
          <span className="text-gray-600">/</span>
          <h1 className="text-lg sm:text-xl font-semibold">Add New Item</h1>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm px-4 sm:px-6 py-2 rounded-lg font-semibold shrink-0">
          {saving ? "Saving..." : "Save Item"}
        </button>
      </header>

      <div className="flex-1 px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 overflow-auto">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Item Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Item Title *</label>
                <input name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Apple iPad Pro 12.9&quot;"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3}
                  placeholder="Describe the item..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Condition *</label>
                  <select name="condition" value={formData.condition} onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                    <option value="NEW">New</option>
                    <option value="LIKE_NEW">Like New</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                    <option value="">Select category</option>
                    {["Electronics","Sports","Experiences","Food & Drink","Outdoors","Home & Garden","Art & Collectibles","Gift Cards","Other"].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Retail / Est. Value", name: "retailValue", placeholder: "0.00" },
                { label: "Starting Bid *", name: "startingBid", placeholder: "0.00" },
                { label: "Reserve Price", name: "reservePrice", placeholder: "Optional" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="text-sm text-gray-400 mb-1 block">{field.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input name={field.name} value={formData[field.name as keyof typeof formData] as string}
                      onChange={handleChange} type="number" placeholder={field.placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Photos <span className="text-gray-500 text-sm font-normal">(up to 10)</span></h2>
            <input type="file" accept="image/*" multiple id="photo-upload" className="hidden" onChange={handlePhotoUpload} />
            <label htmlFor="photo-upload"
              className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center hover:border-emerald-500 transition-colors cursor-pointer block">
              <div className="text-gray-500 mb-2 flex justify-center"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="15" rx="2"/><circle cx="12" cy="13.5" r="4"/><path d="M9 6l1.5-3h3L15 6"/></svg></div>
              <div className="text-gray-400 text-sm">{uploading ? "Uploading..." : "Click to upload photos"}</div>
              <div className="text-gray-600 text-xs mt-1">PNG, JPG up to 10MB each</div>
            </label>
            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {photos.map((url, i) => (
                  <div key={i} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-contain" />
                    <button onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Donor Info</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Donor Name</label>
                <input name="donorName" value={formData.donorName} onChange={handleChange}
                  placeholder="Who donated this?"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" name="taxDeductible" checked={formData.taxDeductible}
                  onChange={handleChange} id="taxDeductible" className="w-4 h-4 accent-emerald-500" />
                <label htmlFor="taxDeductible" className="text-sm text-gray-300">Tax deductible donation</label>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Storage Location</h2>
            <input name="storageLocation" value={formData.storageLocation} onChange={handleChange}
              placeholder="e.g. Room B / Shelf 2 / Bin 4"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500" />
            <p className="text-gray-600 text-xs mt-2">Used by staff to locate item during pickup</p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Assign to Auction</h2>
            {preselectedAuctionId ? (
              <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white flex items-center justify-between">
                <span>{auctions.find(a => a.id === preselectedAuctionId)?.title ?? "Loading..."}</span>
                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Pre-assigned</span>
              </div>
            ) : (
              <select name="auctionId" value={formData.auctionId} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                <option value="">Save as draft</option>
                {auctions.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            )}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">Staff Notes</h2>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3}
              placeholder="Internal notes — not visible to bidders"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
        </div>
      </div>
    </>
  );
}

export default function NewItemPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>}>
      <NewItemForm />
    </Suspense>
  );
}
