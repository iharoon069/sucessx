import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { db, ref, onValue, PKR_RATE } from '../firebase';

export default function RecordView({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('deposit'); // 'deposit'|'withdrawal'|'salary'|'dailyProfit'
  
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [dailyProfits, setDailyProfits] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Listen to Deposits
    const depRef = ref(db, 'deposits');
    const unsubDep = onValue(depRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userDeps = Object.values(data).filter(d => d.uid === user.uid);
        userDeps.sort((a, b) => b.createdAt - a.createdAt);
        setDeposits(userDeps);
      } else {
        setDeposits([]);
      }
    });

    // Listen to Withdrawals
    const withRef = ref(db, 'withdrawals');
    const unsubWith = onValue(withRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userWiths = Object.values(data).filter(w => w.uid === user.uid);
        userWiths.sort((a, b) => b.createdAt - a.createdAt);
        setWithdrawals(userWiths);
      } else {
        setWithdrawals([]);
      }
    });

    // Listen to Salaries
    const salRef = ref(db, `salaryLogs/${user.uid}`);
    const unsubSal = onValue(salRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data);
        list.sort((a, b) => b.createdAt - a.createdAt);
        setSalaries(list);
      } else {
        setSalaries([]);
      }
    });

    // Listen to Daily Profits
    const profRef = ref(db, `dailyProfits/${user.uid}`);
    const unsubProf = onValue(profRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data);
        list.sort((a, b) => b.createdAt - a.createdAt);
        setDailyProfits(list);
      } else {
        setDailyProfits([]);
      }
    });

    return () => {
      unsubDep();
      unsubWith();
      unsubSal();
      unsubProf();
    };
  }, [user]);

  const formatDate = (ts) => {
    if (!ts) return '01.03.2026 7:08pm';
    const d = new Date(ts);
    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${dateStr} ${timeStr}`;
  };

  const renderStatusBadge = (status) => {
    if (status === 'pending') {
      return <span className="badge-pending d-inline-flex align-items-center gap-1"><Clock size={12} /> Pending</span>;
    }
    if (status === 'approved' || status === 'success') {
      return <span className="badge-approved d-inline-flex align-items-center gap-1"><CheckCircle2 size={12} /> Success</span>;
    }
    return <span className="badge-rejected d-inline-flex align-items-center gap-1"><XCircle size={12} /> Rejected</span>;
  };

  return (
    <div className="container py-2 page-shell">
      <div className="d-flex align-items-center gap-3 mb-1">
        <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h4 className="fw-bold m-0">Transaction Records</h4>
          <small className="text-muted">History of all transactions & earnings</small>
        </div>
      </div>

      {/* TABS */}
      <div className="d-flex overflow-x-auto gap-2 mb-4 pb-2 border-bottom page-soft-pill" style={{ background: 'transparent', border: '0' }}>
        <button 
          className={`btn btn-sm rounded-pill px-3 py-2 fw-bold text-nowrap ${activeTab === 'deposit' ? 'btn-orange' : 'btn-light'}`}
          onClick={() => setActiveTab('deposit')}
        >
          Deposits ({deposits.length})
        </button>
        <button 
          className={`btn btn-sm rounded-pill px-3 py-2 fw-bold text-nowrap ${activeTab === 'withdrawal' ? 'btn-orange' : 'btn-light'}`}
          onClick={() => setActiveTab('withdrawal')}
        >
          Withdrawals ({withdrawals.length})
        </button>
        <button 
          className={`btn btn-sm rounded-pill px-3 py-2 fw-bold text-nowrap ${activeTab === 'salary' ? 'btn-orange' : 'btn-light'}`}
          onClick={() => setActiveTab('salary')}
        >
          Salary ({salaries.length})
        </button>
        <button 
          className={`btn btn-sm rounded-pill px-3 py-2 fw-bold text-nowrap ${activeTab === 'dailyProfit' ? 'btn-orange' : 'btn-light'}`}
          onClick={() => setActiveTab('dailyProfit')}
        >
          Daily Profit ({dailyProfits.length})
        </button>
      </div>

      {/* RECORD ITEMS */}
      {activeTab === 'deposit' && (
        <div className="d-flex flex-column gap-3">
          {deposits.length === 0 ? (
            <div className="glass-card p-4 text-center text-muted small">No deposit records found.</div>
          ) : (
            deposits.map((item) => (
              <div key={item.id} className="glass-card p-3 border-0 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    {renderStatusBadge(item.status)}
                    <span className="text-muted small ms-2 fw-semibold">Method: {item.method.toUpperCase()}</span>
                  </div>
                  <strong className="text-success fs-5 fw-extrabold">+${item.amountUSD || item.amount}</strong>
                </div>

                <div className="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
                  <div>
                    Order ID: <span className="text-dark fw-bold">{item.id.replace('DEP_', '1000')}</span>
                  </div>
                  <div>
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'withdrawal' && (
        <div className="d-flex flex-column gap-3">
          {withdrawals.length === 0 ? (
            <div className="glass-card p-4 text-center text-muted small">No withdrawal records found.</div>
          ) : (
            withdrawals.map((item) => (
              <div key={item.id} className="glass-card p-3 border-0 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    {renderStatusBadge(item.status)}
                    <span className="text-muted small ms-2 fw-semibold">Account: {item.accNumber}</span>
                  </div>
                  <strong className="text-danger fs-5 fw-extrabold">-${item.amountUSD}</strong>
                </div>

                <div className="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
                  <div>
                    Order ID: <span className="text-dark fw-bold">{item.id.replace('WITH_', '2000')}</span>
                  </div>
                  <div>
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'salary' && (
        <div className="d-flex flex-column gap-3">
          {salaries.length === 0 ? (
            <div className="glass-card p-4 text-center text-muted small">No weekly salary claims yet.</div>
          ) : (
            salaries.map((item) => (
              <div key={item.id} className="glass-card p-3 border-0 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    {renderStatusBadge('approved')}
                    <span className="text-muted small ms-2 fw-semibold">{item.tierName || 'Weekly Salary'}</span>
                  </div>
                  <strong className="text-success fs-5 fw-extrabold">+${item.amount}</strong>
                </div>

                <div className="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
                  <div>
                    Order ID: <span className="text-dark fw-bold">{item.id.replace('SAL_', '3000')}</span>
                  </div>
                  <div>
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'dailyProfit' && (
        <div className="d-flex flex-column gap-3">
          {dailyProfits.length === 0 ? (
            <div className="glass-card p-4 text-center text-muted small">No daily profit task claims yet.</div>
          ) : (
            dailyProfits.map((item) => (
              <div key={item.id} className="glass-card p-3 border-0 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    {renderStatusBadge('approved')}
                    <span className="text-muted small ms-2 fw-semibold">{item.planName}</span>
                  </div>
                  <strong className="text-success fs-5 fw-extrabold">+${item.amount}</strong>
                </div>

                <div className="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
                  <div>
                    Order ID: <span className="text-dark fw-bold">{item.id.replace('REC_', '4000')}</span>
                  </div>
                  <div>
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
