import React, { useState, useEffect } from 'react';
import { Bell, User, ShieldAlert, Award, Sparkles } from 'lucide-react';
import { db, ref, onValue } from '../firebase';

export default function Header({ user, onNavigate, onOpenAdminSecret }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const notifRef = ref(db, `notifications/${user.uid}`);
    const unsubscribe = onValue(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const unread = Object.values(data).filter(n => !n.read).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <header className="glass-card mb-3 p-3 sticky-top" style={{ borderRadius: '0 0 20px 20px', zIndex: 1020 }}>
      <div className="d-flex align-items-center justify-content-between">
        
        {/* Brand Logo & Name */}
        <div className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
          <div className="d-flex align-items-center justify-content-center bg-orange text-white rounded-3 p-2" style={{ background: 'linear-gradient(135deg, #ff6b00, #ff8c00)', width: 40, height: 40, boxShadow: '0 4px 12px rgba(255, 107, 0, 0.4)' }}>
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <h5 className="m-0 fw-bold" style={{ background: 'linear-gradient(135deg, #ff6b00, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Success<span style={{ color: '#ff8c00' }}>X</span>
            </h5>
            <small className="text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>Growth & Earn Platform</small>
          </div>
        </div>

        {/* User Stats / Admin Trigger & Notifications */}
        {user ? (
          <div className="d-flex align-items-center gap-2">
            
            {/* Rank badge */}
            <div className="rank-badge d-none d-sm-flex align-items-center">
              <Award size={14} />
              <span>{user.rank || 'Member'}</span>
            </div>

            {/* Notifications Button */}
            <button 
              className="btn btn-light rounded-circle position-relative p-2 border-0 glass-card"
              onClick={() => onNavigate('notifications')}
              title="Notifications"
              style={{ width: 42, height: 42 }}
            >
              <Bell size={20} className="text-orange" style={{ color: '#ff6b00' }} />
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Name & Profile Button */}
            <div 
              className="d-flex align-items-center gap-2 bg-white px-3 py-1 rounded-pill shadow-sm"
              style={{ border: '1px solid rgba(255, 107, 0, 0.2)', cursor: 'pointer' }}
              onClick={() => onNavigate('profile')}
            >
              <div className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}>
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="fw-semibold text-dark d-none d-md-inline small">
                {user.name ? user.name.split(' ')[0] : 'User'}
              </span>
            </div>

          </div>
        ) : (
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-orange-outline" onClick={() => onNavigate('login')}>
              Login
            </button>
            <button className="btn btn-sm btn-orange" onClick={() => onNavigate('register')}>
              Register
            </button>
            {/* Secret key trigger for Admin */}
            <button 
              className="btn btn-sm btn-light text-muted p-2 rounded-circle"
              onClick={onOpenAdminSecret}
              title="Admin Portal"
            >
              <ShieldAlert size={16} />
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
