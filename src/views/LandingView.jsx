import React from 'react';
import { Sparkles, ShieldCheck, TrendingUp, Users, Award, ChevronRight, Zap, Gift } from 'lucide-react';

export default function LandingView({ onNavigate }) {
  return (
    <div className="container py-3">
      
      {/* Hero Section */}
      <div className="glass-card p-4 p-md-5 mb-4 text-center position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 239, 224, 0.85))' }}>
        <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-orange-subtle text-orange mb-3" style={{ background: 'rgba(255, 107, 0, 0.12)', color: '#ff6b00' }}>
          <Sparkles size={16} />
          <span className="fw-bold small">Next-Gen Financial Ecosystem</span>
        </div>
        
        <h1 className="fw-extrabold mb-3 display-5" style={{ background: 'linear-gradient(135deg, #ff6b00 0%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome to SuccessX
        </h1>
        
        <p className="lead text-muted max-w-600 mx-auto mb-4" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
          Empowering your financial future with automated daily tasks, high-yield investment plans, weekly salaries, lucky spin rewards, and robust 3-tier affiliate commissions.
        </p>

        <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
          <button className="btn btn-orange btn-lg px-4 py-3 d-flex align-items-center gap-2" onClick={() => onNavigate('register')}>
            Get Started Now <ChevronRight size={20} />
          </button>
          <button className="btn btn-orange-outline btn-lg px-4 py-3" onClick={() => onNavigate('login')}>
            Member Login
          </button>
        </div>

        <div className="row g-3 justify-content-center text-center mt-3">
          <div className="col-4 col-md-3">
            <div className="p-2">
              <h4 className="fw-bold text-orange mb-0" style={{ color: '#ff6b00' }}>$1 = 300</h4>
              <small className="text-muted fw-semibold">PKR Rate</small>
            </div>
          </div>
          <div className="col-4 col-md-3">
            <div className="p-2">
              <h4 className="fw-bold text-orange mb-0" style={{ color: '#ff6b00' }}>8% - 3% - 1%</h4>
              <small className="text-muted fw-semibold">3-Tier Commission</small>
            </div>
          </div>
          <div className="col-4 col-md-3">
            <div className="p-2">
              <h4 className="fw-bold text-orange mb-0" style={{ color: '#ff6b00' }}>Instant</h4>
              <small className="text-muted fw-semibold">Withdrawals</small>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <h4 className="fw-bold mb-3 text-dark">Why Choose SuccessX?</h4>
      <div className="row g-3 mb-4">
        
        <div className="col-md-4">
          <div className="glass-card p-4 h-100">
            <div className="rounded-3 p-3 text-white mb-3 d-inline-block" style={{ background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}>
              <TrendingUp size={28} />
            </div>
            <h5 className="fw-bold mb-2">High Returns Plans</h5>
            <p className="text-muted small m-0">
              Multiple investment packages tailored for maximum daily yields with transparent returns and flexible lock periods.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="glass-card p-4 h-100">
            <div className="rounded-3 p-3 text-white mb-3 d-inline-block" style={{ background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}>
              <Zap size={28} />
            </div>
            <h5 className="fw-bold mb-2">Daily Tasks & Spin Wheel</h5>
            <p className="text-muted small m-0">
              Claim daily task earnings every 24 hours and spin the lucky wheel to get additional cash prizes!
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="glass-card p-4 h-100">
            <div className="rounded-3 p-3 text-white mb-3 d-inline-block" style={{ background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}>
              <Users size={28} />
            </div>
            <h5 className="fw-bold mb-2">Affiliate & Weekly Salary</h5>
            <p className="text-muted small m-0">
              Earn commissions across 3 downline levels plus claim up to $10/week in automatic team salary bonuses!
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
