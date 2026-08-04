import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Play, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, ref, onValue, update, set, PKR_RATE } from '../firebase';

export default function TaskView({ user, onNavigate, onUserUpdate }) {
  const [activePlans, setActivePlans] = useState([]);
  const [totalTaskEarnings, setTotalTaskEarnings] = useState(0);
  const [claimingId, setClaimingId] = useState(null);
  const [now, setNow] = useState(Date.now());

  // Update current time live every second for countdown timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const userPlansRef = ref(db, `userPlans/${user.uid}`);
    const unsubscribe = onValue(userPlansRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const plansList = Object.values(data);
        setActivePlans(plansList);

        // Compute total claimed task earnings sum
        const sum = plansList.reduce((acc, p) => acc + (p.totalClaimedAmount || 0), 0);
        setTotalTaskEarnings(sum);
      } else {
        setActivePlans([]);
        setTotalTaskEarnings(0);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleClaimTask = async (planItem) => {
    if (!user) return;
    setClaimingId(planItem.id);

    try {
      const profit = Number(planItem.dailyProfit);
      const newWalletBalance = (user.walletBalance || 0) + profit;

      // Update user wallet
      await update(ref(db, `users/${user.uid}`), {
        walletBalance: newWalletBalance
      });

      // Update plan's lastClaimedAt and totalClaimedAmount
      const updatedClaimedAmount = (planItem.totalClaimedAmount || 0) + profit;
      await update(ref(db, `userPlans/${user.uid}/${planItem.id}`), {
        lastClaimedAt: Date.now(),
        totalClaimedAmount: updatedClaimedAmount
      });

      // Record daily profit history item
      const recId = 'REC_' + Date.now();
      await set(ref(db, `dailyProfits/${user.uid}/${recId}`), {
        id: recId,
        planName: planItem.name,
        amount: profit,
        status: 'success',
        createdAt: Date.now()
      });

      // Notification
      await set(ref(db, `notifications/${user.uid}/${Date.now()}`), {
        title: 'Daily Task Claimed!',
        message: `Claimed $${profit.toFixed(2)} (${(profit * PKR_RATE).toLocaleString()} PKR) from ${planItem.name}.`,
        type: 'task',
        createdAt: Date.now(),
        read: false
      });

      onUserUpdate({ ...user, walletBalance: newWalletBalance });
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });

    } catch (err) {
      console.error(err);
    } finally {
      setClaimingId(null);
    }
  };

  const formatCountdown = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container py-2 page-shell">
      <div className="d-flex align-items-center gap-3 mb-1">
        <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h4 className="fw-bold m-0">Daily Tasks</h4>
          <small className="text-muted">Watch tasks to claim your daily profits</small>
        </div>
      </div>

      <div className="glass-card p-4 mb-4 text-center border-0 shadow-sm page-hero-card">
        <span className="text-muted small fw-bold text-uppercase tracking-wider">Total Claim Earnings</span>
        <h2 className="fw-extrabold text-orange m-0 display-6" style={{ color: '#ff6b00' }}>
          ${totalTaskEarnings.toFixed(2)}
        </h2>
        <span className="badge bg-orange text-white rounded-pill px-3 py-1 mt-2 fw-semibold" style={{ background: '#ff6b00' }}>
          Rs {(totalTaskEarnings * PKR_RATE).toLocaleString()} PKR Total Earned
        </span>
      </div>

      {/* ACTIVE PLANS LIST */}
      {activePlans.length === 0 ? (
        <div className="glass-card p-5 text-center my-3">
          <Sparkles size={48} className="text-orange mb-3 mx-auto" style={{ color: '#ff6b00' }} />
          <h5 className="fw-bold text-dark">No Active Investment Plans</h5>
          <p className="text-muted small mb-4">You need to buy an investment plan to unlock daily profit tasks.</p>
          <button className="btn btn-orange px-4 py-2.5 fw-bold" onClick={() => onNavigate('buy-plans')}>
            Browse Investment Plans
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {activePlans.map((plan) => {
            const COOLDOWN_24H = 24 * 60 * 60 * 1000;
            const lastClaim = plan.lastClaimedAt || 0;
            const nextClaimTime = lastClaim + COOLDOWN_24H;
            const remainingMs = nextClaimTime - now;
            const canClaim = remainingMs <= 0;

            return (
              <div key={plan.id} className="col-12 col-md-6">
                <div className="glass-card p-4 border-0 shadow-sm h-100 page-card">
                  
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 fw-bold mb-1">
                        Active Plan
                      </span>
                      <h5 className="fw-bold text-dark m-0">{plan.name}</h5>
                    </div>
                    <div className="text-end">
                      <span className="badge bg-orange text-white rounded-pill px-2.5 py-1 fw-bold" style={{ background: '#ff6b00' }}>
                        ${plan.price} Plan
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-light rounded-4 mb-3">
                    <div className="d-flex justify-content-between py-1 border-bottom">
                      <span className="text-muted small">Daily Profit:</span>
                      <strong className="text-success small">+${plan.dailyProfit} (Rs {(plan.dailyProfit * PKR_RATE).toLocaleString()} PKR)</strong>
                    </div>
                    <div className="d-flex justify-content-between py-1">
                      <span className="text-muted small">Total Claimed:</span>
                      <strong className="text-dark small">${(plan.totalClaimedAmount || 0).toFixed(2)}</strong>
                    </div>
                  </div>

                  {canClaim ? (
                    <button 
                      className="btn btn-orange w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow"
                      disabled={claimingId === plan.id}
                      onClick={() => handleClaimTask(plan)}
                    >
                      {claimingId === plan.id ? 'Claiming Profit...' : (
                        <>
                          <Play size={18} fill="white" /> Watch Task & Claim ${plan.dailyProfit}
                        </>
                      )}
                    </button>
                  ) : (
                    <button className="btn btn-light w-100 py-3 fw-bold border text-muted d-flex align-items-center justify-content-center gap-2" disabled>
                      <Clock size={18} className="text-warning" /> Next Task In: {formatCountdown(remainingMs)}
                    </button>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
