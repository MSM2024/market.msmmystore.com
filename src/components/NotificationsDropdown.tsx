'use client';

import { Bell } from "lucide-react";

interface Notification {
  id: string;
  text: string;
  time: string;
}

interface NotificationsDropdownProps {
  notifications: Notification[];
  showBadge: boolean;
  onToggle: () => void;
  isOpen: boolean;
}

export default function NotificationsDropdown({
  notifications,
  showBadge,
  onToggle,
  isOpen,
}: NotificationsDropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="relative cursor-pointer text-slate-400 hover:text-white transition-colors"
      >
        <Bell size={20} />
        {showBadge && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[#050816] border border-slate-800 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500 text-sm">
              No notifications
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="px-4 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-900/50 transition-colors"
              >
                <p className="text-sm text-slate-300">{n.text}</p>
                <p className="text-xs text-slate-500 mt-1">{n.time}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
