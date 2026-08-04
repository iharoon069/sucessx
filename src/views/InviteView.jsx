import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, Users, Share2, DollarSign, UserX, ShieldCheck, ChevronRight } from 'lucide-react';
import { db, ref, onValue, get, PKR_RATE } from '../firebase';

export default function InviteView({ user, onNavigate }) {
  const [copied, setCopied] = useState(false);
  const [lv1List, setLv1List] = useState([]);
  const [lv2List, setLv2List] = useState([]);
  const [lv3List, setLv3List] = useState([]);
  const [inactiveCount, setInactiveCount] = useState(0);

  const [selectedLevel, setSelectedLevel] = useState(null); // 1 | 2 | 3
  const [showMembersModal, setShowMembersModal] = useState(false);

  const inviteLink = `${window.location.origin}/?ref=${user?.referralCode || user?.uid}`;

  useEffect(() => {
    if (!user) return;

    const usersRef = ref(db, 'users');
    const unsubUsers = onValue(usersRef, async (snapshot) => {
      if (snapshot.exists()) {
        const allUsers = Object.values(snapshot.val());
        const allPlansSnap = await get(ref(db, 'userPlans'));
        const allUserPlans = allPlansSnap.exists() ? allPlansSnap.val() : {};

        // Helper to calculate total investment & commissions for a user
        const buildMemberObj = (m, commPercent) => {
          const userPlans = allUserPlans[m.uid] ? Object.values(allUserPlans[m.uid]) : [];
          const totalInvest = userPlans.reduce((sum, p) => sum + Number(p.price || 0), 0);
          const commEarned = totalInvest * commPercent;
          const hasActivePlan = userPlans.length > 0;

          return {
            uid: m.uid,
            name: m.name,
            email: m.email,
            invest: totalInvest,
            commisions: commEarned,
            hasActivePlan
          };
        };

        // Level 1: Users who set sponsorId = user.referralCode or user.uid
        const l1Raw = allUsers.filter(u => u.sponsorId === user.referralCode || u.sponsorId === user.uid);
        const l1Processed = l1Raw.map(u => buildMemberObj(u, 0.08));
        setLv1List(l1Processed);

        // Level 2: Users whose sponsor is in l1Raw
        const l2Raw = allUsers.filter(u => l1Raw.some(l1 => l1.referralCode === u.sponsorId || l1.uid === u.sponsorId));
        const l2Processed = l2Raw.map(u => buildMemberObj(u, 0.03));
        setLv2List(l2Processed);

        // Level 3: Users whose sponsor is in l2Raw
        const l3Raw = allUsers.filter(u => l2Raw.some(l2 => l2.referralCode === u.sponsorId || l2.uid === u.sponsorId));
        const l3Processed = l3Raw.map(u => buildMemberObj(u, 0.01));
        setLv3List(l3Processed);

        // Inactive Members: total downline members who have 0 investment / 0 active plans
        const allTeam = [...l1Processed, ...l2Processed, ...l3Processed];
        const inactive = allTeam.filter(m => !m.hasActivePlan).length;
        setInactiveCount(inactive);

      } else {
        setLv1List([]);
        setLv2List([]);
        setLv3List([]);
        setInactiveCount(0);
      }
    });

    return () => unsubUsers();
  }, [user]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openLevelModal = (lvl) => {
    setSelectedLevel(lvl);
    setShowMembersModal(true);
  };

  const getActiveLevelList = () => {
    if (selectedLevel === 1) return lv1List;
    if (selectedLevel === 2) return lv2List;
    if (selectedLevel === 3) return lv3List;
    return [];
  };

  const totalTeamCount = lv1List.length + lv2List.length + lv3List.length;

  return (
    <div className="container py-2">
      
      {/* Top Header */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h4 className="fw-bold m-0">Invite & Team Tree</h4>
          <small className="text-muted">Earn up to 3-Tier downline plan commissions</small>
        </div>
      </div>

      {/* REFERRAL LINK COPY CARD */}
      <div className="glass-card p-4 mb-4 border-0 shadow-sm">
        <h6 className="fw-bold text-dark mb-2">Your Unique Referral Link</h6>
        
        <div className="p-3 bg-white rounded-4 border mb-3">
          <div className="d-flex align-items-center justify-content-between gap-2">
            <span className="text-dark fw-bold text-truncate small">{inviteLink}</span>
            <button 
              className="btn btn-orange btn-sm px-3 py-2 fw-bold d-flex align-items-center gap-1 flex-shrink-0"
              onClick={handleCopyLink}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <div className="p-3 bg-light rounded-3 small">
          <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-1">
            <ShieldCheck size={16} className="text-orange" style={{ color: '#ff6b00' }} /> Commission Rules:
          </div>
          <p className="text-muted m-0">
            Earn <strong>Lv1 (8%)</strong>, <strong>Lv2 (3%)</strong>, and <strong>Lv3 (1%)</strong> instantly whenever downline members purchase an investment plan!
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <h6 className="fw-bold text-dark mb-3">Team Overview</h6>
      
      <div className="row g-3 mb-4">
        
        {/* Lv1 Card */}
        <div className="col-4">
          <div 
            className="glass-card p-3 text-center cursor-pointer hover-lift border-0 shadow-sm"
            onClick={() => openLevelModal(1)}
          >
            <span className="badge bg-orange text-white rounded-pill mb-1 px-2" style={{ background: '#ff6b00' }}>Lv 1</span>
            <h3 className="fw-extrabold text-dark m-0">{lv1List.length}</h3>
            <small className="text-muted d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '0.7rem' }}>
              Members <ChevronRight size={12} />
            </small>
          </div>
        </div>

        {/* Lv2 Card */}
        <div className="col-4">
          <div 
            className="glass-card p-3 text-center cursor-pointer hover-lift border-0 shadow-sm"
            onClick={() => openLevelModal(2)}
          >
            <span className="badge bg-primary text-white rounded-pill mb-1 px-2">Lv 2</span>
            <h3 className="fw-extrabold text-dark m-0">{lv2List.length}</h3>
            <small className="text-muted d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '0.7rem' }}>
              Members <ChevronRight size={12} />
            </small>
          </div>
        </div>

        {/* Lv3 Card */}
        <div className="col-4">
          <div 
            className="glass-card p-3 text-center cursor-pointer hover-lift border-0 shadow-sm"
            onClick={() => openLevelModal(3)}
          >
            <span className="badge bg-info text-white rounded-pill mb-1 px-2">Lv 3</span>
            <h3 className="fw-extrabold text-dark m-0">{lv3List.length}</h3>
            <small className="text-muted d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '0.7rem' }}>
              Members <ChevronRight size={12} />
            </small>
          </div>
        </div>

      </div>

      <div className="row g-3">
        <div className="col-6">
          <div className="glass-card p-3 text-center bg-white border-0 shadow-sm">
            <span className="text-muted small fw-bold text-uppercase d-block mb-1">Total Team</span>
            <h3 className="fw-extrabold text-success m-0">{totalTeamCount}</h3>
          </div>
        </div>

        <div className="col-6">
          <div className="glass-card p-3 text-center bg-white border-0 shadow-sm">
            <span className="text-muted small fw-bold text-uppercase d-block mb-1">Inactive Members</span>
            <h3 className="fw-extrabold text-danger m-0">{inactiveCount}</h3>
          </div>
        </div>
      </div>

      {/* MEMBERS LIST MODAL */}
      {showMembersModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-modal border-0 p-4">
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold m-0 text-dark">
                  Level {selectedLevel} Team Members ({getActiveLevelList().length})
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowMembersModal(false)}></button>
              </div>

              {getActiveLevelList().length === 0 ? (
                <div className="text-center py-4 text-muted small">No members registered in Level {selectedLevel} yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Investment ($)</th>
                        <th>Commissions ($)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getActiveLevelList().map((m) => (
                        <tr key={m.uid}>
                          <td className="fw-bold text-dark">{m.name}</td>
                          <td>${m.invest.toFixed(2)} (Rs {(m.invest * PKR_RATE).toLocaleString()} PKR)</td>
                          <td className="fw-bold text-success">+${m.commisions.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-3 text-end">
                <button className="btn btn-light border px-4 rounded-3" onClick={() => setShowMembersModal(false)}>
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
