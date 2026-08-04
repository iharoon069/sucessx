import React from 'react';
import { Home, ShoppingBag, CheckSquare, User } from 'lucide-react';

export default function BottomNav({ activeTab, onNavigate }) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'buy-plans', label: 'Buy Plan', icon: ShoppingBag },
    { id: 'task', label: 'Task', icon: CheckSquare },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="fixed-bottom glass-nav px-3 py-2">
      <div className="container">
        <div className="d-flex justify-content-around align-items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`btn border-0 d-flex flex-column align-items-center p-1 transition-all ${isActive ? 'text-orange fw-bold' : 'text-muted'}`}
                style={{ 
                  color: isActive ? '#ff6b00' : '#64748b',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div 
                  className={`d-flex align-items-center justify-content-center rounded-pill px-3 py-1 ${isActive ? 'bg-orange-subtle' : ''}`}
                  style={{ background: isActive ? 'rgba(255, 107, 0, 0.12)' : 'transparent' }}
                >
                  <Icon size={22} color={isActive ? '#ff6b00' : '#64748b'} />
                </div>
                <span style={{ fontSize: '0.75rem', marginTop: '2px' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
