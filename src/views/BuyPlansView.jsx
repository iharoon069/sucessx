import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, AlertTriangle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, ref, onValue, set, get, update, PKR_RATE } from '../firebase';

export default function BuyPlansView({ user, onNavigate, onUserUpdate }) {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const plansRef = ref(db, 'plans');
    const unsubscribe = onValue(plansRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPlans(Object.values(data));
      } else {
        setPlans([
          { id: 'plan_1', name: 'Starter Plan', price: 10, dailyProfit: 0.8, durationDays: 30, totalReturn: 24 },
          { id: 'plan_2', name: 'Pro Growth Plan', price: 30, dailyProfit: 2.5, durationDays: 30, totalReturn: 75 },
          { id: 'plan_3', name: 'Elite Master Plan', price: 100, dailyProfit: 9.0, durationDays: 30, totalReturn: 270 }
        ]);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleBuyClick = (plan) => {
    setError('');
    setSelectedPlan(plan);
    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedPlan || !user) return;
    setError('');

    const planPrice = Number(selectedPlan.price);
    if (user.walletBalance < planPrice) {
      setError(`Insufficient wallet balance! You need $${planPrice} ($${(planPrice * PKR_RATE).toLocaleString()} PKR). Please deposit funds.`);
      return;
    }

    setLoading(true);

    try {
      const newBalance = user.walletBalance - planPrice;
      const spinsEarned = Math.floor(planPrice / 10);
      const newSpins = (user.spinsAvailable || 0) + spinsEarned;

      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        walletBalance: newBalance,
        spinsAvailable: newSpins
      });

      const userPlanId = 'UPLAN_' + Date.now() + Math.random().toString(36).substr(2, 3);
      const userPlanData = {
        id: userPlanId,
        planId: selectedPlan.id,
        name: selectedPlan.name,
        price: planPrice,
        dailyProfit: Number(selectedPlan.dailyProfit),
        durationDays: Number(selectedPlan.durationDays),
        totalReturn: Number(selectedPlan.totalReturn || selectedPlan.dailyProfit * selectedPlan.durationDays),
        purchaseDate: Date.now(),
        lastClaimedAt: 0
      };

      await set(ref(db, `userPlans/${user.uid}/${userPlanId}`), userPlanData);

      if (user.sponsorId && user.sponsorId !== 'direct') {
        const usersRef = ref(db, 'users');
        const usersSnap = await get(usersRef);

        if (usersSnap.exists()) {
          const allUsers = usersSnap.val();
          const sponsorLv1 = Object.values(allUsers).find((u) => u.referralCode === user.sponsorId || u.uid === user.sponsorId);

          if (sponsorLv1) {
            const commLv1 = planPrice * 0.08;
            await update(ref(db, `users/${sponsorLv1.uid}`), { walletBalance: (sponsorLv1.walletBalance || 0) + commLv1 });
            await set(ref(db, `notifications/${sponsorLv1.uid}/${Date.now()}_lv1`), { title: 'Level 1 Commission Received!', message: `Earned $${commLv1.toFixed(2)} (8%) from ${user.name}'s plan purchase.`, type: 'commission', createdAt: Date.now(), read: false });

            if (sponsorLv1.sponsorId && sponsorLv1.sponsorId !== 'direct') {
              const sponsorLv2 = Object.values(allUsers).find((u) => u.referralCode === sponsorLv1.sponsorId || u.uid === sponsorLv1.sponsorId);
              if (sponsorLv2) {
                const commLv2 = planPrice * 0.03;
                await update(ref(db, `users/${sponsorLv2.uid}`), { walletBalance: (sponsorLv2.walletBalance || 0) + commLv2 });
                await set(ref(db, `notifications/${sponsorLv2.uid}/${Date.now()}_lv2`), { title: 'Level 2 Commission Received!', message: `Earned $${commLv2.toFixed(2)} (3%) from downline plan purchase.`, type: 'commission', createdAt: Date.now(), read: false });

                if (sponsorLv2.sponsorId && sponsorLv2.sponsorId !== 'direct') {
                  const sponsorLv3 = Object.values(allUsers).find((u) => u.referralCode === sponsorLv2.sponsorId || u.uid === sponsorLv2.sponsorId);
                  if (sponsorLv3) {
                    const commLv3 = planPrice * 0.01;
                    await update(ref(db, `users/${sponsorLv3.uid}`), { walletBalance: (sponsorLv3.walletBalance || 0) + commLv3 });
                    await set(ref(db, `notifications/${sponsorLv3.uid}/${Date.now()}_lv3`), { title: 'Level 3 Commission Received!', message: `Earned $${commLv3.toFixed(2)} (1%) from downline plan purchase.`, type: 'commission', createdAt: Date.now(), read: false });
                  }
                }
              }
            }
          }
        }
      }

      onUserUpdate({ ...user, walletBalance: newBalance, spinsAvailable: newSpins });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setShowConfirmModal(false);
      onNavigate('task');
    } catch (err) {
      console.error(err);
      setError('Purchase failed due to connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-2">
      <div className="glass-card plan-hero-card p-4 mb-3">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <div>
            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3 dashboard-pill">
              <Sparkles size={16} />
              <span className="fw-semibold small">Premium Investment Plans</span>
            </div>
            <h4 className="fw-bold m-0">Choose a plan that matches your growth goal</h4>
            <small className="text-muted">High yield returns with daily payouts and instant tracking.</small>
          </div>
          <div className="plan-balance-pill">Wallet: ${user?.walletBalance?.toFixed(2) || '0.00'}</div>
        </div>
      </div>

      <div className="row g-3">
        {plans.map((plan) => {
          const pricePkr = (plan.price * PKR_RATE).toLocaleString();
          const dailyProfitPkr = (plan.dailyProfit * PKR_RATE).toLocaleString();
          const totalProfit = plan.totalReturn || (plan.dailyProfit * (plan.durationDays || 30));
          const totalProfitPkr = (totalProfit * PKR_RATE).toLocaleString();

          return (
            <div key={plan.id} className="col-12 col-md-6 col-lg-4">
              <div className="glass-card plan-card p-4 h-100 position-relative">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className="badge bg-orange-subtle text-orange px-2.5 py-1 rounded-pill mb-1 fw-bold" style={{ background: 'rgba(255,107,0,0.12)', color: '#ff6b00' }}>
                      Package Plan
                    </span>
                    <h4 className="fw-bold text-dark m-0">{plan.name}</h4>
                  </div>
                  <div className="text-end">
                    <h3 className="fw-extrabold text-orange m-0" style={{ color: '#ff6b00' }}>${plan.price}</h3>
                    <small className="text-muted fw-semibold">Rs {pricePkr} PKR</small>
                  </div>
                </div>

                <div className="bg-light p-3 rounded-4 mb-3">
                  <div className="d-flex justify-content-between py-1.5 border-bottom border-secondary border-opacity-10">
                    <span className="text-muted small">Daily Profit:</span>
                    <strong className="text-success small">${plan.dailyProfit} (${dailyProfitPkr} PKR)</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1.5 border-bottom border-secondary border-opacity-10">
                    <span className="text-muted small">Duration:</span>
                    <strong className="text-dark small">{plan.durationDays} Days</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1.5">
                    <span className="text-muted small">Total Net Return:</span>
                    <strong className="text-orange small">${totalProfit.toFixed(2)} (${totalProfitPkr} PKR)</strong>
                  </div>
                </div>

                <button className="btn btn-orange w-100 py-3 fw-bold d-flex align-items-center justify-content-center gap-2" onClick={() => handleBuyClick(plan)}>
                  <ShoppingBag size={18} /> Buy Plan Now
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showConfirmModal && selectedPlan && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-modal border-0 p-4 text-center">
              <div className="mx-auto rounded-circle d-flex align-items-center justify-content-center mb-3 shadow" style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}>
                <Sparkles size={32} className="text-white" />
              </div>
              <h4 className="fw-bold text-dark mb-1">Confirm Plan Purchase</h4>
              <p className="text-muted small mb-3">Are you sure you want to purchase <strong>{selectedPlan.name}</strong> for <strong>${selectedPlan.price} (${(selectedPlan.price * PKR_RATE).toLocaleString()} PKR)</strong>?</p>
              {error && (
                <div className="alert alert-danger py-2 rounded-3 small mb-3 text-start">
                  <AlertTriangle size={16} className="me-1" /> {error}
                </div>
              )}
              <div className="d-flex gap-2 mt-2">
                <button className="btn btn-light w-50 py-2.5 rounded-3 fw-semibold border" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                <button className="btn btn-orange w-50 py-2.5 rounded-3 fw-bold" disabled={loading} onClick={confirmPurchase}>{loading ? 'Processing...' : 'Yes, Buy Plan'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
