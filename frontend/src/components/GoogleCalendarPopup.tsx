"use client";

interface GoogleCalendarPopupProps {
  appointment: {
    title: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
  };
  onClose: () => void;
}

export default function GoogleCalendarPopup({ appointment, onClose }: GoogleCalendarPopupProps) {
  const addToGoogleCalendar = () => {
    const startDate = new Date(appointment.start);
    const endDate = new Date(appointment.end);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, "");
    };

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: appointment.title,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: appointment.description || "",
      location: appointment.location || "",
    });

    const url = `https://calendar.google.com/calendar/render?${params.toString()}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-[--text-primary]">
          Appointment Created! 🎉
        </h3>
        
        <p className="text-[--text-secondary] mb-6">
          Would you like to add this appointment to your Google Calendar?
        </p>

        <div className="bg-[--bg-secondary] rounded-lg p-4 mb-6 border border-[--border]">
          <h4 className="font-semibold text-[--text-primary] mb-2">{appointment.title}</h4>
          <div className="text-sm text-[--text-secondary] space-y-1">
            <div>
              📅 {new Date(appointment.start).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
            <div>
              🕐 {new Date(appointment.start).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })} - {new Date(appointment.end).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            {appointment.location && (
              <div>📍 {appointment.location}</div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[--text-primary] border border-[--border] rounded-lg hover:bg-[--bg-secondary]"
          >
            Skip
          </button>
          <button
            onClick={() => {
              addToGoogleCalendar();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[--primary] rounded-lg hover:bg-[--primary-dark]"
          >
            Add to Google Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
