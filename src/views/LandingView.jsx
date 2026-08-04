import React from 'react';
import { Sparkles, Rocket, ShieldCheck, TrendingUp, Users, ChevronRight, Zap, Gift, ArrowRight, CircleDollarSign } from 'lucide-react';

export default function LandingView({ onNavigate }) {
  const highlights = [
    { label: 'PKR Exchange', value: '$1 = 300 PKR' },
    { label: 'Affiliate', value: '8% - 3% - 1%' },
    { label: 'Withdrawals', value: 'Instant & Secure' }
  ];

  const features = [
    { icon: TrendingUp, title: 'High-Yield Plans', copy: 'Create multiple active plans and watch your daily growth accelerate.', accent: 'orange' },
    { icon: Zap, title: '24h Task Claims', copy: 'Claim tasks on a seamless timer and let your earnings flow automatically.', accent: 'amber' },
    { icon: Users, title: 'Team Salary + Spin', copy: 'Unlock weekly salary rewards and spin for surprise cash bonuses.', accent: 'gold' }
  ];

  return (
    <div className="container py-3">
      <div className="hero-spotlight glass-card p-4 p-md-5 mb-4 position-relative overflow-hidden">
        <div className="hero-glow hero-glow-one"></div>
        <div className="hero-glow hero-glow-two"></div>

        <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3" style={{ background: 'rgba(255, 94, 0, 0.12)', color: '#ff5e00' }}>
          <Sparkles size={18} />
          <span className="fw-bold small tracking-wider">Professional Growth Platform</span>
        </div>

        <h1 className="fw-extrabold mb-3 display-4 hero-title">
          SuccessX brings your earnings into a premium digital experience.
        </h1>

        <p className="lead text-muted max-w-700 mx-auto mb-4" style={{ fontSize: '1.06rem', lineHeight: '1.75' }}>
          A sleek success ecosystem designed for daily earnings, smart task operations, weekly salaries, immersive spins, and high-value referrals.
        </p>

        <div className="d-flex flex-wrap justify-content-center gap-3 mb-4">
          <button className="btn btn-orange btn-lg px-4 py-3 d-flex align-items-center gap-2 shadow-lg" onClick={() => onNavigate('register')}>
            Open Free Account <ChevronRight size={20} />
          </button>
          <button className="btn btn-orange-outline btn-lg px-4 py-3" onClick={() => onNavigate('login')}>
            Member Login
          </button>
        </div>

        <div className="row g-3 justify-content-center text-center mt-2 pt-3 border-top border-orange-10">
          {highlights.map((item) => (
            <div className="col-4 col-md-3" key={item.label}>
              <div className="hero-kpi">
                <h4 className="fw-bold mb-0" style={{ color: '#ff5e00' }}>{item.value}</h4>
                <small className="text-muted fw-semibold">{item.label}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row g-3 mb-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div className="col-md-4" key={feature.title}>
              <div className="glass-card feature-card p-4 h-100">
                <div className={`feature-icon ${feature.accent}`}>
                  <Icon size={28} />
                </div>
                <h5 className="fw-bold mb-2">{feature.title}</h5>
                <p className="text-muted small m-0" style={{ lineHeight: '1.6' }}>{feature.copy}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-card p-4 text-center border-0 shadow-sm cta-card">
        <div className="d-flex justify-content-center mb-3">
          <div className="feature-icon orange">
            <Rocket size={24} />
          </div>
        </div>
        <h3 className="fw-extrabold mb-2">Ready to scale your earnings?</h3>
        <p className="text-white-50 mb-3 small">Create your account now and experience a modern, premium growth environment.</p>
        <button className="btn btn-light btn-lg px-4 py-2.5 rounded-pill fw-bold text-dark shadow" onClick={() => onNavigate('register')}>
          Start Now <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
