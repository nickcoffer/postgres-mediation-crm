"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCase, API_BASE } from "../../lib/api";
import { usePathname } from "next/navigation";
import SessionModal from "../../../components/SessionModal";
import EditCaseModal from "../../../components/EditCaseModal";
import MIAMSummaryDisplay from "../../../components/MIAMSummaryDisplay";
import QuickBookModal from "../../../components/QuickBookModal";
import PaymentModal from "../../../components/PaymentModal";
import TodoList from "../../../components/TodoList";

export default function CaseDetail() {
  const router = useRouter();
  const [item, setItem] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // modal state + refresh trigger
  const [isMiamOpen, setIsMiamOpen] = useState(false);
  const [isJointOpen, setIsJointOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQuickBookMiamOpen, setIsQuickBookMiamOpen] = useState(false);
  const [isQuickBookJointOpen, setIsQuickBookJointOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState<any | null>(null);
  const [reloadSessions, setReloadSessions] = useState(false);
  
  // Track which sessions are expanded
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const pathname = usePathname();
  const pathId = pathname.split("/").pop();

  function refetch() {
    const t = localStorage.getItem("token");
    if (!t) {
      setError("Please login (top right)");
      return;
    }
    if (pathId) {
      getCase(pathId, t).then(setItem).catch((e) => setError(e.message));
    }
  }

  function handleSessionCreated() {
    setReloadSessions((v) => !v); // trigger a refetch
  }

  function toggleSession(sessionId: string) {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  }

  async function handleDeleteCase() {
    setDeleting(true);
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${API_BASE}/api/cases/${safeCaseId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Success - redirect to cases list
        router.push('/');
      } else {
        setError('Failed to delete case');
        setDeleting(false);
      }
    } catch (err) {
      setError('Failed to delete case');
      setDeleting(false);
    }
  }

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId, reloadSessions]);

  if (error)
    return (
      <div className="card">
        <div className="card-body">{error}</div>
      </div>
    );

  if (!item)
    return (
      <div className="card">
        <div className="card-body">Loading…</div>
      </div>
    );

  // Use the case ID from the API item, or fall back to the URL path
  const safeCaseId = item?.id || pathId || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{item.reference}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
          >
            Edit Case
          </button>
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Delete Case
          </button>
          <span className="badge">{item.status}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Case card */}
        <div className="card">
          <div className="card-body space-y-2">
            <h2 className="font-semibold">Case</h2>
            <p><b>Title:</b> {item.title || "Untitled"}</p>
            <p><b>Notes:</b> {item.internal_notes || "—"}</p>
            <p className="text-xs text-gray-500"><b>Case ID:</b> {String(safeCaseId)}</p>
          </div>
        </div>

        {/* Parties card */}
        <div className="card">
          <div className="card-body space-y-2">
            <h2 className="font-semibold">Parties</h2>
            <ul className="list-disc pl-5">
              {(item.party1_name || item.party1_email || item.party1_phone) && (
                <li>
                  <b>Party 1:</b> {item.party1_name || "—"}
                  {item.party1_email ? ` (${item.party1_email})` : ""}
                  {item.party1_phone ? `, ${item.party1_phone}` : ""}
                </li>
              )}
              {(item.party2_name || item.party2_email || item.party2_phone) && (
                <li>
                  <b>Party 2:</b> {item.party2_name || "—"}
                  {item.party2_email ? ` (${item.party2_email})` : ""}
                  {item.party2_phone ? `, ${item.party2_phone}` : ""}
                </li>
              )}
              {!item.party1_name && !item.party1_email && !item.party1_phone &&
               !item.party2_name && !item.party2_email && !item.party2_phone && <li>—</li>}
            </ul>
          </div>
        </div>

        {/* Payment card */}
        <div className="card md:col-span-2">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Payment</h2>
              <button
                onClick={() => setIsPaymentOpen(true)}
                className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                💷 Manage Payment
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Amount Owed</div>
                <div className="text-2xl font-bold">£{parseFloat(item.amount_owed || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Amount Paid</div>
                <div className="text-2xl font-bold text-green-600">£{parseFloat(item.amount_paid || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Outstanding</div>
                <div className={`text-2xl font-bold ${
                  parseFloat(item.amount_owed || 0) - parseFloat(item.amount_paid || 0) > 0 
                    ? "text-orange-600" 
                    : "text-gray-400"
                }`}>
                  £{(parseFloat(item.amount_owed || 0) - parseFloat(item.amount_paid || 0)).toFixed(2)}
                </div>
              </div>
            </div>
            {item.payment_notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                <b>Notes:</b> {item.payment_notes}
              </div>
            )}
          </div>
        </div>

        {/* To-dos card */}
        <div className="card md:col-span-2">
          <div className="card-body">
            <TodoList caseId={safeCaseId} onUpdate={() => setReloadSessions(v => !v)} />
          </div>
        </div>

        {/* Sessions card */}
        <div className="card md:col-span-2">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Sessions</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsQuickBookMiamOpen(true)}
                  className="px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                >
                  📅 Book MIAM
                </button>
                <button
                  onClick={() => setIsQuickBookJointOpen(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  📅 Book Joint Session
                </button>
              </div>
            </div>
            <ul className="space-y-2">
              {item.sessions?.length ? (
                item.sessions.map((s: any) => {
                  const date =
                    s.session_date ||
                    (s.start ? new Date(s.start).toISOString().slice(0, 10) : "");
                  const time = s.start ? new Date(s.start).toLocaleTimeString('en-GB', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : "";
                  const duration =
                    s.duration_hours ??
                    (s.start && s.end
                      ? (new Date(s.end).getTime() - new Date(s.start).getTime()) / (1000 * 60 * 60)
                      : null);

                  const isMIAM = s.session_type?.toUpperCase() === "MIAM";
                  const isExpanded = expandedSessions.has(s.id);
                  
                  // Check if MIAM has been filled out (has JSON data in notes)
                  const hasData = s.notes && s.notes.includes("MIAM Summary") && s.notes.includes("{");

                  return (
                    <li key={s.id} className="border rounded-lg bg-white overflow-hidden">
                      {/* Collapsed Header - Always visible, clickable */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                        onClick={() => toggleSession(s.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-lg">{s.session_type}</div>
                            {isMIAM && !hasData && (
                              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                Not filled out
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {date || "—"}
                            {time ? ` at ${time}` : ""}
                            {duration ? ` · ${duration}h` : ""}
                          </div>
                        </div>
                        <div className="text-gray-400">
                          {isExpanded ? "▼" : "▶"}
                        </div>
                      </div>
                      
                      {/* Expanded Content - Only shown when clicked */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
                          <div className="flex justify-end mb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSessionToComplete(s);
                                if (isMIAM) {
                                  setIsMiamOpen(true);
                                } else {
                                  setIsJointOpen(true);
                                }
                              }}
                              className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            >
                              {hasData ? "✏️ Edit" : "📝 Fill Out"} {isMIAM ? "MIAM" : "Session"} Form
                            </button>
                          </div>
                          
                          {hasData ? (
                            isMIAM ? (
                              <MIAMSummaryDisplay 
                                sessionData={s}
                                caseReference={item.reference}
                                caseTitle={item.title}
                              />
                            ) : (
                              s.notes && (
                                <div className="text-sm text-gray-700 bg-white p-3 rounded">
                                  {s.notes}
                                </div>
                              )
                            )
                          ) : (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              No data yet - click "Fill Out Form" to add details
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="py-2 text-sm text-gray-500">No sessions yet.</li>
              )}
            </ul>
          </div>

          {/* Modals */}
          <EditCaseModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onUpdated={() => {
              setReloadSessions(v => !v);
              setIsEditOpen(false);
            }}
            caseData={item}
          />
          <PaymentModal
            isOpen={isPaymentOpen}
            onClose={() => setIsPaymentOpen(false)}
            caseData={item}
            onUpdate={() => {
              setReloadSessions(v => !v);
              setIsPaymentOpen(false);
            }}
          />
          <QuickBookModal
            isOpen={isQuickBookMiamOpen}
            onClose={() => setIsQuickBookMiamOpen(false)}
            onCreated={handleSessionCreated}
            caseId={safeCaseId}
            sessionType="MIAM"
            party1Name={item.party1_name}
            party2Name={item.party2_name}
          />
          <QuickBookModal
            isOpen={isQuickBookJointOpen}
            onClose={() => setIsQuickBookJointOpen(false)}
            onCreated={handleSessionCreated}
            caseId={safeCaseId}
            sessionType="JOINT"
            party1Name={item.party1_name}
            party2Name={item.party2_name}
          />
          <SessionModal
            isOpen={isMiamOpen}
            onClose={() => {
              setIsMiamOpen(false);
              setSessionToComplete(null);
            }}
            onCreated={handleSessionCreated}
            caseId={safeCaseId}
            sessionType="MIAM"
            party1Name={item.party1_name}
            party2Name={item.party2_name}
            existingSession={sessionToComplete}
          />
          <SessionModal
            isOpen={isJointOpen}
            onClose={() => {
              setIsJointOpen(false);
              setSessionToComplete(null);
            }}
            onCreated={handleSessionCreated}
            caseId={safeCaseId}
            sessionType="JOINT"
            party1Name={item.party1_name}
            party2Name={item.party2_name}
            existingSession={sessionToComplete}
          />

          {/* Delete Confirmation Modal */}
          {isDeleteConfirmOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="card w-full max-w-md mx-4">
                <div className="card-body">
                  <h2 className="heading-md mb-4">Delete Case?</h2>
                  <p className="text-sm text-muted mb-6">
                    Are you sure you want to delete case <strong>{item.reference}</strong>?
                    <br /><br />
                    This will permanently delete:
                    <br />• All case information
                    <br />• All sessions and MIAM records
                    <br />• All payment records
                    <br /><br />
                    <strong className="text-red-600">This action cannot be undone.</strong>
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsDeleteConfirmOpen(false)}
                      className="btn flex-1"
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        setIsDeleteConfirmOpen(false);
                        handleDeleteCase();
                      }}
                      className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium"
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Delete Forever'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}