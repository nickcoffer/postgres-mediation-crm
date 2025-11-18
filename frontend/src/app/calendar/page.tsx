"use client";
import { useState, useEffect } from "react";
import AddAppointmentModal from "../../components/AddAppointmentModal";
import GoogleCalendarPopup from "../../components/GoogleCalendarPopup";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "session" | "appointment";
  caseReference?: string;
  caseTitle?: string;
  location?: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [newAppointment, setNewAppointment] = useState<any>(null);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const [sessionsRes, appointmentsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sessions/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const sessions = await sessionsRes.json();
      const appointments = await appointmentsRes.json();

      const allEvents: CalendarEvent[] = [
        ...sessions.map((s: any) => ({
          id: s.id,
          title: `${s.session_type === "miam" ? "MIAM" : "Session"} - Case ${s.case}`,
          start: s.start,
          end: s.end,
          type: "session" as const,
        })),
        ...appointments.map((a: any) => ({
          id: a.id,
          title: a.title,
          start: a.start,
          end: a.end,
          type: "appointment" as const,
          caseReference: a.case_reference,
          caseTitle: a.case_title,
          location: a.location,
        })),
      ];

      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const handleAppointmentCreated = (appointment: any) => {
    setNewAppointment(appointment);
    setShowAddModal(false);
    setShowGooglePopup(true);
    fetchEvents();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (day: number) => {
    const date = new Date(year, month, day);
    const dateString = date.toDateString();
    
    return events.filter((event) => {
      const eventDate = new Date(event.start).toDateString();
      return eventDate === dateString;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  };

  const handleDateClick = (day: number) => {
    const date = new Date(year, month, day, 9, 0); // Default to 9 AM
    setSelectedDate(date);
    setShowAddModal(true);
  };

  const days = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(
      <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50 border border-gray-200"></div>
    );
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = date.toDateString();
    const isToday = dateString === new Date().toDateString();
    const dayEvents = getEventsForDate(day);

    days.push(
      <div
        key={day}
        className={`min-h-[120px] border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors
          ${isToday ? "bg-blue-50" : "bg-white"}
        `}
        onClick={() => handleDateClick(day)}
      >
        <div className={`text-sm font-semibold mb-1 ${isToday ? "text-[--primary]" : "text-gray-700"}`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayEvents.slice(0, 3).map((event) => (
            <div
              key={event.id}
              className={`text-xs p-1 rounded truncate
                ${event.type === "session" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {new Date(event.start).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              {event.title}
            </div>
          ))}
          {dayEvents.length > 3 && (
            <div className="text-xs text-gray-500 pl-1">
              +{dayEvents.length - 3} more
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[--text-primary]">Calendar</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={today}
            className="px-4 py-2 text-sm font-medium text-[--text-primary] border border-[--border] rounded-lg hover:bg-[--bg-secondary]"
          >
            Today
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 text-[--text-primary] hover:bg-[--bg-secondary] rounded-lg"
            >
              ←
            </button>
            <div className="text-lg font-semibold text-[--text-primary] min-w-[200px] text-center">
              {monthNames[month]} {year}
            </div>
            <button
              onClick={nextMonth}
              className="p-2 text-[--text-primary] hover:bg-[--bg-secondary] rounded-lg"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[--border] overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
          <span className="text-gray-600">Sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
          <span className="text-gray-600">Appointments</span>
        </div>
      </div>

      {showAddModal && selectedDate && (
        <AddAppointmentModal
          defaultDate={selectedDate}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAppointmentCreated}
        />
      )}

      {showGooglePopup && newAppointment && (
        <GoogleCalendarPopup
          appointment={newAppointment}
          onClose={() => setShowGooglePopup(false)}
        />
      )}
    </div>
  );
}
