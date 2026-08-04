import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, CheckCircle2, XCircle, DollarSign, Gift, Disc, Calendar, Award } from 'lucide-react';
import { db, ref, onValue, update } from '../firebase';

export default function NotificationsView({ user, onNavigate }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    const notifRef = ref(db, `notifications/${user.uid}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, val]) => ({
          notifKey: key,
          ...val
        }));
        list.sort((a, b) => b.createdAt - a.createdAt);
        setNotifications(list);

        // Mark unread as read
        list.forEach((n) => {
          if (!n.read) {
            update(ref(db, `notifications/${user.uid}/${n.notifKey}`), { read: true });
          }
        });
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const getNotifStyle = (type) => {
    switch (type) {
      case 'deposit':
        return { icon: CheckCircle2, bg: '#dcfce7', color: '#15803d' };
      case 'withdrawal':
        return { icon: DollarSign, bg: '#fef3c7', color: '#d97706' };
      case 'commission':
        return { icon: Award, bg: '#e0f2fe', color: '#0369a1' };
      case 'salary':
        return { icon: Calendar, bg: '#f3e8ff', color: '#7e22ce' };
      case 'bonus':
        return { icon: Gift, bg: '#fce7f3', color: '#be185d' };
      case 'spin':
        return { icon: Disc, bg: '#fff7ed', color: '#c2410c' };
      case 'rejected':
        return { icon: XCircle, bg: '#fee2e2', color: '#b91c1c' };
      default:
        return { icon: Bell, bg: '#ffefe0', color: '#ff6b00' };
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="container py-2">
      
      {/* Top Header */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h4 className="fw-bold m-0">Notifications</h4>
          <small className="text-muted">Stay updated on transactions & commissions</small>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="d-flex flex-column gap-3">
        {notifications.length === 0 ? (
          <div className="glass-card p-5 text-center text-muted small">
            <Bell size={40} className="mb-2 text-muted" />
            <div>No notifications available right now.</div>
          </div>
        ) : (
          notifications.map((item) => {
            const style = getNotifStyle(item.type);
            const Icon = style.icon;

            return (
              <div key={item.notifKey} className="glass-card p-3 border-0 shadow-sm d-flex align-items-start gap-3">
                <div className="rounded-circle p-2.5 d-flex align-items-center justify-content-center flex-shrink-0" style={{ backgroundColor: style.bg, color: style.color }}>
                  <Icon size={22} />
                </div>

                <div className="flex-fill">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="fw-bold text-dark m-0">{item.title}</h6>
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>{formatDate(item.createdAt)}</small>
                  </div>
                  <p className="text-muted small m-0" style={{ lineHeight: '1.5' }}>
                    {item.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
