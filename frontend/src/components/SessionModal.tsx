"use client";
import { useState, useMemo, useEffect } from "react";
import { API_BASE } from "../app/lib/api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  caseId: number | string;
  sessionType: "MIAM" | "JOINT";
  party1Name?: string;
  party2Name?: string;
  existingSession?: any; // For editing an existing incomplete session
};

type Child = { name: string; dob: string };

function yearsFromDob(dob: string, onDate: string): string {
  if (!dob || !onDate) return "";
  const d1 = new Date(dob);
  const d2 = new Date(onDate);
  let years = d2.getFullYear() - d1.getFullYear();
  const m = d2.getMonth() - d1.getMonth();
  if (m < 0 || (m === 0 && d2.getDate() < d1.getDate())) years--;
  return years >= 0 ? String(years) : "";
}

function getCaseIdFromUrl(): string | null {
  try {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("cases");
    return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : null;
  } catch {
    return null;
  }
}

export default function SessionModal({
  isOpen, onClose, onCreated, caseId, sessionType, party1Name, party2Name, existingSession
}: Props) {
  const isEditing = !!existingSession;
  
  // Common
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sessionTime, setSessionTime] = useState<string>("09:00");
  const [duration, setDuration] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [generalNotes, setGeneralNotes] = useState<string>("");
  
  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  // MIAM-only
  const [participant, setParticipant] = useState<string>(party1Name || "");
  const [participantDob, setParticipantDob] = useState<string>("");
  const participantAge = useMemo(
    () => yearsFromDob(participantDob, sessionDate), [participantDob, sessionDate]
  );

  const [relHistory, setRelHistory] = useState({
    married: false, separated: false, conditional_order: false, final_order: false,
  });
  const [keyDates, setKeyDates] = useState({
    marriage_date: "", separation_date: "", divorce_date: "",
  });

  const [children, setChildren] = useState<Child[]>([{ name: "", dob: "" }]);
  const addChild = () => setChildren(prev => [...prev, { name: "", dob: "" }]);
  const removeChild = (idx: number) => setChildren(prev => prev.filter((_, i) => i !== idx));

  const [childWishes, setChildWishes] = useState("");
  const [financialWishes, setFinancialWishes] = useState("");

  const [screenedFor, setScreenedFor] = useState({
    child_protection: false, safety_in_mediation: false, mental_health: false, disability: false, emotional_readiness: false,
  });

  const [signpostingFor, setSignpostingFor] = useState({
    child_maintenance: false, welfare_benefits: false, cab: false, debt_support: false, gp: false,
  });

  const [conclusion, setConclusion] = useState({
    emotionally_ready: false, suitable_for_mediation: false, children: false, finances: false, aim: false, contact_p2: false, online: false, shared_space: false, separate_space: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form if editing an existing session
  useEffect(() => {
    if (existingSession && isOpen) {
      // Set date and time from existing session
      if (existingSession.start) {
        const startDate = new Date(existingSession.start);
        setSessionDate(startDate.toISOString().slice(0, 10));
        setSessionTime(startDate.toTimeString().slice(0, 5));
      }
      
      // Calculate duration
      if (existingSession.start && existingSession.end) {
        const durationHours = (new Date(existingSession.end).getTime() - new Date(existingSession.start).getTime()) / (1000 * 60 * 60);
        setDuration(durationHours);
      }
      
      // Try to parse MIAM data from notes
      if (sessionType === "MIAM" && existingSession.notes) {
        try {
          const jsonMatch = existingSession.notes.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const miamData = JSON.parse(jsonMatch[0]);
            
            // Populate all fields from parsed data
            if (miamData.participant) setParticipant(miamData.participant);
            if (miamData.participant_dob) setParticipantDob(miamData.participant_dob);
            if (miamData.general_notes) setGeneralNotes(miamData.general_notes);
            if (miamData.relationship_history) setRelHistory(miamData.relationship_history);
            if (miamData.key_dates) setKeyDates(miamData.key_dates);
            if (miamData.children && miamData.children.length) setChildren(miamData.children);
            if (miamData.wishes) {
              setChildWishes(miamData.wishes.child_arrangements || "");
              setFinancialWishes(miamData.wishes.finances || "");
            }
            if (miamData.screened_for) setScreenedFor(miamData.screened_for);
            if (miamData.signposting_for) setSignpostingFor(miamData.signposting_for);
            if (miamData.conclusion) setConclusion(miamData.conclusion);
          } else {
            // No JSON data yet, try to extract participant from booked note
            const participantMatch = existingSession.notes.match(/Participant: (.+)/);
            if (participantMatch) {
              setParticipant(participantMatch[1]);
            }
          }
        } catch (e) {
          console.error("Failed to parse MIAM data:", e);
          // Still try to extract participant
          const participantMatch = existingSession.notes.match(/Participant: (.+)/);
          if (participantMatch) {
            setParticipant(participantMatch[1]);
          }
        }
      }
    }
  }, [existingSession, isOpen, sessionType]);

   function toggle<T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, key: keyof T) {
  setter((prev: T) => ({ ...prev, [key]: !prev[key] }) as T);
}

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");

      const propId = caseId;
      const urlId = getCaseIdFromUrl();
      const casePk = propId || urlId;

      if (!casePk) {
        throw new Error("Could not determine case id");
      }

      // Backend requires start/end; use the selected date and time
      const startLocal = new Date(sessionDate + "T" + sessionTime + ":00");
      const endLocal = new Date(startLocal.getTime() + Number(duration) * 60 * 60 * 1000);

      const payload: any = {
        case: casePk,
        case_id: casePk, // send both to satisfy serializer variations
        session_type: sessionType,
        start: startLocal.toISOString(),
        end: endLocal.toISOString(),
        notes: notes || ""
      };

      if (sessionType === "MIAM") {
        const miamSummary = {
          participant,
          participant_dob: participantDob,
          participant_age: participantAge,
          general_notes: generalNotes,
          relationship_history: relHistory,
          key_dates: keyDates,
          children: children.map(c => ({ ...c, age: yearsFromDob(c.dob, sessionDate) })),
          wishes: { child_arrangements: childWishes, finances: financialWishes },
          screened_for: screenedFor,
          signposting_for: signpostingFor,
          conclusion
        };
        const header = "MIAM Summary";
        const bodyJson = JSON.stringify(miamSummary, null, 2);
        payload.notes = header + "\n" + bodyJson + "\n\n" + payload.notes;
      }

      // Debug in browser console in case of issues
      console.log("Submitting session payload:", payload);

      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing 
        ? `${API_BASE}/api/sessions/${existingSession.id}/`
        : `${API_BASE}/api/sessions/`;

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let msg = "Failed to create session";
        try { const data = await res.json(); msg += ": " + JSON.stringify(data); } catch {}
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 overflow-y-auto max-h-[92vh]">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing 
            ? (sessionType === "MIAM" ? "Complete MIAM / Intake Summary" : "Complete Joint Session")
            : (sessionType === "MIAM" ? "Add MIAM / Intake Summary" : "Add Joint Session")}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="font-medium">Date *</label>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="font-medium">Time *</label>
              <input
                type="time"
                value={sessionTime}
                onChange={e => setSessionTime(e.target.value)}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>
            <div>
              <label className="font-medium">Duration (hours)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>
          </div>

          {sessionType === "MIAM" ? (
            <>
              {/* MIAM Details */}
              <div className="rounded-xl bg-gray-50 p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium">Participant *</label>
                    <select
                      value={participant}
                      onChange={e => setParticipant(e.target.value)}
                      className="mt-1 w-full border rounded-md p-2"
                    >
                      <option value="">Select…</option>
                      {party1Name && <option value={party1Name}>{party1Name}</option>}
                      {party2Name && <option value={party2Name}>{party2Name}</option>}
                    </select>
                  </div>
                  <div />
                  <div>
                    <label className="font-medium">Participant's Date of Birth</label>
                    <input
                      type="date"
                      value={participantDob}
                      onChange={e => setParticipantDob(e.target.value)}
                      className="mt-1 w-full border rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Age (as of MIAM date)</label>
                    <input
                      type="text"
                      readOnly
                      value={participantAge}
                      className="mt-1 w-full border rounded-md p-2 bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Relationship & Dates */}
              <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                <div className="grid md:grid-cols-4 gap-3">
                  {[
                    ["Married", "married"],
                    ["Separated", "separated"],
                    ["Conditional Order", "conditional_order"],
                    ["Final Order", "final_order"],
                  ].map(([label, key]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(relHistory as any)[key]}
                        onChange={() => toggle(setRelHistory, key as any)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="font-medium">Marriage Date</label>
                    <input
                      type="date"
                      value={keyDates.marriage_date}
                      onChange={e => setKeyDates(p => ({ ...p, marriage_date: e.target.value }))}
                      className="mt-1 w-full border rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Separation Date</label>
                    <input
                      type="date"
                      value={keyDates.separation_date}
                      onChange={e => setKeyDates(p => ({ ...p, separation_date: e.target.value }))}
                      className="mt-1 w-full border rounded-md p-2"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Divorce Date</label>
                    <input
                      type="date"
                      value={keyDates.divorce_date}
                      onChange={e => setKeyDates(p => ({ ...p, divorce_date: e.target.value }))}
                      className="mt-1 w-full border rounded-md p-2"
                    />
                  </div>
                </div>
              </div>

              {/* General Notes */}
              <div>
                <label className="font-medium">General Notes</label>
                <textarea
                  rows={4}
                  value={generalNotes}
                  onChange={e => setGeneralNotes(e.target.value)}
                  className="mt-1 w-full border rounded-md p-2"
                  placeholder="General notes about this MIAM session..."
                />
              </div>

              {/* Children */}
              <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Children</h3>
                  <button type="button" onClick={addChild} className="px-3 py-1.5 rounded-md border">
                    + Add Child
                  </button>
                </div>
                <div className="space-y-3">
                  {children.map((c, idx) => (
                    <div key={idx} className="grid md:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="font-medium">Name</label>
                        <input
                          type="text"
                          value={c.name}
                          onChange={e => {
                            const v = e.target.value;
                            setChildren(prev => {
                              const copy = [...prev];
                              copy[idx] = { ...copy[idx], name: v };
                              return copy;
                            });
                          }}
                          className="mt-1 w-full border rounded-md p-2"
                        />
                      </div>
                      <div>
                        <label className="font-medium">Date of Birth</label>
                        <input
                          type="date"
                          value={c.dob}
                          onChange={e => {
                            const v = e.target.value;
                            setChildren(prev => {
                              const copy = [...prev];
                              copy[idx] = { ...copy[idx], dob: v };
                              return copy;
                            });
                          }}
                          className="mt-1 w-full border rounded-md p-2"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <input
                          readOnly
                          value={yearsFromDob(c.dob, sessionDate)}
                          className="mt-1 w-full border rounded-md p-2 bg-gray-100"
                          placeholder="Age"
                        />
                        {children.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChild(idx)}
                            className="px-3 py-2 rounded-md border text-red-600"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Wishes */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium">Child Arrangement Wishes</label>
                  <textarea
                    rows={3}
                    value={childWishes}
                    onChange={e => setChildWishes(e.target.value)}
                    className="mt-1 w-full border rounded-md p-2"
                    placeholder="Participant's wishes regarding child arrangements..."
                  />
                </div>
                <div>
                  <label className="font-medium">Financial Wishes</label>
                  <textarea
                    rows={3}
                    value={financialWishes}
                    onChange={e => setFinancialWishes(e.target.value)}
                    className="mt-1 w-full border rounded-md p-2"
                    placeholder="Participant's wishes regarding finances..."
                  />
                </div>
              </div>

              {/* Screening & Signposting */}
              <div className="rounded-xl bg-gray-50 p-4 space-y-4">
                <h3 className="font-medium">Screening & Signposting</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    ["Child protection", "child_protection"],
                    ["Safety whilst in mediation", "safety_in_mediation"],
                    ["Mental health", "mental_health"],
                    ["Disability", "disability"],
                    ["Emotional readiness", "emotional_readiness"],
                  ].map(([label, key]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(screenedFor as any)[key]}
                        onChange={() => toggle(setScreenedFor, key as any)}
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div className="grid md:grid-cols-5 gap-3">
                  {[
                    ["Child Maintenance", "child_maintenance"],
                    ["Welfare benefits", "welfare_benefits"],
                    ["CAB", "cab"],
                    ["Debt support", "debt_support"],
                    ["GP", "gp"],
                  ].map(([label, key]) => (
                    <label key={key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={(signpostingFor as any)[key]}
                        onChange={() => toggle(setSignpostingFor, key as any)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Any other info */}
              <div>
                <label className="font-medium">Any Other Information</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="mt-1 w-full border rounded-md p-2"
                  placeholder="Additional notes..."
                />
              </div>
            </>
          ) : (
            // JOINT session notes
            <div>
              <label className="font-medium">Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mt-1 w-full border rounded-md p-2"
                placeholder="Session notes / outcomes..."
              />
            </div>
          )}

          {error && <p className="text-red-600">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              {/* Tiny helper so we can see what id we’re about to use */}
              Case id to submit: {String(caseId || getCaseIdFromUrl() || "unknown")}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                {loading ? "Saving…" : sessionType === "MIAM" ? "Save MIAM Summary" : "Create Session"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
