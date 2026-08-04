import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, AlertCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, ref, onValue, set, update, PKR_RATE } from '../firebase';

export default function WithdrawalView({ user, onNavigate, onUserUpdate }) {
  const [method, setMethod] = useState('easypaisa'); // 'easypaisa'|'jazzcash'|'nayapay'|'sadapay'|'allBank'
  const [accName, setAccName] = useState('');
  const [accNumber, setAccNumber] = useState('');
  const [amountUSD, setAmountUSD] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Admin Configured Withdrawal Rules
  const [rules, setRules] = useState({
    minWithdrawal: 5,
    taxPercent: 5,
    processingTime: '24 Hours',
    withdrawalTime: '10 AM - 10 PM'
  });

  useEffect(() => {
    const rulesRef = ref(db, 'adminConfig/withdrawalRules');
    const unsubscribe = onValue(rulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setRules(data);
    });
    return () => unsubscribe();
  }, []);

  const numAmount = Number(amountUSD) || 0;
  const taxAmount = numAmount * (rules.taxPercent / 100);
  const sendableUSD = Math.max(0, numAmount - taxAmount);
  const sendablePKR = sendableUSD * PKR_RATE;

  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    setError('');

    if (!accName.trim() || !accNumber.trim()) {
      setError('Please fill in Account Name and Account Number.');
      return;
    }

    if (numAmount < rules.minWithdrawal) {
      setError(`Minimum withdrawal amount is $${rules.minWithdrawal}.`);
      return;
    }

    if (numAmount > user.walletBalance) {
      setError(`Insufficient wallet balance! Your balance is $${user.walletBalance.toFixed(2)}.`);
      return;
    }

    setLoading(true);

    try {
      // 1. Deduct wallet balance immediately
      const newBalance = user.walletBalance - numAmount;
      await update(ref(db, `users/${user.uid}`), {
        walletBalance: newBalance
      });

      // 2. Submit Withdrawal to Firebase RTDB
      const withId = 'WITH_' + Date.now();
      const withdrawalData = {
        id: withId,
        uid: user.uid,
        userName: user.name,
        userEmail: user.email,
        method,
        accName: accName.trim(),
        accNumber: accNumber.trim(),
        amountUSD: numAmount,
        taxUSD: taxAmount,
        sendableUSD,
        sendablePKR,
        status: 'pending',
        createdAt: Date.now()
      };

      await set(ref(db, `withdrawals/${withId}`), withdrawalData);

      // Notification
      await set(ref(db, `notifications/${user.uid}/${Date.now()}`), {
        title: 'Withdrawal Requested',
        message: `Requested $${numAmount} withdrawal via ${method.toUpperCase()}. Status: Pending verification.`,
        type: 'withdrawal',
        createdAt: Date.now(),
        read: false
      });

      onUserUpdate({ ...user, walletBalance: newBalance });
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setShowSuccessModal(true);

    } catch (err) {
      console.error(err);
      setError('Withdrawal request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const accountMethods = [
    { id: 'easypaisa', name: 'Easypaisa' },
    { id: 'jazzcash', name: 'JazzCash' },
    { id: 'nayapay', name: 'NayaPay' },
    { id: 'sadapay', name: 'SadaPay' },
    { id: 'allBank', name: 'All Bank' }
  ];

  return (
    <div className="container py-2 page-shell">
      <div className="d-flex align-items-center justify-content-between mb-1">
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => onNavigate('dashboard')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h4 className="fw-bold m-0">Withdraw Funds</h4>
            <small className="text-muted">Fast processing directly to your wallet</small>
          </div>
        </div>

        <div className="px-3 py-1 bg-white rounded-pill border text-orange fw-bold small shadow-sm" style={{ color: '#ff6b00' }}>
          Available: ${user?.walletBalance.toFixed(2)}
        </div>
      </div>

      {/* ADMIN INSTRUCTION RULES CARD */}
      <div className="glass-card p-3 mb-4 bg-white border-0 shadow-sm page-hero-card">
        <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-1 small">
          <ShieldCheck size={16} className="text-orange" style={{ color: '#ff6b00' }} /> Withdrawal Instructions & Limits
        </h6>
        <div className="row g-2 text-center">
          <div className="col-3">
            <div className="bg-light p-2 rounded-3">
              <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Minimum</small>
              <strong className="text-dark small">${rules.minWithdrawal}</strong>
            </div>
          </div>
          <div className="col-3">
            <div className="bg-light p-2 rounded-3">
              <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Tax Fee</small>
              <strong className="text-dark small">{rules.taxPercent}%</strong>
            </div>
          </div>
          <div className="col-3">
            <div className="bg-light p-2 rounded-3">
              <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Time</small>
              <strong className="text-dark small">{rules.processingTime}</strong>
            </div>
          </div>
          <div className="col-3">
            <div className="bg-light p-2 rounded-3">
              <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Hours</small>
              <strong className="text-dark small">{rules.withdrawalTime}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="glass-card p-4 page-hero-card">
        
        <form onSubmit={handleSubmitWithdrawal}>
          {error && (
            <div className="alert alert-danger py-2 rounded-3 small mb-3">
              {error}
            </div>
          )}

          <h6 className="fw-bold text-dark mb-2">1. Choose Account Channel</h6>
          <div className="d-flex flex-wrap gap-2 mb-4">
            {accountMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${method === m.id ? 'btn-orange' : 'btn-outline-secondary'}`}
                onClick={() => setMethod(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>

          <h6 className="fw-bold text-dark mb-2">2. Enter Account Details</h6>
          <div className="mb-3">
            <label className="form-label small fw-semibold">Account Title / Name</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="e.g. John Doe"
              value={accName}
              onChange={(e) => setAccName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold">Account / IBAN / Phone Number</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="e.g. 03001234567"
              value={accNumber}
              onChange={(e) => setAccNumber(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold">Withdrawal Amount ($ USD)</label>
            <div className="input-group input-group-lg mb-2">
              <span className="input-group-text bg-white fw-bold">$</span>
              <input 
                type="number" 
                min={rules.minWithdrawal}
                step="0.1"
                className="form-control fw-bold fs-4"
                placeholder={`Min $${rules.minWithdrawal}`}
                value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                required
              />
            </div>

            {/* Calculations Box */}
            {numAmount > 0 && (
              <div className="p-3 bg-light rounded-4 border">
                <div className="d-flex justify-content-between small py-1">
                  <span className="text-muted">Withdrawal Amount:</span>
                  <strong className="text-dark">${numAmount.toFixed(2)}</strong>
                </div>
                <div className="d-flex justify-content-between small py-1">
                  <span className="text-muted">Deducted Tax ({rules.taxPercent}%):</span>
                  <strong className="text-danger">-${taxAmount.toFixed(2)}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-top mt-1">
                  <span className="fw-bold text-dark">You Will Receive (PKR):</span>
                  <strong className="fw-bold text-orange fs-5" style={{ color: '#ff6b00' }}>
                    Rs {sendablePKR.toLocaleString()} PKR
                  </strong>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="btn btn-orange w-100 py-3 fw-bold fs-6"
            disabled={loading}
          >
            {loading ? 'Processing Withdrawal...' : 'Submit Withdrawal Request'}
          </button>
        </form>

      </div>

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-modal border-0 p-4 text-center">
              
              <div className="mx-auto rounded-circle bg-success text-white d-flex align-items-center justify-content-center mb-3 shadow" style={{ width: 70, height: 70 }}>
                <Check size={40} />
              </div>

              <h4 className="fw-bold text-dark mb-2">Withdrawal Submitted!</h4>
              <p className="text-muted small mb-4">
                Your request of <strong>${numAmount} (Rs {sendablePKR.toLocaleString()} PKR)</strong> has been submitted. Wallet balance has been updated.
              </p>

              <button 
                className="btn btn-orange w-100 py-3 fw-bold"
                onClick={() => onNavigate('record')}
              >
                See Withdrawal Record
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
