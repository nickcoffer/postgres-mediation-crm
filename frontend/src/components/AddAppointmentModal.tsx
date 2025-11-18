"use client";
import { useState, useEffect } from "react";

interface AddAppointmentModalProps {
  defaultDate: Date;
  onClose: () => void;
  onSuccess: (appointment: any) => void;
}

export default function AddAppointmentModal({ defaultDate, onClose, onSuccess }: AddAppointmentModalProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start: "",
    end: "",
    location: "",
    case: "",
  });

  useEffect(() => {
    fetchCases();
    
    // Set default start and end times
    const startDate = new Date(defaultDate);
    const endDate = new Date(defaultDate);
    endDate.setHours(endDate.getHours() + 1);
    
    setFormData(prev => ({
      ...prev,
      start: formatDateTimeLocal(startDate),
      end: formatDateTimeLocal(endDate),
    }));
  }, [defaultDate]);

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const fetchCases = async () => {
    try {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        console.error("No access token found");
        setError("Please log in again");
        setLoading(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cases/`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCases(data);
      } else if (response.status === 401) {
        setError("Session expired. Please refresh the page and login again.");
      } else {
        setError(`Failed to load cases (error ${response.status})`);
      }
    } catch (error) {
      console.error("Error fetching cases:", error);
      setError("Network error loading cases");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      alert("Please add a title for your appointment");
      return;
    }

    if (!formData.start || !formData.end) {
      alert("Please select start and end times");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Not authenticated. Please refresh the page.");
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        start: new Date(formData.start).toISOString(),
        end: new Date(formData.end).toISOString(),
        location: formData.location,
        case: formData.case || null,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const appointment = await response.json();
        onSuccess(appointment);
      } else {
        const errorData = await response.text();
        console.error("Failed to create appointment:", errorData);
        alert(`Failed to create appointment`);
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Error creating appointment");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-[--text-primary]">New Appointment</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[--text-primary] mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary]"
              placeholder="Meeting title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[--text-primary] mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary] min-h-[80px]"
              placeholder="Add details about this appointment"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[--text-primary] mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                className="w-full px-3 py-2 border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[--text-primary] mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={formData.end}
                onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                className="w-full px-3 py-2 border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[--text-primary] mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary]"
              placeholder="Meeting location or video link"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[--text-primary] mb-1">
              Link to Case (Optional)
            </label>
            {loading ? (
              <div className="text-sm text-[--text-secondary] py-2">Loading cases...</div>
            ) : error ? (
              <div className="text-sm text-red-600 py-2 bg-red-50 p-3 rounded border border-red-200">
                {error}
              </div>
            ) : (
              <>
                <select
                  value={formData.case}
                  onChange={(e) => setFormData({ ...formData, case: e.target.value })}
                  className="w-full px-3 py-2 border border-[--border] rounded-lg focus:outline-none focus:ring-2 focus:ring-[--primary]"
                >
                  <option value="">-- No case linked --</option>
                  {cases.length === 0 ? (
                    <option value="" disabled>No cases available</option>
                  ) : (
                    cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.reference} - {c.title}
                      </option>
                    ))
                  )}
                </select>
                {cases.length > 0 && (
                  <div className="text-xs text-green-600 mt-1">
                    ✓ {cases.length} case(s) loaded
                  </div>
                )}
                {cases.length === 0 && (
                  <div className="text-xs text-[--text-tertiary] mt-1">
                    Create a case first to link it to an appointment
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[--text-primary] border border-[--border] rounded-lg hover:bg-[--bg-secondary]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[--primary] rounded-lg hover:bg-[--primary-dark]"
            >
              Create Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
