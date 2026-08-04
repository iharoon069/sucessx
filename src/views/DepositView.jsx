import React, { useState, useEffect } from 'react';
import { ArrowLeft, Copy, Check, UploadCloud, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { db, ref, onValue, set, PKR_RATE, IMGBB_API_KEY } from '../firebase';

export default function DepositView({ user, onNavigate }) {
  const [step, setStep] = useState(1); // 1: Method & Amount, 2: Payment Details & Submit
  const [selectedMethod, setSelectedMethod] = useState(''); // 'easypaisa' | 'jazzcash' | 'allBank'
  const [amountUSD, setAmountUSD] = useState(10);
  const [trxId, setTrxId] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Admin Payment Accounts from DB
  const [paymentInfo, setPaymentInfo] = useState({
    easypaisa: { name: 'SuccessX Official', number: '03001234567' },
    jazzcash: { name: 'SuccessX Official', number: '03099887766' },
    allBank: { bankName: 'Meezan Bank', holderName: 'SuccessX Global', number: '01010101010101' }
  });

  useEffect(() => {
    const paymentRef = ref(db, 'adminConfig/paymentInfo');
    const unsubscribe = onValue(paymentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setPaymentInfo(data);
    });
    return () => unsubscribe();
  }, []);

  const pkrAmount = amountUSD * PKR_RATE;

  const preAmounts = [5, 10, 20, 50, 100, 200, 500];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    setError('');

    if (!trxId.trim()) {
      setError('Please enter valid Transaction ID (Trx ID).');
      return;
    }
    if (!imageFile) {
      setError('Please attach deposit screenshot proof.');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload proof screenshot to ImgBB
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      let proofUrl = '';
      if (result.success) {
        proofUrl = result.data.url;
      } else {
        // Fallback placeholder if ImgBB fails
        proofUrl = imagePreview || 'https://via.placeholder.com/400x300?text=Deposit+Proof';
      }

      // 2. Save Deposit to Firebase RTDB
      const depId = 'DEP_' + Date.now();
      const depositData = {
        id: depId,
        uid: user.uid,
        userName: user.name,
        userEmail: user.email,
        method: selectedMethod,
        amountUSD: Number(amountUSD),
        amountPKR: pkrAmount,
        trxId: trxId.trim(),
        proofUrl: proofUrl,
        status: 'pending',
        createdAt: Date.now()
      };

      await set(ref(db, `deposits/${depId}`), depositData);

      // Notification
      const notifId = Date.now();
      await set(ref(db, `notifications/${user.uid}/${notifId}`), {
        title: 'Deposit Submitted',
        message: `Your deposit request of $${amountUSD} (${pkrAmount} PKR) via ${selectedMethod} has been submitted for verification.`,
        type: 'deposit',
        createdAt: Date.now(),
        read: false
      });

      // Confetti celebration
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setShowSuccessModal(true);

    } catch (err) {
      console.error(err);
      setError('Failed to upload proof or submit deposit. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getActiveAccount = () => {
    if (selectedMethod === 'easypaisa') return paymentInfo.easypaisa;
    if (selectedMethod === 'jazzcash') return paymentInfo.jazzcash;
    if (selectedMethod === 'allBank') return paymentInfo.allBank;
    return {};
  };

  return (
    <div className="container py-2">
      
      {/* Top Header */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => step === 2 ? setStep(1) : onNavigate('dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h4 className="fw-bold m-0">Deposit Funds</h4>
          <small className="text-muted">Instant conversion at 1$ = {PKR_RATE} PKR</small>
        </div>
      </div>

      {step === 1 ? (
        /* STEP 1: Select Method & Amount */
        <div className="glass-card p-4">
          
          <h6 className="fw-bold mb-3 text-dark">1. Select Payment Method</h6>
          <div className="row g-3 mb-4">
            
            <div className="col-4">
              <div 
                className={`p-3 rounded-4 text-center cursor-pointer border transition-all ${selectedMethod === 'easypaisa' ? 'border-2 border-orange bg-orange-subtle shadow' : 'bg-white'}`}
                style={{ borderColor: selectedMethod === 'easypaisa' ? '#ff6b00' : 'rgba(0,0,0,0.08)', cursor: 'pointer' }}
                onClick={() => setSelectedMethod('easypaisa')}
              >
                <div className="fw-bold text-success mb-1" style={{ fontSize: '0.95rem' }}>Easypaisa</div>
                <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Mobile Wallet</small>
              </div>
            </div>

            <div className="col-4">
              <div 
                className={`p-3 rounded-4 text-center cursor-pointer border transition-all ${selectedMethod === 'jazzcash' ? 'border-2 border-orange bg-orange-subtle shadow' : 'bg-white'}`}
                style={{ borderColor: selectedMethod === 'jazzcash' ? '#ff6b00' : 'rgba(0,0,0,0.08)', cursor: 'pointer' }}
                onClick={() => setSelectedMethod('jazzcash')}
              >
                <div className="fw-bold text-danger mb-1" style={{ fontSize: '0.95rem' }}>JazzCash</div>
                <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Mobile Wallet</small>
              </div>
            </div>

            <div className="col-4">
              <div 
                className={`p-3 rounded-4 text-center cursor-pointer border transition-all ${selectedMethod === 'allBank' ? 'border-2 border-orange bg-orange-subtle shadow' : 'bg-white'}`}
                style={{ borderColor: selectedMethod === 'allBank' ? '#ff6b00' : 'rgba(0,0,0,0.08)', cursor: 'pointer' }}
                onClick={() => setSelectedMethod('allBank')}
              >
                <div className="fw-bold text-primary mb-1" style={{ fontSize: '0.95rem' }}>All Bank</div>
                <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Bank Transfer</small>
              </div>
            </div>

          </div>

          <h6 className="fw-bold mb-2 text-dark">2. Select / Enter Amount ($ USD)</h6>
          
          {/* Quick Pre-select buttons */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            {preAmounts.map(amt => (
              <button 
                key={amt} 
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold ${amountUSD === amt ? 'btn-orange' : 'btn-outline-secondary'}`}
                onClick={() => setAmountUSD(amt)}
              >
                ${amt}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <div className="input-group input-group-lg">
              <span className="input-group-text bg-white fw-bold">$</span>
              <input 
                type="number" 
                min="1"
                className="form-control fw-bold fs-4" 
                value={amountUSD}
                onChange={(e) => setAmountUSD(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <div className="mt-2 p-2 bg-light rounded-3 d-flex justify-content-between align-items-center">
              <span className="text-muted small">Sendable Amount in PKR:</span>
              <span className="fw-bold text-orange fs-5" style={{ color: '#ff6b00' }}>Rs {pkrAmount.toLocaleString()} PKR</span>
            </div>
          </div>

          <button 
            className="btn btn-orange w-100 py-3 fw-bold fs-6 d-flex align-items-center justify-content-center gap-2"
            disabled={!selectedMethod || amountUSD < 1}
            onClick={() => setStep(2)}
          >
            Continue Payment <ArrowRight size={20} />
          </button>

        </div>
      ) : (
        /* STEP 2: Instructions & TRX Proof */
        <div className="glass-card p-4">
          
          {/* Amount Badge */}
          <div className="text-center p-3 rounded-4 bg-orange text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #ff6b00, #ff8c00)' }}>
            <small className="text-white-50 text-uppercase fw-bold">Required Deposit Amount</small>
            <h2 className="fw-extrabold m-0">Rs {pkrAmount.toLocaleString()} PKR</h2>
            <small className="text-white fw-semibold">(${amountUSD} USD equivalent)</small>
          </div>

          {/* Account Details Box */}
          <div className="p-3 bg-white rounded-4 border mb-4 shadow-sm">
            <h6 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
              <ShieldCheck size={18} className="text-success" /> Official {selectedMethod.toUpperCase()} Account Details
            </h6>

            {selectedMethod === 'allBank' && (
              <div className="mb-2">
                <span className="text-muted small">Bank Name: </span>
                <strong className="text-dark">{getActiveAccount().bankName || 'Bank'}</strong>
              </div>
            )}

            <div className="mb-2">
              <span className="text-muted small">Account Name: </span>
              <strong className="text-dark">{getActiveAccount().holderName || getActiveAccount().name || 'SuccessX'}</strong>
            </div>

            <div className="d-flex align-items-center justify-content-between p-2.5 bg-light rounded-3 border">
              <div>
                <small className="text-muted d-block">Account / Number</small>
                <span className="fw-bold text-dark fs-5">{getActiveAccount().number || '03000000000'}</span>
              </div>
              <button 
                className="btn btn-orange-outline btn-sm d-flex align-items-center gap-1"
                onClick={() => handleCopy(getActiveAccount().number)}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Form: Trx ID & Screenshot Upload */}
          <form onSubmit={handleSubmitDeposit}>
            {error && (
              <div className="alert alert-danger py-2 rounded-3 small mb-3">
                {error}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label small fw-bold">Transaction ID (Trx ID / TID)</label>
              <input 
                type="text"
                className="form-control form-control-lg fs-6"
                placeholder="Enter 11-12 digit TRX ID"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold">Upload Payment Screenshot Proof</label>
              <div className="border border-2 border-dashed rounded-4 p-3 text-center bg-white cursor-pointer" style={{ borderColor: 'rgba(255,107,0,0.3)' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="d-none" 
                  id="screenshotFile"
                  onChange={handleImageChange}
                />
                <label htmlFor="screenshotFile" className="w-100 m-0 cursor-pointer">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Proof" className="img-fluid rounded-3 max-h-200" style={{ maxHeight: '180px' }} />
                  ) : (
                    <div className="py-3">
                      <UploadCloud size={36} className="text-orange mb-2" style={{ color: '#ff6b00' }} />
                      <div className="fw-bold text-dark small">Click to Choose Screenshot</div>
                      <small className="text-muted">Supports JPG, PNG (ImgBB Upload)</small>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-orange w-100 py-3 fw-bold fs-6"
              disabled={uploading}
            >
              {uploading ? 'Uploading & Submitting...' : 'Submit Deposit Request'}
            </button>
          </form>

        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-modal border-0 p-4 text-center">
              
              <div className="mx-auto rounded-circle bg-success text-white d-flex align-items-center justify-content-center mb-3 shadow" style={{ width: 70, height: 70 }}>
                <Check size={40} />
              </div>

              <h4 className="fw-bold text-dark mb-2">Deposit Submitted Successfully!</h4>
              <p className="text-muted small mb-4">
                Your deposit request of <strong>${amountUSD} ({pkrAmount} PKR)</strong> has been submitted. Wallet balance will be added automatically once approved by admin.
              </p>

              <button 
                className="btn btn-orange w-100 py-3 fw-bold"
                onClick={() => onNavigate('record')}
              >
                See Deposit Record
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
