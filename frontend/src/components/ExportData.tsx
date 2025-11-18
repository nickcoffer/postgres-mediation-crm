"use client";
import { useState } from "react";
import { API_BASE } from "../app/lib/api";

export default function ExportData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportAsJSON() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/api/cases/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch data");
      const cases = await res.json();

      // Create backup object
      const backup = {
        exported_at: new Date().toISOString(),
        version: "1.0",
        total_cases: cases.length,
        cases: cases,
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mediation-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Exported ${cases.length} cases successfully!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function exportAsCSV() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");

      const res = await fetch(`${API_BASE}/api/cases/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch data");
      const cases = await res.json();

      // CSV headers
      const headers = [
        "Reference",
        "Title",
        "Status",
        "Party 1 Name",
        "Party 1 Email",
        "Party 1 Phone",
        "Party 2 Name",
        "Party 2 Email",
        "Party 2 Phone",
        "Enquiry Date",
        "Voucher Used",
        "Internal Notes",
        "Created",
        "Updated",
        "Total Sessions",
      ];

      // Build CSV rows
      const rows = cases.map((c: any) => {
        return [
          c.reference || "",
          c.title || "",
          c.status || "",
          c.party1_name || "",
          c.party1_email || "",
          c.party1_phone || "",
          c.party2_name || "",
          c.party2_email || "",
          c.party2_phone || "",
          c.enquiry_date || "",
          c.voucher_used ? "Yes" : "No",
          (c.internal_notes || "").replace(/"/g, '""'), // Escape quotes
          c.created_at ? new Date(c.created_at).toLocaleString() : "",
          c.updated_at ? new Date(c.updated_at).toLocaleString() : "",
          c.sessions?.length || 0,
        ].map((field) => `"${field}"`).join(",");
      });

      // Combine into CSV
      const csv = [headers.join(","), ...rows].join("\n");

      // Download as CSV
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mediation-cases-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Exported ${cases.length} cases to spreadsheet successfully!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-body space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Export & Backup</h2>
          <p className="text-sm text-gray-600 mb-4">
            Download your case data for backup or viewing in a spreadsheet.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">📦 Full Backup (JSON)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Complete backup including all case details and sessions. Use this for restoring data.
            </p>
            <button
              onClick={exportAsJSON}
              disabled={loading}
              className="w-full px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Exporting..." : "Export as JSON"}
            </button>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-2">📊 Spreadsheet (CSV)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Export cases to a spreadsheet for viewing in Excel or Google Sheets.
            </p>
            <button
              onClick={exportAsCSV}
              disabled={loading}
              className="w-full px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 disabled:bg-gray-400"
            >
              {loading ? "Exporting..." : "Export as CSV"}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-3">
          <p><strong>💡 Tip:</strong> Export your data regularly to keep a local backup.</p>
          <p className="mt-1"><strong>JSON backup:</strong> Can be re-imported if needed (coming soon)</p>
          <p className="mt-1"><strong>CSV export:</strong> Open in any spreadsheet app, great for records</p>
        </div>
      </div>
    </div>
  );
}
