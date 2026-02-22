import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { generateUUID } from '../lib/uuid';
import { AlertTriangle, CheckCircle, ShieldCheck, X as CloseIcon } from 'lucide-react';

interface Alert {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface NotificationContextType {
  addAlert: (message: string, type?: 'info' | 'error' | 'success') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const id = generateUUID();
    setAlerts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  }, []);

  return (
    <NotificationContext.Provider value={{ addAlert }}>
      {children}
      {/* Custom Alerts UI */}
      <div className="fixed top-6 right-6 z-[999] space-y-3 pointer-events-none">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-full duration-300 ${
              alert.type === 'error' ? 'bg-red-600 text-white border-red-500' :
              alert.type === 'success' ? 'bg-green-600 text-white border-green-500' :
              'bg-indigo-600 text-white border-indigo-500'
            }`}
          >
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
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
