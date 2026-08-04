import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, ArrowUpRight, ShoppingBag, CheckSquare, Calendar, 
  Gift, Disc, History, Share2, Headset, HelpCircle, MessageSquare, ExternalLink, X
} from 'lucide-react';
import { db, ref, onValue, PKR_RATE } from '../firebase';

export default function DashboardView({ user, onNavigate }) {
  const [popupConfig, setPopupConfig] = useState({ enabled: true, title: 'Welcome to SuccessX!', text: 'Start earning daily profits by selecting investment packages. Join our official WhatsApp group for updates!', whatsapp: 'https://whatsapp.com' });
  const [showPopup, setShowPopup] = useState(false);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    // Read Popup config from DB
    const popupRef = ref(db, 'adminConfig/popup');
    const unsubscribePopup = onValue(popupRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPopupConfig(data);
        if (data.enabled) {
          // Check if dismissed in session
          const dismissed = sessionStorage.getItem('popup_dismissed');
          if (!dismissed) setShowPopup(true);
        }
      }
    });

    // Read Admin Banners
    const bannersRef = ref(db, 'adminConfig/banners');
    const unsubscribeBanners = onValue(bannersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBanners(Array.isArray(data) ? data : Object.values(data));
      } else {
        setBanners([]);
      }
    });

    return () => {
      unsubscribePopup();
      unsubscribeBanners();
    };
  }, []);

  const handleDismissPopup = () => {
    sessionStorage.setItem('popup_dismissed', 'true');
    setShowPopup(false);
  };

  const usdBalance = user?.walletBalance || 0;
  const pkrBalance = (usdBalance * PKR_RATE).toLocaleString('en-US');

  const menuGridItems = [
    { id: 'buy-plans', label: 'Buy Plan', icon: ShoppingBag, color: '#ff6b00' },
    { id: 'task', label: 'Task', icon: CheckSquare, color: '#10b981' },
    { id: 'salary', label: 'Salary', icon: Calendar, color: '#8b5cf6' },
    { id: 'bonus', label: 'Bonus', icon: Gift, color: '#ec4899' },
    { id: 'spin', label: 'Spin', icon: Disc, color: '#f59e0b' },
    { id: 'record', label: 'Record', icon: History, color: '#3b82f6' },
    { id: 'invite', label: 'Invite', icon: Share2, color: '#06b6d4' },
    { id: 'support', label: 'Support', icon: Headset, color: '#25D366' },
    { id: 'faq', label: 'FAQ', icon: HelpCircle, color: '#64748b' }
  ];

  return (
    <div className="container py-2">
      
      {/* WALLET CARD */}
      <div className="wallet-card mb-4">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <span className="text-white-50 small fw-semibold">Total Wallet Balance</span>
            <h1 className="fw-extrabold text-white mb-0 display-6">
              ${usdBalance.toFixed(2)}
            </h1>
            <div className="d-inline-flex align-items-center gap-1 bg-white bg-opacity-20 px-3 py-1 rounded-pill mt-2">
              <span className="text-white small fw-bold">Rs {pkrBalance} PKR</span>
              <span className="text-white-50 small" style={{ fontSize: '0.75rem' }}>(1$ = {PKR_RATE} PKR)</span>
            </div>
          </div>
        </div>

        {/* Deposit & Withdraw Buttons */}
        <div className="row g-2 mt-3 pt-2 border-top border-white border-opacity-20">
          <div className="col-6">
            <button 
              className="btn btn-light w-100 py-2.5 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 text-dark shadow-sm"
              onClick={() => onNavigate('deposit')}
            >
              <ArrowDownLeft size={18} className="text-success" /> Deposit
            </button>
          </div>
          <div className="col-6">
            <button 
              className="btn btn-outline-light w-100 py-2.5 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2"
              onClick={() => onNavigate('withdrawal')}
            >
              <ArrowUpRight size={18} className="text-warning" /> Withdrawal
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <h6 className="fw-bold text-muted text-uppercase mb-3 small tracking-wider">Services & Growth</h6>
      <div className="row row-cols-3 g-3 mb-4">
        {menuGridItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="col">
              <div 
                className="grid-icon-btn h-100"
                onClick={() => onNavigate(item.id)}
              >
                <div className="grid-icon-wrapper" style={{ color: item.color }}>
                  <Icon size={24} />
                </div>
                <span className="text-center small">{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADMIN BANNERS / PICS SECTION */}
      {banners.length > 0 && (
        <div className="mb-4">
          <h6 className="fw-bold text-muted text-uppercase mb-3 small tracking-wider">Latest Highlights</h6>
          <div className="d-flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
            {banners.map((imgUrl, idx) => (
              <div key={idx} className="flex-shrink-0 rounded-4 overflow-hidden shadow-sm glass-card" style={{ width: '85%', maxWidth: '380px' }}>
                <img 
                  src={imgUrl} 
                  alt={`Banner ${idx + 1}`} 
                  className="w-100 object-fit-cover" 
                  style={{ height: '180px' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADMIN ANNOUNCEMENT POPUP MODAL */}
      {showPopup && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1075 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-modal border-0 p-4 text-center position-relative shadow-lg">
              
              <button 
                className="btn-close position-absolute top-0 end-0 m-3" 
                onClick={handleDismissPopup}
              ></button>

              <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 shadow" style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}>
                <MessageSquare size={32} className="text-white" />
              </div>

              <h4 className="fw-bold text-dark mb-2">{popupConfig.title || 'Official Announcement'}</h4>
              <p className="text-muted small mb-4" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                {popupConfig.text}
              </p>

              {/* Realistic WhatsApp Button */}
              {popupConfig.whatsapp && (
                <a 
                  href={popupConfig.whatsapp} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-success w-100 py-3 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 mb-2 shadow"
                  style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                >
                  {/* WhatsApp SVG logo */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  Join Official WhatsApp Group <ExternalLink size={16} />
                </a>
              )}

              <button className="btn btn-orange-outline w-100 py-2.5 rounded-3 fw-semibold" onClick={handleDismissPopup}>
                Continue to App
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
