"use client";
import { useState } from "react";
import Link from "next/link";

export default function NewItemPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    condition: "GOOD",
    category: "",
    retailValue: "",
    startingBid: "",
    reservePrice: "",
    donorName: "",
    taxDeductible: false,
    storageLocation: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-800">
          <span className="text-emerald-400 font-bold text-xl">GiveBid</span>
          <p className="text-gray-500 text-xs mt-1">Owosso Schools</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { label: "Overview", href: "/admin/dashboard", icon: "▦" },
            { label: "Items", href: "/admin/items", icon: "☰" },
            { label: "Auctions", href: "/admin/auctions", icon: "◷" },
            { label: "Winners", href: "/admin/winners", icon: "✓" },
            { label: "Settings", href: "/admin/settings", icon: "⚙" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/items" className="text-gray-400 hover:text-white text-sm">← Items</Link>
            <span className="text-gray-600">/</span>
            <h1 className="text-xl font-semibold">Add New Item</h1>
          </div>
          <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm px-6 py-2 rounded-lg font-semibold">
            Save Item
          </button>
        </header>

        <div className="flex-1 px-8 py-6 grid grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="col-span-2 space-y-6">

            {/* Basic Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Item Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Item Title *</label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Apple iPad Pro 12.9&quot;"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe the item, include any relevant details..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Condition *</label>
                    <select
                      name="condition"
                      value={formData.condition}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="NEW">New</option>
                      <option value="LIKE_NEW">Like New</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Sports">Sports</option>
                      <option value="Experiences">Experiences</option>
                      <option value="Food">Food & Drink</option>
                      <option value="Outdoors">Outdoors</option>
                      <option value="Home">Home & Garden</option>
                      <option value="Art">Art & Collectibles</option>
                      <option value="Gift Cards">Gift Cards</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Pricing</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Retail / Est. Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      name="retailValue"
                      value={formData.retailValue}
                      onChange={handleChange}
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Starting Bid *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      name="startingBid"
                      value={formData.startingBid}
                      onChange={handleChange}
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Reserve Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      name="reservePrice"
                      value={formData.reservePrice}
                      onChange={handleChange}
                      type="number"
                      placeholder="Optional"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Photos */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Photos <span className="text-gray-500 text-sm font-normal">(up to 10)</span></h2>
              <div className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                <div className="text-gray-500 mb-2">📷</div>
                <div className="text-gray-400 text-sm">Click to upload photos</div>
                <div className="text-gray-600 text-xs mt-1">PNG, JPG up to 10MB each</div>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* Donor Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Donor Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Donor Name</label>
                  <input
                    name="donorName"
                    value={formData.donorName}
                    onChange={handleChange}
                    placeholder="Who donated this?"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="taxDeductible"
                    checked={formData.taxDeductible}
                    onChange={handleChange}
                    id="taxDeductible"
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <label htmlFor="taxDeductible" className="text-sm text-gray-300">
                    Tax deductible donation
                  </label>
                </div>
              </div>
            </div>

            {/* Storage */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Storage Location</h2>
              <input
                name="storageLocation"
                value={formData.storageLocation}
                onChange={handleChange}
                placeholder="e.g. Room B / Shelf 2 / Bin 4"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-gray-600 text-xs mt-2">Used by staff to locate item during pickup</p>
            </div>

            {/* Auction Assignment */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Assign to Auction</h2>
              <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500">
                <option value="">Save as draft</option>
                <option value="1">Spring Gala 2025</option>
                <option value="2">Tech Drive</option>
              </select>
            </div>

            {/* Staff Notes */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h2 className="font-semibold mb-4">Staff Notes</h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Internal notes — not visible to bidders"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}