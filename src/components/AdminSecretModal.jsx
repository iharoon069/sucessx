import React, { useState } from 'react';
import { KeyRound, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { db, ref, get, set } from '../firebase';

export default function AdminSecretModal({ show, onClose, onAdminSuccess }) {
  const [step, setStep] = useState('key'); // 'key' | 'auth'
  const [secretKey, setSecretKey] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  const handleVerifySecretKey = (e) => {
    e.preventDefault();
    setError('');
    if (secretKey === '10691069') {
      setStep('auth');
    } else {
      setError('Invalid Secret Key! Please enter valid admin security key.');
    }
  };

  const handleAdminAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!email || !password) {
          setError('Please fill in all fields.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        const adminUid = 'admin_' + btoa(email).replace(/=/g, '');
        const adminRef = ref(db, `admins/${adminUid}`);
        
        await set(adminRef, {
          email,
          password,
          role: 'firebase_admin',
          createdAt: Date.now()
        });

        const adminObj = { uid: adminUid, email, role: 'firebase_admin' };
        localStorage.setItem('successx_admin', JSON.stringify(adminObj));
        onAdminSuccess(adminObj);
        onClose();
      } else {
        // Login
        const adminsRef = ref(db, 'admins');
        const snapshot = await get(adminsRef);
        
        if (snapshot.exists()) {
          const adminsData = snapshot.val();
          const adminFound = Object.values(adminsData).find(
            a => a.email.toLowerCase() === email.toLowerCase() && a.password === password
          );

          if (adminFound) {
            const adminObj = { uid: adminFound.email, email: adminFound.email, role: 'firebase_admin' };
            localStorage.setItem('successx_admin', JSON.stringify(adminObj));
            onAdminSuccess(adminObj);
            onClose();
          } else {
            // Default fallback if admin not created yet but secret key correct
            if (email === 'admin@successx.com' && password === 'admin123') {
              const adminObj = { uid: 'default_admin', email: 'admin@successx.com', role: 'firebase_admin' };
              localStorage.setItem('successx_admin', JSON.stringify(adminObj));
              onAdminSuccess(adminObj);
              onClose();
            } else {
              setError('Invalid Admin credentials! Create an account if you haven\'t already.');
            }
          }
        } else {
          // No admin exists yet
          if (email === 'admin@successx.com' && password === 'admin123') {
            const adminObj = { uid: 'default_admin', email: 'admin@successx.com', role: 'firebase_admin' };
            localStorage.setItem('successx_admin', JSON.stringify(adminObj));
            onAdminSuccess(adminObj);
            onClose();
          } else {
            setError('No admin account found. Please register first using Secret Key.');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during admin authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content glass-modal border-0 p-3 shadow-lg">
          
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-2">
              <div className="p-2 rounded-circle bg-orange text-white" style={{ background: '#ff6b00' }}>
                <ShieldCheck size={24} />
              </div>
              <h5 className="modal-title fw-bold">Admin Portal Access</h5>
            </div>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body pt-3">
            {error && (
              <div className="alert alert-danger py-2 rounded-3 small">
                {error}
              </div>
            )}

            {step === 'key' ? (
              <form onSubmit={handleVerifySecretKey}>
                <p className="text-muted small">Enter the Secret Key to unlock Admin Panel controls.</p>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Secret Key</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <KeyRound size={18} className="text-orange" style={{ color: '#ff6b00' }} />
                    </span>
                    <input 
                      type="password" 
                      className="form-control border-start-0" 
                      placeholder="Enter 8-digit secret key"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-orange w-100 d-flex align-items-center justify-content-center gap-2">
                  Verify Key <ArrowRight size={18} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleAdminAuth}>
                <h6 className="fw-bold mb-3">
                  {isRegister ? 'Create Admin Account' : 'Admin Login'}
                </h6>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Admin Email</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><Mail size={18} /></span>
                    <input 
                      type="email" 
                      className="form-control border-start-0"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><Lock size={18} /></span>
                    <input 
                      type="password" 
                      className="form-control border-start-0"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {isRegister && (
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Re-enter Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white border-end-0"><Lock size={18} /></span>
                      <input 
                        type="password" 
                        className="form-control border-start-0"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn-orange w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : isRegister ? 'Create Admin Account' : 'Login to Admin Panel'}
                </button>

                <div className="text-center">
                  <button 
                    type="button" 
                    className="btn btn-link text-decoration-none small text-orange"
                    onClick={() => { setIsRegister(!isRegister); setError(''); }}
                  >
                    {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
