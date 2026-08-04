import React, { useState, useEffect } from 'react';
import { 
  Menu, X, ShieldAlert, Users, ArrowDownLeft, ArrowUpRight, DollarSign, 
  Settings, Image, PlusCircle, Trash2, CheckCircle2, XCircle, Copy, Check, 
  ExternalLink, Search, ChevronLeft, ChevronRight, Lock, Unlock, Eye, Edit3
} from 'lucide-react';
import { db, ref, onValue, set, update, remove, get, PKR_RATE } from '../firebase';

export default function AdminView({ admin, onLogoutAdmin, onNavigate }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard'|'allMembers'|'pendingDeposits'|'pendingWithdrawals'|'popupConfig'|'dashboardPics'|'addPlans'|'deleteUserPlans'|'paymentInfo'|'supportLinks'|'depositHistory'|'withdrawalHistory'|'banUsers'

  // Data States
  const [users, setUsers] = useState({});
  const [deposits, setDeposits] = useState({});
  const [withdrawals, setWithdrawals] = useState({});
  const [plans, setPlans] = useState({});
  const [userPlans, setUserPlans] = useState({});
  
  const [popupData, setPopupData] = useState({ enabled: true, title: 'Welcome to SuccessX!', text: '', whatsapp: '' });
  const [banners, setBanners] = useState([]);
  const [paymentData, setPaymentData] = useState({
    easypaisa: { name: '', number: '' },
    jazzcash: { name: '', number: '' },
    allBank: { bankName: '', holderName: '', number: '' }
  });
  const [supportData, setSupportData] = useState({ whatsapp: '', telegram: '' });

  // Manage Member Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [editBalance, setEditBalance] = useState('');
  const [memberStats, setMemberStats] = useState(null);

  // Pagination for All Members
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // New Plan State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanDailyProfit, setNewPlanDailyProfit] = useState('');
  const [newPlanDuration, setNewPlanDuration] = useState(30);

  // Delete User Plan State
  const [searchUserKey, setSearchUserKey] = useState('');
  const [foundUserForPlan, setFoundUserForPlan] = useState(null);
  const [foundUserActivePlans, setFoundUserActivePlans] = useState([]);

  // Banner Upload State
  const [newBannerUrl, setNewBannerUrl] = useState('');

  // Proof Image Preview Modal
  const [viewProofUrl, setViewProofUrl] = useState(null);

  const [copiedId, setCopiedId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    // Listen to Firebase RTDB nodes
    const unsubUsers = onValue(ref(db, 'users'), snap => setUsers(snap.val() || {}));
    const unsubDeps = onValue(ref(db, 'deposits'), snap => setDeposits(snap.val() || {}));
    const unsubWiths = onValue(ref(db, 'withdrawals'), snap => setWithdrawals(snap.val() || {}));
    const unsubPlans = onValue(ref(db, 'plans'), snap => setPlans(snap.val() || {}));
    const unsubUPlans = onValue(ref(db, 'userPlans'), snap => setUserPlans(snap.val() || {}));

    const unsubPopup = onValue(ref(db, 'adminConfig/popup'), snap => {
      if (snap.exists()) setPopupData(snap.val());
    });
    const unsubBanners = onValue(ref(db, 'adminConfig/banners'), snap => {
      if (snap.exists()) setBanners(Array.isArray(snap.val()) ? snap.val() : Object.values(snap.val()));
    });
    const unsubPayment = onValue(ref(db, 'adminConfig/paymentInfo'), snap => {
      if (snap.exists()) setPaymentData(snap.val());
    });
    const unsubSupport = onValue(ref(db, 'adminConfig/support'), snap => {
      if (snap.exists()) setSupportData(snap.val());
    });

    return () => {
      unsubUsers();
      unsubDeps();
      unsubWiths();
      unsubPlans();
      unsubUPlans();
      unsubPopup();
      unsubBanners();
      unsubPayment();
      unsubSupport();
    };
  }, []);

  const usersList = Object.values(users);
  const depositsList = Object.values(deposits);
  const withdrawalsList = Object.values(withdrawals);

  // Compute Dashboard Stats
  const nowTs = Date.now();
  const startOfDay = new Date().setHours(0, 0, 0, 0);

  const pendingDeposits = depositsList.filter(d => d.status === 'pending');
  const pendingWithdrawals = withdrawalsList.filter(w => w.status === 'pending');

  const totalMembers = usersList.length;
  const inactiveMembers = usersList.filter(u => {
    const uPlans = userPlans[u.uid] ? Object.values(userPlans[u.uid]) : [];
    return uPlans.length === 0;
  }).length;

  const todayMembers = usersList.filter(u => u.createdAt >= startOfDay).length;
  const todayActiveMembers = usersList.filter(u => {
    const uPlans = userPlans[u.uid] ? Object.values(userPlans[u.uid]) : [];
    return u.createdAt >= startOfDay && uPlans.length > 0;
  }).length;

  const todayDeposits = depositsList
    .filter(d => d.status === 'approved' && d.createdAt >= startOfDay)
    .reduce((sum, d) => sum + Number(d.amountUSD || d.amount || 0), 0);

  const allDeposits = depositsList
    .filter(d => d.status === 'approved')
    .reduce((sum, d) => sum + Number(d.amountUSD || d.amount || 0), 0);

  const todayWithdrawals = withdrawalsList
    .filter(w => w.status === 'approved' && w.createdAt >= startOfDay)
    .reduce((sum, w) => sum + Number(w.amountUSD || 0), 0);

  const allWithdrawals = withdrawalsList
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + Number(w.amountUSD || 0), 0);

  const totalNetProfit = allDeposits - allWithdrawals;

  // Actions
  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showMsg = (msg) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3000);
  };

  // Approve Deposit
  const handleApproveDeposit = async (dep) => {
    try {
      // 1. Mark deposit approved
      await update(ref(db, `deposits/${dep.id}`), { status: 'approved', approvedAt: Date.now() });

      // 2. Credit user balance
      const targetUserRef = ref(db, `users/${dep.uid}`);
      const userSnap = await get(targetUserRef);

      if (userSnap.exists()) {
        const uData = userSnap.val();
        const depAmt = Number(dep.amountUSD || dep.amount);
        const newBal = (uData.walletBalance || 0) + depAmt;
        await update(targetUserRef, { walletBalance: newBal });

        // Notification for user
        await set(ref(db, `notifications/${dep.uid}/${Date.now()}`), {
          title: 'Deposit Approved!',
          message: `Your deposit of $${depAmt} (${(depAmt * PKR_RATE).toLocaleString()} PKR) has been approved and credited to your wallet balance.`,
          type: 'deposit',
          createdAt: Date.now(),
          read: false
        });
      }

      showMsg(`Deposit ${dep.id} APPROVED successfully.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Reject Deposit
  const handleRejectDeposit = async (dep) => {
    try {
      await update(ref(db, `deposits/${dep.id}`), { status: 'rejected', rejectedAt: Date.now() });

      await set(ref(db, `notifications/${dep.uid}/${Date.now()}`), {
        title: 'Deposit Rejected',
        message: `Your deposit request of $${dep.amountUSD || dep.amount} via ${dep.method} was rejected. Please verify Trx ID / Proof.`,
        type: 'rejected',
        createdAt: Date.now(),
        read: false
      });

      showMsg(`Deposit ${dep.id} REJECTED.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Approve Withdrawal
  const handleApproveWithdrawal = async (w) => {
    try {
      await update(ref(db, `withdrawals/${w.id}`), { status: 'approved', approvedAt: Date.now() });

      await set(ref(db, `notifications/${w.uid}/${Date.now()}`), {
        title: 'Withdrawal Approved!',
        message: `Your withdrawal of $${w.amountUSD} (Rs ${w.sendablePKR ? w.sendablePKR.toLocaleString() : (w.amountUSD * PKR_RATE).toLocaleString()} PKR) has been processed and sent to your account.`,
        type: 'withdrawal',
        createdAt: Date.now(),
        read: false
      });

      showMsg(`Withdrawal ${w.id} APPROVED.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Reject Withdrawal (Auto Refunds deducted wallet balance)
  const handleRejectWithdrawal = async (w) => {
    try {
      await update(ref(db, `withdrawals/${w.id}`), { status: 'rejected', rejectedAt: Date.now() });

      // Refund deducted balance
      const targetUserRef = ref(db, `users/${w.uid}`);
      const userSnap = await get(targetUserRef);

      if (userSnap.exists()) {
        const uData = userSnap.val();
        const refundAmt = Number(w.amountUSD);
        const newBal = (uData.walletBalance || 0) + refundAmt;
        await update(targetUserRef, { walletBalance: newBal });

        await set(ref(db, `notifications/${w.uid}/${Date.now()}`), {
          title: 'Withdrawal Rejected (Refunded)',
          message: `Your withdrawal of $${w.amountUSD} was rejected. The full amount has been refunded back to your wallet balance.`,
          type: 'rejected',
          createdAt: Date.now(),
          read: false
        });
      }

      showMsg(`Withdrawal ${w.id} REJECTED and refunded.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Manage Member Details
  const handleOpenManageMember = (u) => {
    setSelectedUser(u);
    setEditBalance(u.walletBalance || 0);

    // Compute detailed stats
    const uDeps = depositsList.filter(d => d.uid === u.uid && d.status === 'approved');
    const totalDep = uDeps.reduce((sum, d) => sum + Number(d.amountUSD || d.amount || 0), 0);

    const uWiths = withdrawalsList.filter(w => w.uid === u.uid && w.status === 'approved');
    const totalWith = uWiths.reduce((sum, w) => sum + Number(w.amountUSD || 0), 0);

    const lv1 = usersList.filter(m => m.sponsorId === u.referralCode || m.sponsorId === u.uid);
    const lv2 = usersList.filter(m => lv1.some(l1 => l1.referralCode === m.sponsorId || l1.uid === m.sponsorId));
    const lv3 = usersList.filter(m => lv2.some(l2 => l2.referralCode === m.sponsorId || l2.uid === m.sponsorId));

    // Commissions sum from userPlans of downlines
    let totalComm = 0;
    Object.values(userPlans).forEach((planMap) => {
      Object.values(planMap).forEach((p) => {
        // Simple commission estimation
      });
    });

    setMemberStats({
      totalDep,
      totalWith,
      totalTeam: lv1.length + lv2.length + lv3.length,
      lv1Count: lv1.length,
      lv2Count: lv2.length,
      lv3Count: lv3.length,
      totalComm: 0
    });
  };

  const handleUpdateMemberBalance = async () => {
    if (!selectedUser) return;
    try {
      await update(ref(db, `users/${selectedUser.uid}`), {
        walletBalance: Number(editBalance)
      });
      showMsg(`Balance updated for ${selectedUser.name}.`);
      setSelectedUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Ban User
  const handleToggleBanUser = async (u) => {
    try {
      const newStatus = !u.isBanned;
      await update(ref(db, `users/${u.uid}`), { isBanned: newStatus });
      showMsg(`User ${u.name} ${newStatus ? 'BANNED' : 'UNBANNED'}.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete User
  const handleDeleteUser = async (u) => {
    if (window.confirm(`Are you sure you want to delete user ${u.name}?`)) {
      try {
        await remove(ref(db, `users/${u.uid}`));
        showMsg(`User ${u.name} deleted.`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Add Plan
  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!newPlanName || !newPlanPrice || !newPlanDailyProfit) return;
    try {
      const planId = 'PLAN_' + Date.now();
      await set(ref(db, `plans/${planId}`), {
        id: planId,
        name: newPlanName,
        price: Number(newPlanPrice),
        dailyProfit: Number(newPlanDailyProfit),
        durationDays: Number(newPlanDuration),
        totalReturn: Number(newPlanDailyProfit) * Number(newPlanDuration)
      });
      setNewPlanName('');
      setNewPlanPrice('');
      setNewPlanDailyProfit('');
      showMsg('New Investment Plan created.');
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Plan
  const handleDeletePlan = async (pId) => {
    try {
      await remove(ref(db, `plans/${pId}`));
      showMsg('Plan deleted.');
    } catch (err) {
      console.error(err);
    }
  };

  // Search User Plans to Delete Someone's Plan
  const handleSearchUserForPlans = (e) => {
    e.preventDefault();
    setFoundUserForPlan(null);
    setFoundUserActivePlans([]);

    const term = searchUserKey.trim().toLowerCase();
    if (!term) return;

    const uFound = usersList.find(u => u.email.toLowerCase() === term || u.referralCode?.toLowerCase() === term || u.uid === term);
    if (uFound) {
      setFoundUserForPlan(uFound);
      const uPlans = userPlans[uFound.uid] ? Object.values(userPlans[uFound.uid]) : [];
      setFoundUserActivePlans(uPlans);
    } else {
      showMsg('No user found matching email or referral ID.');
    }
  };

  const handleDeleteUserActivePlan = async (userPlanId) => {
    if (!foundUserForPlan) return;
    try {
      await remove(ref(db, `userPlans/${foundUserForPlan.uid}/${userPlanId}`));
      setFoundUserActivePlans(prev => prev.filter(p => p.id !== userPlanId));
      showMsg('Plan deleted from user account.');
    } catch (err) {
      console.error(err);
    }
  };

  // Save Popup Config
  const handleSavePopupConfig = async (e) => {
    e.preventDefault();
    try {
      await set(ref(db, 'adminConfig/popup'), popupData);
      showMsg('Dashboard Popup settings updated.');
    } catch (err) {
      console.error(err);
    }
  };

  // Add Banner
  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!newBannerUrl.trim()) return;
    try {
      const updatedBanners = [...banners, newBannerUrl.trim()];
      await set(ref(db, 'adminConfig/banners'), updatedBanners);
      setNewBannerUrl('');
      showMsg('Banner added.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBanner = async (index) => {
    try {
      const updatedBanners = banners.filter((_, idx) => idx !== index);
      await set(ref(db, 'adminConfig/banners'), updatedBanners);
      showMsg('Banner removed.');
    } catch (err) {
      console.error(err);
    }
  };

  // Save Payment Info
  const handleSavePaymentInfo = async (e) => {
    e.preventDefault();
    try {
      await set(ref(db, 'adminConfig/paymentInfo'), paymentData);
      showMsg('Payment Info details saved.');
    } catch (err) {
      console.error(err);
    }
  };

  // Save Support Links
  const handleSaveSupportLinks = async (e) => {
    e.preventDefault();
    try {
      await set(ref(db, 'adminConfig/support'), supportData);
      showMsg('Support links updated.');
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination for All Members
  const totalPages = Math.ceil(usersList.length / pageSize) || 1;
  const paginatedMembers = usersList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const drawerMenuItems = [
    { id: 'dashboard', label: 'Dashboard Stats' },
    { id: 'allMembers', label: 'All Members' },
    { id: 'pendingDeposits', label: `Pending Deposits (${pendingDeposits.length})` },
    { id: 'pendingWithdrawals', label: `Pending Withdrawals (${pendingWithdrawals.length})` },
    { id: 'popupConfig', label: 'Dashboard Popup Text & Links' },
    { id: 'dashboardPics', label: 'Dashboard Pics Banners' },
    { id: 'addPlans', label: 'Add Investment Plans' },
    { id: 'deleteUserPlans', label: 'Delete Someone Plans' },
    { id: 'paymentInfo', label: 'Payment Info' },
    { id: 'supportLinks', label: 'Support Links' },
    { id: 'depositHistory', label: 'Deposit History' },
    { id: 'withdrawalHistory', label: 'Withdrawal History' },
    { id: 'banUsers', label: 'Ban Users' }
  ];

  return (
    <div className="container-fluid p-3 min-vh-100" style={{ background: '#f8fafc' }}>
      
      {/* ADMIN HEADER */}
      <header className="glass-card p-3 mb-4 d-flex align-items-center justify-content-between border-0 shadow-sm">
        <div className="d-flex align-items-center gap-3">
          {/* 3-Lines Hamburger Menu Button */}
          <button 
            className="btn btn-light rounded-circle p-2 border shadow-sm"
            onClick={() => setDrawerOpen(true)}
            title="Open Admin Menu"
          >
            <Menu size={22} className="text-orange" style={{ color: '#ff6b00' }} />
          </button>

          <div>
            <h5 className="fw-bold m-0 text-dark">SuccessX Admin Control Panel</h5>
            <small className="text-muted">Role: Firebase Admin ({admin?.email || 'admin'})</small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-sm btn-outline-secondary rounded-pill" onClick={() => onNavigate('dashboard')}>
            Exit to App
          </button>
          <button className="btn btn-sm btn-danger rounded-pill" onClick={onLogoutAdmin}>
            Logout Admin
          </button>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="alert alert-success py-2 px-3 rounded-3 shadow-sm mb-3 small d-flex align-items-center gap-2">
          <CheckCircle2 size={18} /> {actionMessage}
        </div>
      )}

      {/* ADMIN NAVIGATION DRAWER */}
      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)}></div>
          <div className="admin-drawer open p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
              <h5 className="fw-bold m-0 text-dark">Admin Navigation</h5>
              <button className="btn-close" onClick={() => setDrawerOpen(false)}></button>
            </div>

            <div className="d-flex flex-column gap-1">
              {drawerMenuItems.map(item => (
                <button
                  key={item.id}
                  className={`btn text-start py-2.5 px-3 rounded-3 fw-semibold small ${activeTab === item.id ? 'btn-orange text-white' : 'btn-light border-0 text-dark'}`}
                  onClick={() => { setActiveTab(item.id); setDrawerOpen(false); }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 1. DASHBOARD STATS VIEW */}
      {activeTab === 'dashboard' && (
        <div>
          <h5 className="fw-bold mb-3 text-dark">Platform Overview Statistics</h5>
          
          <div className="row g-3 mb-4">
            
            <div className="col-6 col-md-4 col-lg-3">
              <div className="glass-card p-3 border-0 shadow-sm bg-white">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Pending Deposits</small>
                <h3 className="fw-extrabold text-warning m-0">{pendingDeposits.length}</h3>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="glass-card p-3 border-0 shadow-sm bg-white">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Pending Withdrawal</small>
                <h3 className="fw-extrabold text-danger m-0">{pendingWithdrawals.length}</h3>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="glass-card p-3 border-0 shadow-sm bg-white">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Total Members</small>
                <h3 className="fw-extrabold text-dark m-0">{totalMembers}</h3>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="glass-card p-3 border-0 shadow-sm bg-white">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Inactive Members</small>
                <h3 className="fw-extrabold text-muted m-0">{inactiveMembers}</h3>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="glass-card p-3 border-0 shadow-sm bg-white">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Today Members</small>
                <h3 className="fw-extrabold text-primary m-0">{todayMembers}</h3>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="glass-card p-3 border-0 shadow-sm bg-white">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Today Active Members</small>
                <h3 className="fw-extrabold text-info m-0">{todayActiveMembers}</h3>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="glass-card p-3 border-0 shadow-sm bg-white">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Today Deposits</small>
                <h3 className="fw-extrabold text-success m-0">${todayDeposits.toFixed(2)}</h3>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="glass-card p-3 border-0 shadow-sm bg-white">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">All Deposits</small>
                <h3 className="fw-extrabold text-success m-0">${allDeposits.toFixed(2)}</h3>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="glass-card p-3 border-0 shadow-sm bg-white">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Today Withdrawal</small>
                <h3 className="fw-extrabold text-danger m-0">${todayWithdrawals.toFixed(2)}</h3>
              </div>
            </div>

            <div className="col-6 col-md-4 col-lg-3">
              <div className="glass-card p-3 border-0 shadow-sm bg-white">
                <small className="text-muted fw-bold text-uppercase d-block mb-1">All Withdrawn</small>
                <h3 className="fw-extrabold text-danger m-0">${allWithdrawals.toFixed(2)}</h3>
              </div>
            </div>

            <div className="col-12 col-md-8 col-lg-6">
              <div className="glass-card p-3 border-0 shadow-sm bg-white text-center" style={{ borderLeft: '5px solid #ff6b00' }}>
                <small className="text-muted fw-bold text-uppercase d-block mb-1">Total Project Net Profit</small>
                <h2 className="fw-extrabold text-orange m-0" style={{ color: '#ff6b00' }}>
                  ${totalNetProfit.toFixed(2)} USD (Rs {(totalNetProfit * PKR_RATE).toLocaleString()} PKR)
                </h2>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. ALL MEMBERS VIEW */}
      {activeTab === 'allMembers' && (
        <div className="glass-card p-4 border-0 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold m-0 text-dark">All Registered Members ({usersList.length})</h5>
            <small className="text-muted">Showing 50 per page</small>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle small">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Wallet ($)</th>
                  <th>Ban Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.map(u => (
                  <tr key={u.uid}>
                    <td className="fw-bold text-dark">{u.name}</td>
                    <td>{u.email}</td>
                    <td className="fw-bold text-orange" style={{ color: '#ff6b00' }}>${(u.walletBalance || 0).toFixed(2)}</td>
                    <td>
                      {u.isBanned ? (
                        <span className="badge bg-danger rounded-pill">Banned</span>
                      ) : (
                        <span className="badge bg-success rounded-pill">Active</span>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-orange-outline py-1 px-2.5 fw-bold" onClick={() => handleOpenManageMember(u)}>
                          Manage
                        </button>
                        <button className={`btn btn-sm py-1 px-2 ${u.isBanned ? 'btn-outline-success' : 'btn-outline-warning'}`} onClick={() => handleToggleBanUser(u)}>
                          {u.isBanned ? <Unlock size={14} /> : <Lock size={14} />}
                        </button>
                        <button className="btn btn-sm btn-outline-danger py-1 px-2" onClick={() => handleDeleteUser(u)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
              <span className="small text-muted">Page {currentPage} of {totalPages}</span>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-light border" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <ChevronLeft size={16} /> Prev Page
                </button>
                <button 
                  className="btn btn-sm btn-light border" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next Page <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PENDING DEPOSITS VIEW */}
      {activeTab === 'pendingDeposits' && (
        <div>
          <h5 className="fw-bold mb-3 text-dark">Pending Deposit Verification ({pendingDeposits.length})</h5>
          
          {pendingDeposits.length === 0 ? (
            <div className="glass-card p-4 text-center text-muted small">No pending deposit requests right now.</div>
          ) : (
            <div className="row g-3">
              {pendingDeposits.map(dep => (
                <div key={dep.id} className="col-12 col-md-6 col-lg-4">
                  <div className="glass-card p-4 border-0 shadow-sm h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold text-dark m-0">{dep.userName}</h6>
                        <small className="text-muted d-block">{dep.userEmail}</small>
                      </div>
                      <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 fw-bold">
                        ${dep.amountUSD || dep.amount}
                      </span>
                    </div>

                    <div className="p-3 bg-light rounded-3 mb-3 small">
                      <div><span className="text-muted">Method:</span> <strong>{dep.method.toUpperCase()}</strong></div>
                      <div><span className="text-muted">Amount PKR:</span> <strong className="text-orange">Rs {dep.amountPKR ? dep.amountPKR.toLocaleString() : ((dep.amountUSD || dep.amount) * PKR_RATE).toLocaleString()} PKR</strong></div>
                      <div><span className="text-muted">TRX ID:</span> <strong className="text-dark font-monospace fs-6">{dep.trxId}</strong></div>
                    </div>

                    {dep.proofUrl && (
                      <div className="mb-3">
                        <button className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-1" onClick={() => setViewProofUrl(dep.proofUrl)}>
                          <Eye size={16} /> View Screenshot Proof
                        </button>
                      </div>
                    )}

                    <div className="d-flex gap-2">
                      <button className="btn btn-danger btn-sm w-50 py-2 fw-bold" onClick={() => handleRejectDeposit(dep)}>
                        Reject
                      </button>
                      <button className="btn btn-success btn-sm w-50 py-2 fw-bold" onClick={() => handleApproveDeposit(dep)}>
                        Successful
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. PENDING WITHDRAWALS VIEW */}
      {activeTab === 'pendingWithdrawals' && (
        <div>
          <h5 className="fw-bold mb-3 text-dark">Pending Withdrawal Verification ({pendingWithdrawals.length})</h5>

          {pendingWithdrawals.length === 0 ? (
            <div className="glass-card p-4 text-center text-muted small">No pending withdrawal requests.</div>
          ) : (
            <div className="row g-3">
              {pendingWithdrawals.map(w => (
                <div key={w.id} className="col-12 col-md-6 col-lg-4">
                  <div className="glass-card p-4 border-0 shadow-sm h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold text-dark m-0">{w.userName}</h6>
                        <small className="text-muted d-block">{w.userEmail}</small>
                      </div>
                      <span className="badge bg-danger text-white rounded-pill px-2.5 py-1 fw-bold">
                        ${w.amountUSD} Req
                      </span>
                    </div>

                    <div className="p-3 bg-light rounded-3 mb-3 small">
                      <div><span className="text-muted">Method:</span> <strong>{w.method.toUpperCase()}</strong></div>
                      <div><span className="text-muted">Acc Name:</span> <strong>{w.accName}</strong></div>
                      
                      <div className="d-flex align-items-center justify-content-between my-1">
                        <div><span className="text-muted">Acc Number:</span> <strong className="text-dark fs-6">{w.accNumber}</strong></div>
                        <button className="btn btn-link btn-sm p-0 text-orange" onClick={() => handleCopy(w.id, w.accNumber)}>
                          {copiedId === w.id ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>

                      <div><span className="text-muted">Deducted Tax:</span> <strong className="text-danger">-${(w.taxUSD || 0).toFixed(2)}</strong></div>
                      <div><span className="text-muted">Sendable PKR:</span> <strong className="text-success fs-6">Rs {w.sendablePKR ? w.sendablePKR.toLocaleString() : (w.amountUSD * PKR_RATE).toLocaleString()} PKR</strong></div>
                    </div>

                    <div className="d-flex gap-2">
                      <button className="btn btn-danger btn-sm w-50 py-2 fw-bold" onClick={() => handleRejectWithdrawal(w)}>
                        Rejected (Refund)
                      </button>
                      <button className="btn btn-success btn-sm w-50 py-2 fw-bold" onClick={() => handleApproveWithdrawal(w)}>
                        Successful
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. DASHBOARD POPUP TEXT & LINKS */}
      {activeTab === 'popupConfig' && (
        <div className="glass-card p-4 max-w-600 border-0 shadow-sm">
          <h5 className="fw-bold mb-3 text-dark">Dashboard Announcement Popup Settings</h5>

          <form onSubmit={handleSavePopupConfig}>
            <div className="form-check form-switch mb-3">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="popupToggle"
                checked={popupData.enabled}
                onChange={(e) => setPopupData({ ...popupData, enabled: e.target.checked })}
              />
              <label className="form-check-label fw-bold small" htmlFor="popupToggle">Enable Announcement Popup on Load</label>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Popup Title</label>
              <input 
                type="text" 
                className="form-control"
                value={popupData.title}
                onChange={(e) => setPopupData({ ...popupData, title: e.target.value })}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Popup Body Text</label>
              <textarea 
                className="form-control"
                rows="4"
                value={popupData.text}
                onChange={(e) => setPopupData({ ...popupData, text: e.target.value })}
                required
              ></textarea>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold">Official WhatsApp Group Link</label>
              <input 
                type="url" 
                className="form-control"
                placeholder="https://chat.whatsapp.com/..."
                value={popupData.whatsapp}
                onChange={(e) => setPopupData({ ...popupData, whatsapp: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-orange w-100 py-2.5 fw-bold">
              Save Popup Settings
            </button>
          </form>
        </div>
      )}

      {/* 6. DASHBOARD PICS */}
      {activeTab === 'dashboardPics' && (
        <div className="glass-card p-4 border-0 shadow-sm">
          <h5 className="fw-bold mb-3 text-dark">Manage Dashboard Banner Images</h5>

          <form onSubmit={handleAddBanner} className="mb-4">
            <div className="input-group">
              <input 
                type="url" 
                className="form-control"
                placeholder="Paste Image URL (e.g. ImgBB / PostImg link)"
                value={newBannerUrl}
                onChange={(e) => setNewBannerUrl(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-orange px-4 fw-bold">
                Upload / Add Pic
              </button>
            </div>
          </form>

          <div className="row g-3">
            {banners.map((url, idx) => (
              <div key={idx} className="col-12 col-md-4">
                <div className="glass-card p-2 text-center position-relative border-0 shadow-sm">
                  <img src={url} alt={`Banner ${idx}`} className="w-100 rounded-3 mb-2" style={{ height: '140px', objectFit: 'cover' }} />
                  <button className="btn btn-danger btn-sm w-100 fw-bold" onClick={() => handleDeleteBanner(idx)}>
                    <Trash2 size={16} /> Remove Banner
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. ADD PLANS & DELETE PLANS */}
      {activeTab === 'addPlans' && (
        <div className="row g-4">
          <div className="col-12 col-md-5">
            <div className="glass-card p-4 border-0 shadow-sm">
              <h5 className="fw-bold mb-3 text-dark">Add New Investment Plan</h5>
              
              <form onSubmit={handleAddPlan}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Plan Name</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="e.g. VIP Gold Package"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Price ($ USD)</label>
                  <input 
                    type="number"
                    className="form-control"
                    placeholder="e.g. 50"
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(e.target.value)}
                    required
                  />
                  {newPlanPrice > 0 && (
                    <small className="text-muted">Auto PKR: Rs {(newPlanPrice * PKR_RATE).toLocaleString()} PKR</small>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Daily Profit ($ USD)</label>
                  <input 
                    type="number"
                    step="0.1"
                    className="form-control"
                    placeholder="e.g. 4.5"
                    value={newPlanDailyProfit}
                    onChange={(e) => setNewPlanDailyProfit(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Duration (Days)</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={newPlanDuration}
                    onChange={(e) => setNewPlanDuration(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-orange w-100 py-2.5 fw-bold">
                  Create Package Plan
                </button>
              </form>
            </div>
          </div>

          <div className="col-12 col-md-7">
            <div className="glass-card p-4 border-0 shadow-sm">
              <h5 className="fw-bold mb-3 text-dark">Active System Plans ({Object.keys(plans).length})</h5>

              <div className="d-flex flex-column gap-2">
                {Object.values(plans).map(p => (
                  <div key={p.id} className="p-3 bg-white rounded-3 border d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-bold text-dark m-0">{p.name}</h6>
                      <small className="text-muted">Price: ${p.price} | Daily: ${p.dailyProfit} | {p.durationDays} Days</small>
                    </div>
                    <button className="btn btn-danger btn-sm fw-bold" onClick={() => handleDeletePlan(p.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE SOMEONE PLANS */}
      {activeTab === 'deleteUserPlans' && (
        <div className="glass-card p-4 border-0 shadow-sm max-w-600">
          <h5 className="fw-bold mb-3 text-dark">Delete User's Active Plans</h5>

          <form onSubmit={handleSearchUserForPlans} className="mb-4">
            <div className="input-group">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Enter User Email or Referral Code"
                value={searchUserKey}
                onChange={(e) => setSearchUserKey(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-orange px-4 fw-bold">
                Search User
              </button>
            </div>
          </form>

          {foundUserForPlan && (
            <div>
              <div className="p-3 bg-light rounded-3 mb-3 border">
                <h6 className="fw-bold text-dark m-0">{foundUserForPlan.name}</h6>
                <small className="text-muted">{foundUserForPlan.email} | Ref: {foundUserForPlan.referralCode}</small>
              </div>

              <h6 className="fw-bold text-dark mb-2">User's Active Purchased Plans ({foundUserActivePlans.length})</h6>
              
              {foundUserActivePlans.length === 0 ? (
                <div className="text-muted small">This user has no active plans.</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {foundUserActivePlans.map(up => (
                    <div key={up.id} className="p-3 bg-white rounded-3 border d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold text-dark m-0">{up.name}</h6>
                        <small className="text-muted">${up.price} Plan | Daily: ${up.dailyProfit}</small>
                      </div>
                      <button className="btn btn-danger btn-sm fw-bold" onClick={() => handleDeleteUserActivePlan(up.id)}>
                        Delete Plan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 9. PAYMENT INFO */}
      {activeTab === 'paymentInfo' && (
        <div className="glass-card p-4 border-0 shadow-sm max-w-600">
          <h5 className="fw-bold mb-3 text-dark">Manage Deposit Payment Info</h5>

          <form onSubmit={handleSavePaymentInfo}>
            
            <h6 className="fw-bold text-success mb-2">Easypaisa Details</h6>
            <div className="mb-2">
              <label className="form-label small">Account Title Name</label>
              <input 
                type="text" 
                className="form-control"
                value={paymentData.easypaisa?.name || ''}
                onChange={(e) => setPaymentData({ ...paymentData, easypaisa: { ...paymentData.easypaisa, name: e.target.value } })}
              />
            </div>
            <div className="mb-4">
              <label className="form-label small">Account Number</label>
              <input 
                type="text" 
                className="form-control"
                value={paymentData.easypaisa?.number || ''}
                onChange={(e) => setPaymentData({ ...paymentData, easypaisa: { ...paymentData.easypaisa, number: e.target.value } })}
              />
            </div>

            <h6 className="fw-bold text-danger mb-2">JazzCash Details</h6>
            <div className="mb-2">
              <label className="form-label small">Account Title Name</label>
              <input 
                type="text" 
                className="form-control"
                value={paymentData.jazzcash?.name || ''}
                onChange={(e) => setPaymentData({ ...paymentData, jazzcash: { ...paymentData.jazzcash, name: e.target.value } })}
              />
            </div>
            <div className="mb-4">
              <label className="form-label small">Account Number</label>
              <input 
                type="text" 
                className="form-control"
                value={paymentData.jazzcash?.number || ''}
                onChange={(e) => setPaymentData({ ...paymentData, jazzcash: { ...paymentData.jazzcash, number: e.target.value } })}
              />
            </div>

            <h6 className="fw-bold text-primary mb-2">All Bank Transfer Details</h6>
            <div className="mb-2">
              <label className="form-label small">Bank Name</label>
              <input 
                type="text" 
                className="form-control"
                value={paymentData.allBank?.bankName || ''}
                onChange={(e) => setPaymentData({ ...paymentData, allBank: { ...paymentData.allBank, bankName: e.target.value } })}
              />
            </div>
            <div className="mb-2">
              <label className="form-label small">Account Holder Name</label>
              <input 
                type="text" 
                className="form-control"
                value={paymentData.allBank?.holderName || ''}
                onChange={(e) => setPaymentData({ ...paymentData, allBank: { ...paymentData.allBank, holderName: e.target.value } })}
              />
            </div>
            <div className="mb-4">
              <label className="form-label small">Account Number / IBAN</label>
              <input 
                type="text" 
                className="form-control"
                value={paymentData.allBank?.number || ''}
                onChange={(e) => setPaymentData({ ...paymentData, allBank: { ...paymentData.allBank, number: e.target.value } })}
              />
            </div>

            <button type="submit" className="btn btn-orange w-100 py-3 fw-bold">
              Save Payment Details
            </button>
          </form>
        </div>
      )}

      {/* 10. SUPPORT LINKS */}
      {activeTab === 'supportLinks' && (
        <div className="glass-card p-4 border-0 shadow-sm max-w-600">
          <h5 className="fw-bold mb-3 text-dark">Update Support Channel Links</h5>

          <form onSubmit={handleSaveSupportLinks}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">WhatsApp Group / Support Link</label>
              <input 
                type="url" 
                className="form-control"
                value={supportData.whatsapp}
                onChange={(e) => setSupportData({ ...supportData, whatsapp: e.target.value })}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold">Telegram Channel Link</label>
              <input 
                type="url" 
                className="form-control"
                value={supportData.telegram}
                onChange={(e) => setSupportData({ ...supportData, telegram: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-orange w-100 py-2.5 fw-bold">
              Save Support Links
            </button>
          </form>
        </div>
      )}

      {/* 11. DEPOSIT HISTORY */}
      {activeTab === 'depositHistory' && (
        <div className="glass-card p-4 border-0 shadow-sm">
          <h5 className="fw-bold mb-3 text-dark">Deposit History Log ({depositsList.length})</h5>

          <div className="table-responsive">
            <table className="table table-hover align-middle small">
              <thead className="table-light">
                <tr>
                  <th>User Name</th>
                  <th>Method</th>
                  <th>Amount ($)</th>
                  <th>Trx ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {depositsList.map(d => (
                  <tr key={d.id}>
                    <td><strong className="text-dark">{d.userName}</strong><br/><small className="text-muted">{d.userEmail}</small></td>
                    <td>{d.method.toUpperCase()}</td>
                    <td className="fw-bold text-success">${d.amountUSD || d.amount}</td>
                    <td className="font-monospace">{d.trxId}</td>
                    <td>
                      <span className={`badge ${d.status === 'approved' ? 'bg-success' : d.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 12. WITHDRAWAL HISTORY */}
      {activeTab === 'withdrawalHistory' && (
        <div className="glass-card p-4 border-0 shadow-sm">
          <h5 className="fw-bold mb-3 text-dark">Withdrawal History Log ({withdrawalsList.length})</h5>

          <div className="table-responsive">
            <table className="table table-hover align-middle small">
              <thead className="table-light">
                <tr>
                  <th>User Name</th>
                  <th>Method</th>
                  <th>Account Details</th>
                  <th>Amount ($)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawalsList.map(w => (
                  <tr key={w.id}>
                    <td><strong className="text-dark">{w.userName}</strong><br/><small className="text-muted">{w.userEmail}</small></td>
                    <td>{w.method.toUpperCase()}</td>
                    <td>{w.accName} ({w.accNumber})</td>
                    <td className="fw-bold text-danger">${w.amountUSD}</td>
                    <td>
                      <span className={`badge ${w.status === 'approved' ? 'bg-success' : w.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'}`}>
                        {w.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 13. BAN USERS */}
      {activeTab === 'banUsers' && (
        <div className="glass-card p-4 border-0 shadow-sm">
          <h5 className="fw-bold mb-3 text-dark">Banned Users List</h5>

          <div className="table-responsive">
            <table className="table table-hover align-middle small">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {usersList.filter(u => u.isBanned).map(u => (
                  <tr key={u.uid}>
                    <td className="fw-bold text-dark">{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge bg-danger rounded-pill">Banned</span></td>
                    <td>
                      <button className="btn btn-sm btn-success fw-bold" onClick={() => handleToggleBanUser(u)}>
                        Unban User
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANAGE MEMBER MODAL */}
      {selectedUser && memberStats && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-modal border-0 p-4">
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark m-0">Manage User: {selectedUser.name}</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedUser(null)}></button>
              </div>

              <div className="row g-3 mb-3 text-center">
                <div className="col-4">
                  <div className="p-2.5 bg-light rounded-3">
                    <small className="text-muted d-block">Total Deposits</small>
                    <strong className="text-success fs-5">${memberStats.totalDep.toFixed(2)}</strong>
                    <small className="text-muted d-block">Rs {(memberStats.totalDep * PKR_RATE).toLocaleString()} PKR</small>
                  </div>
                </div>

                <div className="col-4">
                  <div className="p-2.5 bg-light rounded-3">
                    <small className="text-muted d-block">Total Withdrawal</small>
                    <strong className="text-danger fs-5">${memberStats.totalWith.toFixed(2)}</strong>
                    <small className="text-muted d-block">Rs {(memberStats.totalWith * PKR_RATE).toLocaleString()} PKR</small>
                  </div>
                </div>

                <div className="col-4">
                  <div className="p-2.5 bg-light rounded-3">
                    <small className="text-muted d-block">Total Team</small>
                    <strong className="text-dark fs-5">{memberStats.totalTeam} Members</strong>
                    <small className="text-muted d-block">Lv1: {memberStats.lv1Count} | Lv2: {memberStats.lv2Count} | Lv3: {memberStats.lv3Count}</small>
                  </div>
                </div>
              </div>

              {/* Adjust Balance */}
              <div className="p-3 bg-white rounded-3 border mb-3">
                <label className="form-label small fw-bold">Update Wallet Balance ($ USD)</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input 
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                  />
                  <button className="btn btn-orange px-4 fw-bold" onClick={handleUpdateMemberBalance}>
                    Save Balance
                  </button>
                </div>
              </div>

              <div className="text-end">
                <button className="btn btn-light border px-4 rounded-3" onClick={() => setSelectedUser(null)}>
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* PROOF VIEW MODAL */}
      {viewProofUrl && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1080 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content glass-modal border-0 p-3 text-center">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold m-0 text-dark">Deposit Proof Screenshot</h6>
                <button className="btn-close" onClick={() => setViewProofUrl(null)}></button>
              </div>
              <img src={viewProofUrl} alt="Proof" className="img-fluid rounded-3 max-h-500" style={{ maxHeight: '500px', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
