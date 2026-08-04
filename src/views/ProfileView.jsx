import React, { useState } from 'react';
import {
  User, Mail, Calendar, Award, ArrowDownLeft, ArrowUpRight, ShoppingBag,
  CheckSquare, Disc, Gift, History, Headset, HelpCircle, LogOut, ArrowRight, Sparkles
} from 'lucide-react';

export default function ProfileView({ user, onNavigate, onLogout }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const formatDate = (ts) => {
    if (!ts) return '01.03.2026';
    return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const quickLinks = [
    { id: 'deposit', label: 'Make a Deposit', icon: ArrowDownLeft, color: '#10b981' },
    { id: 'withdrawal', label: 'Withdraw Funds', icon: ArrowUpRight, color: '#f59e0b' },
    { id: 'buy-plans', label: 'Investment Plans', icon: ShoppingBag, color: '#ff6b00' },
    { id: 'task', label: 'Daily Tasks', icon: CheckSquare, color: '#06b6d4' },
    { id: 'spin', label: 'Lucky Spin', icon: Disc, color: '#ec4899' },
    { id: 'bonus', label: 'Team Bonus', icon: Gift, color: '#8b5cf6' },
    { id: 'salary', label: 'Weekly Salary', icon: Calendar, color: '#3b82f6' },
    { id: 'record', label: 'Transaction Record', icon: History, color: '#64748b' },
    { id: 'support', label: 'Customer Support', icon: Headset, color: '#25D366' },
    { id: 'faq', label: 'Frequently Asked (FAQ)', icon: HelpCircle, color: '#94a3b8' }
  ];

  return (
    <div className="container py-2 profile-shell">
      <div className="glass-card profile-hero-card p-4 mb-4 border-0 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold fs-2 shadow" style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="flex-fill">
            <div className="d-flex align-items-center gap-2 mb-1">
              <h4 className="fw-bold text-dark m-0">{user?.name || 'User Name'}</h4>
              <div className="rank-badge d-inline-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                <Sparkles size={14} />
                <span>{user?.rank || 'Member'}</span>
              </div>
            </div>
            <div className="text-muted small mb-1 d-flex align-items-center gap-1">
              <Mail size={14} /> {user?.email}
            </div>
            <div className="text-muted small d-flex align-items-center gap-1">
              <Calendar size={14} /> Member Since: {formatDate(user?.createdAt)}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
          <div>
            <span className="text-muted small">Current Wallet Balance</span>
            <h4 className="fw-extrabold text-orange m-0" style={{ color: '#ff6b00' }}>${user?.walletBalance?.toFixed(2) || '0.00'} USD</h4>
          </div>
          <button className="btn btn-orange btn-sm px-3 py-2 fw-bold" onClick={() => onNavigate('deposit')}>
            Make a Deposit →
          </button>
        </div>
      </div>

      <h6 className="fw-bold text-dark mb-3">Account Shortcuts</h6>
      <div className="row g-2 mb-4">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="col-12 col-sm-6">
              <div className="glass-card profile-link-card p-3 h-100" onClick={() => onNavigate(item.id)}>
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 rounded-3 text-white" style={{ backgroundColor: item.color }}>
                    <Icon size={18} />
                  </div>
                  <span className="fw-bold text-dark">{item.label}</span>
                </div>
                <ArrowRight size={18} className="text-muted mt-2" />
              </div>
            </div>
          );
        })}
      </div>

      <button className="btn btn-danger w-100 py-3 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" onClick={() => setShowLogoutModal(true)}>
        <LogOut size={20} /> Logout Account
      </button>

      {showLogoutModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-modal border-0 p-4 text-center">
              <div className="mx-auto rounded-circle bg-danger text-white d-flex align-items-center justify-content-center mb-3 shadow" style={{ width: 64, height: 64 }}>
                <LogOut size={32} />
              </div>
              <h4 className="fw-bold text-dark mb-2">Confirm Logout</h4>
              <p className="text-muted small mb-4">Are you sure you want to log out of your SuccessX account?</p>
              <div className="d-flex gap-2">
                <button className="btn btn-light w-50 py-2.5 rounded-3 fw-semibold border" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                <button className="btn btn-danger w-50 py-2.5 rounded-3 fw-bold" onClick={onLogout}>Yes, Logout</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
