"use client";
import { useState, useEffect } from "react";
import { API_BASE } from "../lib/api";

export default function SettingsPage() {
  // Business Settings
  const [practiceName, setPracticeName] = useState("Family Mediation Practice");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  
  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load business settings from localStorage
    const savedPracticeName = localStorage.getItem("practiceName");
    const savedUserName = localStorage.getItem("userName");
    const savedUserEmail = localStorage.getItem("userEmail");
    
    if (savedPracticeName) setPracticeName(savedPracticeName);
    if (savedUserName) setUserName(savedUserName);
    if (savedUserEmail) setUserEmail(savedUserEmail);
  }, []);

  function handleBusinessSettingsSave(e: React.FormEvent) {
    e.preventDefault();
    
    // Save to localStorage
    localStorage.setItem("practiceName", practiceName);
    localStorage.setItem("userName", userName);
    localStorage.setItem("userEmail", userEmail);
    
    setMessage({ type: 'success', text: 'Business settings saved! Refresh the page to see changes.' });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'Password must be at least 4 characters' });
      return;
    }
    
    setSaving(true);
    const token = localStorage.getItem("token");
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
        }),
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.detail || 'Failed to change password. Check your current password.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="heading-lg text-[--text-primary]">Settings</h1>
        <p className="text-muted mt-1">Manage your business information and account</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-warning'}`}>
          <div className="text-sm">{message.text}</div>
        </div>
      )}

      {/* Business Settings */}
      <div className="card">
        <div className="card-body">
          <h2 className="heading-sm mb-4">Business Information</h2>
          <p className="text-sm text-muted mb-6">
            This information appears in your CRM and can be customized to your practice.
          </p>
          
          <form onSubmit={handleBusinessSettingsSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Practice/Business Name
              </label>
              <input
                type="text"
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                placeholder="e.g., Smith Family Mediation"
              />
              <p className="text-xs text-muted mt-1">
                This appears in the header of your CRM
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g., Sarah Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Your Email
              </label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="e.g., sarah@example.com"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Save Business Settings
            </button>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="card-body">
          <h2 className="heading-sm mb-4">Change Password</h2>
          <p className="text-sm text-muted mb-6">
            Update your login password for this CRM.
          </p>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={4}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* About */}
      <div className="card bg-stone-50">
        <div className="card-body">
          <h2 className="heading-sm mb-2">About Mediation Manager</h2>
          <p className="text-sm text-muted">
            Built by Nick Coffer at Way Forward Mediation<br />
            Questions? Contact: <a href="mailto:info@wayforwardmediation.co.uk" className="text-[--primary] hover:underline">info@wayforwardmediation.co.uk</a>
          </p>
        </div>
      </div>
    </div>
  );
}
