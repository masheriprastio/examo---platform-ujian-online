import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { generateUUID } from '../lib/uuid';
import { AlertTriangle, CheckCircle, ShieldCheck, X as CloseIcon } from 'lucide-react';

interface Alert {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success';
  key?: string;
}

interface NotificationContextType {
  addAlert: (message: string, type?: 'info' | 'error' | 'success', key?: string) => void;
  clearSeenKeys: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [seenKeys, setSeenKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem('examo_seen_alerts');
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        setSeenKeys(new Set(arr));
      }
    } catch (err) {
      // ignore
    }
  }, []);

  const persistSeenKeys = (next: Set<string>) => {
    try {
      localStorage.setItem('examo_seen_alerts', JSON.stringify(Array.from(next)));
    } catch (err) {
      // ignore
    }
  };

  const addAlert = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info', key?: string) => {
    if (key && seenKeys.has(key)) return;

    const id = generateUUID();
    setAlerts(prev => [...prev, { id, message, type, key }]);

    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);

    if (key) {
      setSeenKeys((prev: Set<string>) => {
        const next = new Set(prev);
        next.add(key);
        persistSeenKeys(next);
        return next;
      });
    }
  }, [seenKeys]);

  const clearSeenKeys = () => {
    setSeenKeys(new Set());
    try { localStorage.removeItem('examo_seen_alerts'); } catch (e) { }
  };

  return (
    <NotificationContext.Provider value={{ addAlert, clearSeenKeys }}>
      {children}
      <div className="fixed top-6 right-6 z-[999] space-y-3 pointer-events-none">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-full duration-300 ${
              alert.type === 'error' ? 'bg-red-600 text-white border-red-500' :
              alert.type === 'success' ? 'bg-green-600 text-white border-green-500' :
              'bg-indigo-600 text-white border-indigo-500'
            }`}>
            {alert.type === 'error' ? <AlertTriangle className="w-5 h-5" /> :
             alert.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
             <ShieldCheck className="w-5 h-5" />}
            <span className="font-bold text-sm">{alert.message}</span>
            <button onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))} className="ml-2 opacity-70 hover:opacity-100 transition"><CloseIcon className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};
