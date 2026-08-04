import React, { useState, useEffect } from 'react';
import { ArrowLeft, Disc, Award, History, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, ref, onValue, update, set, PKR_RATE } from '../firebase';

export default function SpinView({ user, onNavigate, onUserUpdate }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinHistory, setSpinHistory] = useState([]);
  const [wonModal, setWonModal] = useState(null);

  useEffect(() => {
    if (!user) return;
    const historyRef = ref(db, `spinLogs/${user.uid}`);
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data);
        list.sort((a, b) => b.createdAt - a.createdAt);
        setSpinHistory(list);
      } else {
        setSpinHistory([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const availableSpins = user?.spinsAvailable || 0;

  const handleSpin = async () => {
    if (availableSpins <= 0 || spinning) return;
    setSpinning(true);

    // Land outcome strictly on $0.50 slice (Index for $0.50)
    // 5 slices: $0.5, $1, $4, $5, $10 -> 72 deg per slice
    // Target rotation: 5 full turns (1800 deg) + angle for $0.50 slice
    const newRotation = rotation + 1800 + (360 * 3) + 36; 
    setRotation(newRotation);

    setTimeout(async () => {
      setSpinning(false);
      const reward = 0.50; // Always max $0.50 as required

      try {
        const newBalance = (user.walletBalance || 0) + reward;
        const newSpins = availableSpins - 1;

        // Update user
        await update(ref(db, `users/${user.uid}`), {
          walletBalance: newBalance,
          spinsAvailable: newSpins
        });

        // Log spin history
        const spinId = 'SPIN_' + Date.now();
        await set(ref(db, `spinLogs/${user.uid}/${spinId}`), {
          id: spinId,
          amount: reward,
          createdAt: Date.now()
        });

        // Notification
        await set(ref(db, `notifications/${user.uid}/${Date.now()}`), {
          title: 'Lucky Wheel Bonus Won!',
          message: `You won $0.50 (${(0.50 * PKR_RATE).toLocaleString()} PKR) from Lucky Spin Wheel!`,
          type: 'spin',
          createdAt: Date.now(),
          read: false
        });

        onUserUpdate({ ...user, walletBalance: newBalance, spinsAvailable: newSpins });
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        setWonModal(reward);

      } catch (err) {
        console.error(err);
      }
    }, 4000);
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="container py-2 page-shell">
      <div className="d-flex align-items-center justify-content-between mb-1">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => onNavigate('dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h4 className="fw-bold m-0">Lucky Spin Wheel</h4>
            <small className="text-muted">Buy $10 plan to get 1 free spin!</small>
          </div>
        </div>

        <div className="px-3 py-1 bg-white rounded-pill border text-orange fw-bold small shadow-sm" style={{ color: '#ff6b00' }}>
          Spins: {availableSpins}
        </div>
      </div>

      {/* WHEEL SECTION */}
      <div className="glass-card p-4 mb-4 text-center position-relative overflow-hidden page-hero-card">
        
        <p className="text-muted small mb-3">
          Each $10 plan purchase awards 1 spin. Win guaranteed prizes up to $0.50!
        </p>

        {/* Pointer */}
        <div className="spin-pointer"></div>

        {/* Wheel Container */}
        <div className="spin-wheel-container my-3">
          <div 
            className="spin-wheel d-flex align-items-center justify-content-center text-white fw-bold fs-5"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              background: 'conic-gradient(#ff6b00 0deg 72deg, #ff8c00 72deg 144deg, #d97706 144deg 216deg, #e65100 216deg 288deg, #f59e0b 288deg 360deg)'
            }}
          >
            {/* Slice Labels */}
            <div className="position-absolute" style={{ transform: 'rotate(36deg) translateY(-85px)' }}>$0.50</div>
            <div className="position-absolute" style={{ transform: 'rotate(108deg) translateY(-85px)' }}>$1.00</div>
            <div className="position-absolute" style={{ transform: 'rotate(180deg) translateY(-85px)' }}>$4.00</div>
            <div className="position-absolute" style={{ transform: 'rotate(252deg) translateY(-85px)' }}>$5.00</div>
            <div className="position-absolute" style={{ transform: 'rotate(324deg) translateY(-85px)' }}>$10.00</div>
          </div>
        </div>

        {/* Spin Button */}
        <button 
          className="btn btn-orange btn-lg px-5 py-3 rounded-pill fw-bold shadow-lg mt-2"
          disabled={availableSpins <= 0 || spinning}
          onClick={handleSpin}
        >
          {spinning ? 'Spinning Wheel...' : availableSpins > 0 ? `SPIN NOW (${availableSpins} Left)` : 'No Spins Available'}
        </button>

        {availableSpins <= 0 && (
          <div className="mt-3">
            <button className="btn btn-link text-orange small fw-bold text-decoration-none" onClick={() => onNavigate('buy-plans')}>
              Buy a $10+ Plan to Unlock Spins →
            </button>
          </div>
        )}
      </div>

      {/* SPIN HISTORY SECTION */}
      <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
        <History size={18} className="text-orange" style={{ color: '#ff6b00' }} /> Spin History Logs
      </h6>

      <div className="glass-card p-3 page-card">
        {spinHistory.length === 0 ? (
          <div className="text-center py-3 text-muted small">No spin history recorded yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead>
                <tr>
                  <th>Prize Amount</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {spinHistory.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-bold text-success">+${item.amount.toFixed(2)} (Rs {(item.amount * PKR_RATE).toLocaleString()} PKR)</td>
                    <td><span className="badge-approved">Credited</span></td>
                    <td className="text-muted">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WON MODAL */}
      {wonModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-modal border-0 p-4 text-center">
              
              <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 shadow" style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}>
                <Sparkles size={36} className="text-white" />
              </div>

              <h3 className="fw-extrabold text-dark mb-1">Congratulations!</h3>
              <p className="text-muted small mb-2">You won</p>
              <h2 className="fw-extrabold text-orange display-5 mb-3" style={{ color: '#ff6b00' }}>
                +${wonModal.toFixed(2)} USD
              </h2>
              <p className="text-muted small mb-4">
                (Rs {(wonModal * PKR_RATE).toLocaleString()} PKR has been added to your wallet balance!)
              </p>

              <button className="btn btn-orange w-100 py-3 fw-bold" onClick={() => setWonModal(null)}>
                Awesome, Collect Prize!
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
