import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, ExternalLink, ShieldCheck, Headset } from 'lucide-react';
import { db, ref, onValue } from '../firebase';

export default function SupportView({ onNavigate }) {
  const [supportLinks, setSupportLinks] = useState({
    whatsapp: 'https://whatsapp.com',
    telegram: 'https://telegram.org'
  });

  useEffect(() => {
    const supportRef = ref(db, 'adminConfig/support');
    const unsubscribe = onValue(supportRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSupportLinks(data);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="container py-2">
      
      {/* Top Header */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h4 className="fw-bold m-0">Customer Support</h4>
          <small className="text-muted">We are available 24/7 to assist you</small>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="glass-card p-4 mb-4 text-center border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.1), rgba(255,140,0,0.05))' }}>
        <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 shadow" style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}>
          <Headset size={32} className="text-white" />
        </div>
        <h4 className="fw-bold text-dark mb-2">Need Help or Have Questions?</h4>
        <p className="text-muted small max-w-500 mx-auto m-0">
          Our dedicated customer success team is available round-the-clock via WhatsApp and Telegram to ensure smooth deposits, withdrawals, and account inquiries.
        </p>
      </div>

      {/* Realistic Social Buttons */}
      <div className="row g-3">
        
        {/* WhatsApp Card */}
        <div className="col-12 col-md-6">
          <div className="glass-card p-4 border-0 shadow-sm h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 rounded-4" style={{ backgroundColor: '#25D366' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.572-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                </div>
                <div>
                  <h5 className="fw-bold text-dark m-0">Official WhatsApp Support</h5>
                  <small className="text-muted">Instant Chat & Updates</small>
                </div>
              </div>
              <p className="text-muted small mb-3">
                Connect directly with our support team for payment assistance, account verification, and team guidance.
              </p>
            </div>

            <a 
              href={supportLinks.whatsapp} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-success w-100 py-3 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              Contact on WhatsApp <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Telegram Card */}
        <div className="col-12 col-md-6">
          <div className="glass-card p-4 border-0 shadow-sm h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="p-3 rounded-4" style={{ backgroundColor: '#0088cc' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.536-.197 1.006.128.832.942z"/>
                  </svg>
                </div>
                <div>
                  <h5 className="fw-bold text-dark m-0">Telegram Channel & Help</h5>
                  <small className="text-muted">Official Announcements</small>
                </div>
              </div>
              <p className="text-muted small mb-3">
                Join our global Telegram channel to receive platform news, profit proofs, and admin announcements.
              </p>
            </div>

            <a 
              href={supportLinks.telegram} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-primary w-100 py-3 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
              style={{ backgroundColor: '#0088cc', borderColor: '#0088cc' }}
            >
              Join Telegram Channel <ExternalLink size={16} />
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}
