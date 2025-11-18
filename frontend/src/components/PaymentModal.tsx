"use client";
import { useState } from "react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: {
    id: string;
    reference: string;
    amount_owed: string;
    amount_paid: string;
    payment_notes: string;
  };
  onUpdate: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  caseData,
  onUpdate,
}: PaymentModalProps) {
  const [amountOwed, setAmountOwed] = useState(caseData.amount_owed || "0.00");
  const [amountPaid, setAmountPaid] = useState(caseData.amount_paid || "0.00");
  const [paymentNotes, setPaymentNotes] = useState(caseData.payment_notes || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const outstanding = (
    parseFloat(amountOwed || "0") - parseFloat(amountPaid || "0")
  ).toFixed(2);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"}/api/cases/${caseData.id}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount_owed: parseFloat(amountOwed || "0"),
            amount_paid: parseFloat(amountPaid || "0"),
            payment_notes: paymentNotes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update payment");
      }

      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="card w-full max-w-lg mx-4">
        <div className="card-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="heading-md">Payment Tracking</h2>
              <p className="text-sm text-muted mt-1">{caseData.reference}</p>
            </div>
            <button
              onClick={onClose}
              className="text-[--text-tertiary] hover:text-[--text-primary]"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="alert alert-warning mb-4">
              <div className="text-sm">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Owed */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount Owed (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountOwed}
                onChange={(e) => setAmountOwed(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted mt-1">
                Total amount due for this case
              </p>
            </div>

            {/* Amount Paid */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Amount Paid (£)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={amountOwed}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted mt-1">
                Amount received so far
              </p>
            </div>

            {/* Outstanding Amount Display */}
            <div className="card bg-stone-50">
              <div className="card-compact">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted">
                    Outstanding Balance
                  </span>
                  <span className={`text-xl font-bold ${
                    parseFloat(outstanding) > 0 
                      ? "text-orange-600" 
                      : "text-green-600"
                  }`}>
                    £{outstanding}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Notes */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Payment Notes
              </label>
              <textarea
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Track payment dates, methods, or other details..."
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}