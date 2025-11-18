"use client";
import { useState } from "react";
import { API_BASE } from "../app/lib/api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  caseId: number | string;
  sessionType: "MIAM" | "JOINT";
  party1Name?: string;
  party2Name?: string;
};

export default function QuickBookModal({
  isOpen, onClose, onCreated, caseId, sessionType, party1Name, party2Name
}: Props) {
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sessionTime, setSessionTime] = useState<string>("09:00");
  const [duration, setDuration] = useState<number>(1);
  const [participant, setParticipant] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justBooked, setJustBooked] = useState<any | null>(null);

  function createGoogleCalendarLink(session: any) {
    const start = new Date(sessionDate + "T" + sessionTime + ":00");
    const end = new Date(start.getTime() + Number(duration) * 60 * 60 * 1000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const title = sessionType === "MIAM" 
      ? `MIAM with ${participant}` 
      : `Mediation Session`;
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${formatDate(start)}/${formatDate(end)}`,
      details: sessionType === "MIAM" ? `MIAM session with ${participant}` : 'Joint mediation session',
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");

      const startLocal = new Date(sessionDate + "T" + sessionTime + ":00");
      const endLocal = new Date(startLocal.getTime() + Number(duration) * 60 * 60 * 1000);

      const payload = {
        case: caseId,
        case_id: caseId,
        session_type: sessionType,
        start: startLocal.toISOString(),
        end: endLocal.toISOString(),
        notes: sessionType === "MIAM" ? `Booked - Participant: ${participant}` : ""
      };

      const res = await fetch(API_BASE + "/api/sessions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let msg = "Failed to book session";
        try { const data = await res.json(); msg += ": " + JSON.stringify(data); } catch {}
        throw new Error(msg);
      }

      const sessionData = await res.json();
      setJustBooked(sessionData);
      onCreated();
      
      // Don't close immediately - show the calendar option
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  // Success screen after booking
  if (justBooked) {
    const calendarLink = createGoogleCalendarLink(justBooked);
    
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">Session Booked!</h2>
            <p className="text-gray-600 mb-6">
              {sessionType === "MIAM" ? "MIAM" : "Session"} scheduled for {sessionDate} at {sessionTime}
            </p>
            
            <div className="space-y-3">
              <a
                href={calendarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium"
              >
                📅 Add to Google Calendar
              </a>
              
              <button
                onClick={() => {
                  setJustBooked(null);
                  onClose();
                  // Reset form
                  setSessionDate(new Date().toISOString().slice(0, 10));
                  setSessionTime("09:00");
                  setDuration(1);
                  setParticipant("");
                }}
                className="block w-full px-4 py-3 rounded-md border hover:bg-gray-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Booking form
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          {sessionType === "MIAM" ? "Book MIAM" : "Book Joint Session"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">Date *</label>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="mt-1 w-full border rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="font-medium">Time *</label>
              <input
                type="time"
                value={sessionTime}
                onChange={e => setSessionTime(e.target.value)}
                className="mt-1 w-full border rounded-md p-2"
                required
              />
            </div>
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

          {sessionType === "MIAM" && (
            <div>
              <label className="font-medium">Participant *</label>
              <select
                value={participant}
                onChange={e => setParticipant(e.target.value)}
                className="mt-1 w-full border rounded-md p-2"
                required
              >
                <option value="">Select participant...</option>
                {party1Name && <option value={party1Name}>{party1Name}</option>}
                {party2Name && <option value={party2Name}>{party2Name}</option>}
              </select>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
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
              {loading ? "Booking..." : "Book Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
