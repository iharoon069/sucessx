import React, { useState, useEffect } from 'react';
import { ArrowLeft, Gift, Award, CheckCircle2, Lock, Shield, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, ref, onValue, set, update, get, PKR_RATE } from '../firebase';

export default function BonusView({ user, onNavigate, onUserUpdate }) {
  const [lv1TeamDeposit, setLv1TeamDeposit] = useState(0);
  const [bonusClaims, setBonusClaims] = useState({});
  const [claimingTier, setClaimingTier] = useState(null);

  const bonusTiers = [
    { id: 'b1', reqDeposit: 20, reward: 0.5, rank: 'Bronze Agent', rankColor: '#cd7f32' },
    { id: 'b2', reqDeposit: 40, reward: 1.0, rank: 'Silver Partner', rankColor: '#94a3b8' },
    { id: 'b3', reqDeposit: 80, reward: 2.0, rank: 'Gold Master', rankColor: '#eab308' },
    { id: 'b4', reqDeposit: 100, reward: 3.0, rank: 'Platinum Leader', rankColor: '#06b6d4' },
    { id: 'b5', reqDeposit: 150, reward: 5.0, rank: 'Diamond Director', rankColor: '#3b82f6' },
    { id: 'b6', reqDeposit: 200, reward: 8.0, rank: 'Crown Ambassador', rankColor: '#8b5cf6' },
    { id: 'b7', reqDeposit: 400, reward: 12.0, rank: 'Royal Titan', rankColor: '#ec4899' },
    { id: 'b8', reqDeposit: 500, reward: 15.0, rank: 'Supreme President', rankColor: '#ef4444' }
  ];

  useEffect(() => {
    if (!user) return;

    // Fetch Lv1 Team Total Deposits
    const usersRef = ref(db, 'users');
    const unsubUsers = onValue(usersRef, async (snapshot) => {
      if (snapshot.exists()) {
        const allUsers = snapshot.val();
        const lv1Members = Object.values(allUsers).filter(
          u => u.sponsorId === user.referralCode || u.sponsorId === user.uid
        );

        // Fetch deposits for all Lv1 members
        const depSnap = await get(ref(db, 'deposits'));
        let totalDep = 0;
        if (depSnap.exists()) {
          const allDeps = depSnap.val();
          Object.values(allDeps).forEach((dep) => {
            if (dep.status === 'approved' && lv1Members.some(m => m.uid === dep.uid)) {
              totalDep += Number(dep.amountUSD || dep.amount || 0);
            }
          });
        }
        setLv1TeamDeposit(totalDep);

        // Compute current rank title based on total team deposit
        let highestRank = 'Member';
        bonusTiers.forEach((tier) => {
          if (totalDep >= tier.reqDeposit) {
            highestRank = tier.rank;
          }
        });

        if (user.rank !== highestRank) {
          await update(ref(db, `users/${user.uid}`), { rank: highestRank });
          onUserUpdate({ ...user, rank: highestRank });
        }
      }
    });

    // Listen to Bonus Claims
    const claimsRef = ref(db, `bonusClaims/${user.uid}`);
    const unsubClaims = onValue(claimsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setBonusClaims(data);
      else setBonusClaims({});
    });

    return () => {
      unsubUsers();
      unsubClaims();
    };
  }, [user]);

  const handleClaimBonus = async (tier) => {
    if (!user || bonusClaims[tier.id] || lv1TeamDeposit < tier.reqDeposit) return;
    setClaimingTier(tier.id);

    try {
      const reward = Number(tier.reward);
      const newWallet = (user.walletBalance || 0) + reward;

      // Update user wallet
      await update(ref(db, `users/${user.uid}`), {
        walletBalance: newWallet
      });

      // Mark bonus tier claimed
      await set(ref(db, `bonusClaims/${user.uid}/${tier.id}`), {
        claimed: true,
        amount: reward,
        claimedAt: Date.now()
      });

      // Notification
      await set(ref(db, `notifications/${user.uid}/${Date.now()}`), {
        title: 'One-Time Team Bonus Claimed!',
        message: `Claimed $${reward.toFixed(2)} (${(reward * PKR_RATE).toLocaleString()} PKR) for reaching $${tier.reqDeposit} Lv1 team deposits!`,
        type: 'bonus',
        createdAt: Date.now(),
        read: false
      });

      onUserUpdate({ ...user, walletBalance: newWallet });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });

    } catch (err) {
      console.error(err);
    } finally {
      setClaimingTier(null);
    }
  };

  const totalClaimedBonus = Object.values(bonusClaims).reduce((acc, c) => acc + (c.amount || 0), 0);

  return (
    <div className="container py-2">
      
      {/* Top Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => onNavigate('dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h4 className="fw-bold m-0">Team Deposit Bonus</h4>
            <small className="text-muted">One-time claimable bonuses based on Lv1 deposits</small>
          </div>
        </div>
      </div>

      {/* OVERVIEW STATS CARD */}
      <div className="glass-card p-4 mb-4 text-center border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, rgba(255,107,0,0.1), rgba(255,140,0,0.05))' }}>
        <div className="row g-3">
          <div className="col-6 border-end">
            <span className="text-muted small fw-bold text-uppercase">Lv1 Team Deposit</span>
            <h3 className="fw-extrabold text-orange m-0" style={{ color: '#ff6b00' }}>
              ${lv1TeamDeposit.toFixed(2)}
            </h3>
            <small className="text-muted">Rs {(lv1TeamDeposit * PKR_RATE).toLocaleString()} PKR</small>
          </div>
          <div className="col-6">
            <span className="text-muted small fw-bold text-uppercase">Total Bonus Claimed</span>
            <h3 className="fw-extrabold text-success m-0">
              ${totalClaimedBonus.toFixed(2)}
            </h3>
            <small className="text-muted">Rs {(totalClaimedBonus * PKR_RATE).toLocaleString()} PKR</small>
          </div>
        </div>
      </div>

      {/* BONUS TIERS LIST */}
      <div className="row g-3">
        {bonusTiers.map((tier) => {
          const isClaimed = !!bonusClaims[tier.id];
          const isUnlocked = lv1TeamDeposit >= tier.reqDeposit;

          return (
            <div key={tier.id} className="col-12 col-md-6">
              <div className="glass-card p-3 border-0 shadow-sm d-flex align-items-center justify-content-between">
                
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center text-white p-3 shadow-sm" style={{ background: tier.rankColor, width: 50, height: 50 }}>
                    <Award size={24} />
                  </div>

                  <div>
                    <div className="d-flex align-items-center gap-1">
                      <span className="fw-bold text-dark">{tier.rank}</span>
                    </div>
                    <small className="text-muted d-block">Req: ${tier.reqDeposit}+ Lv1 Team Deposit</small>
                    <strong className="text-orange small" style={{ color: '#ff6b00' }}>
                      Bonus: +${tier.reward} (Rs {(tier.reward * PKR_RATE).toLocaleString()} PKR)
                    </strong>
                  </div>
                </div>

                <div>
                  {isClaimed ? (
                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-2 fw-bold d-inline-flex align-items-center gap-1">
                      <CheckCircle2 size={16} /> Claimed
                    </span>
                  ) : isUnlocked ? (
                    <button 
                      className="btn btn-orange btn-sm px-3 py-2 fw-bold"
                      disabled={claimingTier === tier.id}
                      onClick={() => handleClaimBonus(tier)}
                    >
                      {claimingTier === tier.id ? 'Claiming...' : 'Claim Bonus'}
                    </button>
                  ) : (
                    <span className="badge bg-light text-muted border rounded-pill px-3 py-2 fw-semibold d-inline-flex align-items-center gap-1">
                      <Lock size={14} /> Locked
                    </span>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
