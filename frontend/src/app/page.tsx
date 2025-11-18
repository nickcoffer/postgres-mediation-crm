"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCases, ensureLoggedIn } from "./lib/api";
import NewCaseModal from "../components/NewCaseModal";
import ExportData from "../components/ExportData";

export const dynamic = 'force-dynamic';

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toUpperCase();
  const base = "badge";
  const map: Record<string, string> = {
    OPEN: "badge-open",
    MIAM: "badge-enquiry",
    ENQUIRY: "badge-enquiry",
    PAUSED: "badge-paused",
    CLOSED: "badge-closed",
  };
  return <span className={base + " " + (map[s] || "")}>{status}</span>;
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const [cases, setCases] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const urlStatus = searchParams.get("status");
    if (urlStatus === "ACTIVE") setStatusFilter("ACTIVE");
    else if (urlStatus === "PAYMENTS") setStatusFilter("PAYMENTS");
    else if (urlStatus === "ENQUIRY") setStatusFilter("ENQUIRY");
  }, [searchParams]);

  function handleCreated() {
    setReloadFlag((f) => !f);
  }

  useEffect(() => {
    async function loadCases() {
      const token = await ensureLoggedIn();
      if (!token) {
        setError("Failed to initialize. Please restart the app.");
        return;
      }
      setError(null);
      getCases(token)
        .then(setCases)
        .catch((e) => setError(e?.message || "Failed to fetch cases"));
    }
    loadCases();
  }, [reloadFlag]);

  if (error)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Cases</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            New Case
          </button>
        </div>

        <div className="card">
          <div className="card-body text-red-700">{error}</div>
        </div>

        <NewCaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreated={handleCreated}
        />
      </div>
    );

  // While we have not yet loaded cases from the API
  if (!cases)
    return (
      <div className="card">
        <div className="card-body">Loading...</div>
      </div>
    );

  // ✅ Safety: always treat cases as an array, even if something weird comes back
  const safeCases = Array.isArray(cases) ? cases : [];

  const filteredCases = safeCases.filter((c) => {
    if (statusFilter === "ACTIVE") {
      if (c.status !== "OPEN" && c.status !== "MIAM") return false;
    } else if (statusFilter === "PAYMENTS") {
      const outstanding =
        parseFloat(c.amount_owed || 0) - parseFloat(c.amount_paid || 0);
      if (outstanding <= 0) return false;
    } else if (statusFilter !== "ALL" && c.status !== statusFilter) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        c.reference,
        c.title,
        c.party1_name,
        c.party2_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-lg text-[--text-primary]">Cases</h1>
          <p className="text-muted mt-1">
            Showing {filteredCases.length}{" "}
            {filteredCases.length === 1 ? "case" : "cases"}
            {(searchQuery || statusFilter !== "ALL") &&
              ` (filtered from ${safeCases.length} total)`}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          + New Case
        </button>
      </div>

      <NewCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />

      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[--text-tertiary]">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search by reference, title, or party name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active (Open + MIAM)</option>
                <option value="PAYMENTS">Outstanding Payments</option>
                <option value="ENQUIRY">Enquiry</option>
                <option value="MIAM">MIAM</option>
                <option value="OPEN">Open</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-stone-50">
              <tr>
                <th className="th">Reference</th>
                <th className="th">Parties</th>
                <th className="th">Status</th>
                <th className="th">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="td text-center text-muted py-12">
                    <div className="text-4xl mb-2">📂</div>
                    <div>No cases found</div>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-[--primary] text-xs mt-2 underline"
                      >
                        Clear search
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const fallbackTitle =
                    c.title ||
                    [c.party1_name, c.party2_name]
                      .filter(Boolean)
                      .join(" & ") ||
                    "Untitled";
                  return (
                    <tr key={c.id} className="tr">
                      <td className="td">
                        <Link
                          className="font-medium text-[--primary] hover:text-[--primary-hover] hover:underline"
                          href={`/cases/${c.id}`}
                        >
                          {c.reference}
                        </Link>
                      </td>
                      <td className="td">
                        <div className="font-medium">{fallbackTitle}</div>
                        {c.title && (c.party1_name || c.party2_name) && (
                          <div className="text-xs text-muted mt-0.5">
                            {[c.party1_name, c.party2_name]
                              .filter(Boolean)
                              .join(" & ")}
                          </div>
                        )}
                      </td>
                      <td className="td">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="td text-muted">
                        {c.updated_at
                          ? new Date(c.updated_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExportData />
    </div>
  );
}
