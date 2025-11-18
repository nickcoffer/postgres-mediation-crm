"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MiniCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventDates, setEventDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEvents();
  }, []);

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

      const dates = new Set<string>();
      sessions.forEach((s: any) => {
        const date = new Date(s.start).toDateString();
        dates.add(date);
      });
      appointments.forEach((a: any) => {
        const date = new Date(a.start).toDateString();
        dates.add(date);
      });

      setEventDates(dates);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
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

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-7"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = date.toDateString();
    const hasEvent = eventDates.has(dateString);
    const isToday = dateString === new Date().toDateString();

    days.push(
      <div
        key={day}
        className={`h-7 flex items-center justify-center text-xs rounded relative
          ${isToday ? "bg-[--primary] text-white font-bold" : "text-[--text-primary]"}
          ${hasEvent && !isToday ? "font-semibold" : ""}
        `}
      >
        {day}
        {hasEvent && !isToday && (
          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[--primary] rounded-full"></div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[--bg-secondary] rounded-lg p-3 border border-[--border]">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-[--text-primary]">
          {monthNames[month]} {year}
        </div>
        <Link
          href="/calendar"
          className="text-xs text-[--primary] hover:underline"
        >
          View Full
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <div key={i} className="h-6 flex items-center justify-center text-[10px] font-medium text-[--text-tertiary]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}
