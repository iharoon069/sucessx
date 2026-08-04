import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, CheckCircle2, ShieldCheck, Lock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, ref, onValue, set, update, get, PKR_RATE } from '../firebase';

export default function SalaryView({ user, onNavigate, onUserUpdate }) {
  const [totalTeamDeposit, setTotalTeamDeposit] = useState(0);
  const [lastSalaryClaim, setLastSalaryClaim] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [now, setNow] = useState(Date.now());

  const salaryTiers = [
    { tier: 1, name: '1st Weekly Salary', reqDeposit: 100, weeklySalary: 2 },
    { tier: 2, name: '2nd Weekly Salary', reqDeposit: 200, weeklySalary: 4 },
    { tier: 3, name: '3rd Weekly Salary', reqDeposit: 400, weeklySalary: 6 },
    { tier: 4, name: '4th Weekly Salary', reqDeposit: 600, weeklySalary: 8 },
    { tier: 5, name: '5th Weekly Salary', reqDeposit: 1000, weeklySalary: 10 }
  ];

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch Total Downline Team Deposits (Lv1 + Lv2 + Lv3)
    const usersRef = ref(db, 'users');
    const unsubUsers = onValue(usersRef, async (snapshot) => {
      if (snapshot.exists()) {
        const allUsers = Object.values(snapshot.val());

        // Lv1
        const lv1 = allUsers.filter(u => u.sponsorId === user.referralCode || u.sponsorId === user.uid);
        // Lv2
        const lv2 = allUsers.filter(u => lv1.some(l1 => l1.referralCode === u.sponsorId || l1.uid === u.sponsorId));
        // Lv3
        const lv3 = allUsers.filter(u => lv2.some(l2 => l2.referralCode === u.sponsorId || l2.uid === u.sponsorId));

        const teamUids = [...lv1, ...lv2, ...lv3].map(u => u.uid);

        const depSnap = await get(ref(db, 'deposits'));
        let totalDep = 0;
        if (depSnap.exists()) {
          const allDeps = Object.values(depSnap.val());
          allDeps.forEach((dep) => {
            if (dep.status === 'approved' && teamUids.includes(dep.uid)) {
              totalDep += Number(dep.amountUSD || dep.amount || 0);
            }
          });
        }
        setTotalTeamDeposit(totalDep);
      }
    });

    // Listen to Last Salary Claim
    const salRef = ref(db, `salaryClaims/${user.uid}`);
    const unsubSal = onValue(salRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.lastClaimedAt) {
        setLastSalaryClaim(data.lastClaimedAt);
      } else {
        setLastSalaryClaim(0);
      }
    });

    return () => {
      unsubUsers();
      unsubSal();
    };
  }, [user]);

  // Determine highest unlocked salary tier
  let activeSalaryTier = null;
  salaryTiers.forEach(t => {
    if (totalTeamDeposit >= t.reqDeposit) {
      activeSalaryTier = t;
    }
  });

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const nextClaimTime = lastSalaryClaim + SEVEN_DAYS_MS;
  const remainingMs = nextClaimTime - now;
  const canClaimWeekly = remainingMs <= 0;

  const handleClaimSalary = async () => {
    if (!activeSalaryTier || !canClaimWeekly || claiming) return;
    setClaiming(true);

    try {
      const reward = activeSalaryTier.weeklySalary;
      const newWallet = (user.walletBalance || 0) + reward;

      // Update user balance
      await update(ref(db, `users/${user.uid}`), {
        walletBalance: newWallet
      });

      // Update salary claims lock timestamp
      await set(ref(db, `salaryClaims/${user.uid}`), {
        lastClaimedAt: Date.now(),
        tierName: activeSalaryTier.name,
        amount: reward
      });

      // Record in salary logs
      const salId = 'SAL_' + Date.now();
      await set(ref(db, `salaryLogs/${user.uid}/${salId}`), {
        id: salId,
        tierName: activeSalaryTier.name,
        amount: reward,
        createdAt: Date.now()
      });

      // Notification
      await set(ref(db, `notifications/${user.uid}/${Date.now()}`), {
        title: 'Weekly Salary Credited!',
        message: `Claimed $${reward} (${(reward * PKR_RATE).toLocaleString()} PKR) for ${activeSalaryTier.name}.`,
        type: 'salary',
        createdAt: Date.now(),
        read: false
      });

      onUserUpdate({ ...user, walletBalance: newWallet });
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });

    } catch (err) {
      console.error(err);
    } finally {
      setClaiming(false);
    }
  };

  const formatTimer = (ms) => {
    if (ms <= 0) return '0d 0h 0m 0s';
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  return (
    <div className="container py-2 page-shell">
      <div className="d-flex align-items-center gap-3 mb-1">
        <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h4 className="fw-bold m-0">Weekly Salary Program</h4>
          <small className="text-muted">Earn recurring weekly payouts based on team deposit volume</small>
        </div>
      </div>

      {/* OVERVIEW STATS CARD */}
      <div className="glass-card p-4 mb-4 border-0 shadow-sm page-hero-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <span className="text-muted small fw-bold text-uppercase">Total Downline Team Deposits</span>
            <h2 className="fw-extrabold text-orange m-0" style={{ color: '#ff6b00' }}>
              ${totalTeamDeposit.toFixed(2)}
            </h2>
            <small className="text-muted">Rs {(totalTeamDeposit * PKR_RATE).toLocaleString()} PKR</small>
          </div>

          <div className="text-end">
            <span className="text-muted small d-block">Active Salary Tier:</span>
            <span className="badge bg-orange text-white rounded-pill px-3 py-1.5 fw-bold fs-6" style={{ background: '#ff6b00' }}>
              {activeSalaryTier ? activeSalaryTier.name : 'None Unlocked'}
            </span>
          </div>
        </div>

        {/* Claim Action Button */}
        {activeSalaryTier && (
          <div className="pt-3 border-top">
            {canClaimWeekly ? (
              <button 
                className="btn btn-orange w-100 py-3 fw-bold fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2"
                disabled={claiming}
                onClick={handleClaimSalary}
              >
                <Calendar size={20} /> Claim Weekly Salary (${activeSalaryTier.weeklySalary.toFixed(2)})
              </button>
            ) : (
              <div className="p-3 bg-white rounded-3 border text-center">
                <span className="text-muted small d-block mb-1">
                  <Clock size={16} className="text-warning me-1" /> Weekly Salary Cooldown Active
                </span>
                <strong className="text-dark fs-5">{formatTimer(remainingMs)}</strong>
                <small className="text-muted d-block mt-1">Next claim available automatically when 7-day timer finishes.</small>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SALARY TIERS LIST */}
      <h6 className="fw-bold text-dark mb-3">Salary Tiers & Progress</h6>
      <div className="row g-3">
        {salaryTiers.map((t) => {
          const isReached = totalTeamDeposit >= t.reqDeposit;
          const progressPercent = Math.min(100, (totalTeamDeposit / t.reqDeposit) * 100);

          return (
            <div key={t.tier} className="col-12 col-md-6">
              <div className={`glass-card p-3 border-0 shadow-sm page-card ${isReached ? 'border-start border-4 border-success' : ''}`}>
                
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-dark m-0">{t.name}</h6>
                  <span className="badge bg-success text-white rounded-pill px-2.5 py-1 fw-bold">
                    ${t.weeklySalary} / Week
                  </span>
                </div>

                <div className="d-flex justify-content-between text-muted small mb-1">
                  <span>Req Team Deposit: ${t.reqDeposit}</span>
                  <span>{progressPercent.toFixed(0)}%</span>
                </div>

                <div className="progress mb-2" style={{ height: '8px', borderRadius: '10px' }}>
                  <div 
                    className="progress-bar bg-orange" 
                    role="progressbar" 
                    style={{ width: `${progressPercent}%`, background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}
                  ></div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
