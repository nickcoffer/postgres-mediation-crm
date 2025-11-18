"use client";
import { useState } from "react";
import { API_BASE } from "../app/lib/api"; // ✅ relative path that exists

export default function NewCaseModal({ isOpen, onClose, onCreated }: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    enquiry_date: new Date().toISOString().slice(0, 10),
    voucher_used: false,
    party1_name: "",
    party1_email: "",
    party1_phone: "",
    party2_name: "",
    party2_email: "",
    party2_phone: "",
    internal_notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: any) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  // ✅ Updated version
  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");

      // Auto-generate a case reference, title, and default status
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 9000) + 1000;
      const reference = "C-" + year + "-" + random;

      const autoTitle =
        (form.party1_name ? form.party1_name : "Party 1") +
        " & " +
        (form.party2_name ? form.party2_name : "Party 2");

      const payload = {
        reference,
        title: autoTitle,
        status: "ENQUIRY",
        enquiry_date: form.enquiry_date,
        voucher_used: form.voucher_used,
        party1_name: form.party1_name,
        party1_email: form.party1_email,
        party1_phone: form.party1_phone,
        party2_name: form.party2_name,
        party2_email: form.party2_email,
        party2_phone: form.party2_phone,
        internal_notes: form.internal_notes
      };

      const res = await fetch(API_BASE + "/api/cases/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let msg = "Failed to create case";
        try {
          const data = await res.json();
          if (data && typeof data === "object") {
            msg += ": " + JSON.stringify(data);
          }
        } catch { }
        throw new Error(msg);
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-semibold mb-4">New Case</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Enquiry Date *</label>
              <input
                type="date"
                name="enquiry_date"
                value={form.enquiry_date}
                onChange={handleChange}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="voucher_used"
                  checked={form.voucher_used}
                  onChange={handleChange}
                />
                Mediation voucher used
              </label>
            </div>
          </div>

          <hr className="my-2" />
          <h3 className="font-medium">Party 1 Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Name *</label>
              <input
                type="text"
                name="party1_name"
                value={form.party1_name}
                onChange={handleChange}
                required
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="font-medium">Email</label>
              <input
                type="email"
                name="party1_email"
                value={form.party1_email}
                onChange={handleChange}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="font-medium">Phone</label>
              <input
                type="text"
                name="party1_phone"
                value={form.party1_phone}
                onChange={handleChange}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>
          </div>

          <hr className="my-2" />
          <h3 className="font-medium">Party 2 Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Name</label>
              <input
                type="text"
                name="party2_name"
                value={form.party2_name}
                onChange={handleChange}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="font-medium">Email</label>
              <input
                type="email"
                name="party2_email"
                value={form.party2_email}
                onChange={handleChange}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="font-medium">Phone</label>
              <input
                type="text"
                name="party2_phone"
                value={form.party2_phone}
                onChange={handleChange}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>
          </div>

          <div>
            <label className="font-medium">Internal Notes</label>
            <textarea
              name="internal_notes"
              value={form.internal_notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full border rounded-md p-2"
              placeholder="Any internal notes about this case..."
            />
          </div>

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Create Case"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
