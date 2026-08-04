import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, Share2, UserCheck, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, MoveRight } from 'lucide-react';
import PageLoader from '../components/PageLoader';
import { db, ref, get, set } from '../firebase';

export default function AuthView({ initialMode = 'login', onAuthSuccess, onNavigate }) {
  const mode = initialMode;
  const isLogin = mode === 'login';

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralId, setReferralId] = useState('');
  const [sponsorName, setSponsorName] = useState('System Direct');
  const [fetchingSponsor, setFetchingSponsor] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralId(refCode);
      fetchSponsor(refCode);
    }
  }, []);

  const fetchSponsor = async (code) => {
    if (!code || code.trim() === '') {
      setSponsorName('System Direct');
      return;
    }
    setFetchingSponsor(true);
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await Promise.race([
        get(usersRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000))
      ]);

      if (snapshot && snapshot.exists()) {
        const users = snapshot.val();
        const sponsor = Object.values(users).find((u) => u?.referralCode === code.trim() || u?.uid === code.trim());
        if (sponsor) {
          setSponsorName(`${sponsor.name} (${String(sponsor.email || '').split('@')[0]})`);
        } else {
          setSponsorName('Invalid Sponsor Code');
        }
      } else {
        setSponsorName('System Direct');
      }
    } catch (err) {
      console.warn('Sponsor fetch fallback:', err);
      setSponsorName('System Direct');
    } finally {
      setFetchingSponsor(false);
    }
  };

  const handleReferralChange = (e) => {
    const val = e.target.value;
    setReferralId(val);
    if (val.length >= 4) {
      fetchSponsor(val);
    } else {
      setSponsorName('System Direct');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const localSaved = localStorage.getItem('successx_user');
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (parsed?.email?.toLowerCase() === loginEmail.toLowerCase().trim() && parsed?.password === loginPassword) {
          if (parsed.isBanned) {
            setError('Your account has been BANNED by Admin. Please contact support.');
            setLoading(false);
            return;
          }
          onAuthSuccess(parsed);
          onNavigate('dashboard');
          return;
        }
      }

      const usersRef = ref(db, 'users');
      const snapshot = await Promise.race([
        get(usersRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);

      let userFound = null;
      if (snapshot && snapshot.exists()) {
        const usersData = snapshot.val();
        userFound = Object.values(usersData).find(
          (u) => u?.email?.toLowerCase() === loginEmail.toLowerCase().trim() && u?.password === loginPassword
        );
      }

      if (userFound) {
        if (userFound.isBanned) {
          setError('Your account has been BANNED by Admin. Please contact support.');
          setLoading(false);
          return;
        }
        localStorage.setItem('successx_user', JSON.stringify(userFound));
        onAuthSuccess(userFound);
        onNavigate('dashboard');
      } else {
        setError('Invalid Email or Password. Please check credentials or register.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection issue detected. Your local session will still be used if available.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !mobile || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const trimmedEmail = email.toLowerCase().trim();
      const localSaved = localStorage.getItem('successx_user');
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (parsed?.email?.toLowerCase() === trimmedEmail) {
          setError('An account with this email already exists. Please sign in instead.');
          setLoading(false);
          return;
        }
      }

      const uid = 'sx_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const myReferralCode = 'SX' + Math.floor(100000 + Math.random() * 900000);

      const newUser = {
        uid,
        name: name.trim(),
        email: trimmedEmail,
        mobile,
        password,
        referralCode: myReferralCode,
        sponsorId: referralId.trim() || 'direct',
        sponsorName,
        walletBalance: 0.0,
        spinsAvailable: 0,
        rank: 'Member',
        createdAt: Date.now(),
        isBanned: false
      };

      try {
        if (db) {
          await set(ref(db, `users/${uid}`), newUser);

          const notifRef = ref(db, `notifications/${uid}/${Date.now()}`);
          await set(notifRef, {
            title: 'Welcome to SuccessX!',
            message: 'Your registration was successful. Welcome to the growth platform.',
            type: 'system',
            createdAt: Date.now(),
            read: false
          });
        }
      } catch (dbErr) {
        console.warn('DB sync warning, proceeding with session:', dbErr);
      }

      localStorage.setItem('successx_user', JSON.stringify(newUser));
      onAuthSuccess(newUser);
      onNavigate('dashboard');
    } catch (err) {
      console.error(err);
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-shell container py-4">
      <div className="auth-card glass-card p-3 p-md-4 p-lg-5">
        <div className="row g-4 align-items-stretch">
          <div className="col-lg-5">
            <div className="auth-side-panel">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill mb-3" style={{ background: 'rgba(255, 94, 0, 0.12)', color: '#ff5e00' }}>
                <Sparkles size={16} />
                <span className="fw-semibold small">{isLogin ? 'Secure Member Access' : 'Premium Onboarding'}</span>
              </div>
              <h2 className="fw-black mb-3">{isLogin ? 'Welcome back to SuccessX' : 'Open your growth account'}</h2>
              <p className="text-muted mb-4">
                {isLogin
                  ? 'Log in to continue earning, claim tasks, and manage your wallet with zero friction.'
                  : 'Create a new account in seconds and start with a modern financial growth experience.'}
              </p>
              <div className="auth-list">
                <div className="auth-list-item"><CheckCircle2 size={18} /> Instant access to your dashboard</div>
                <div className="auth-list-item"><CheckCircle2 size={18} /> Smart task, salary, and spin rewards</div>
                <div className="auth-list-item"><CheckCircle2 size={18} /> Professional support and secure data sync</div>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="auth-form-panel">
              {error && (
                <div className="alert alert-danger py-2 rounded-3 small d-flex align-items-center gap-2 mb-3">
                  <ShieldAlert size={18} />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <PageLoader text={isLogin ? 'Verifying account...' : 'Creating your account...'} />
              ) : isLogin ? (
                <form onSubmit={handleLogin}>
                  <div className="text-center mb-4">
                    <div className="auth-icon-pill">
                      <Sparkles size={26} />
                    </div>
                    <h4 className="fw-bold text-dark mb-1">Member Login</h4>
                    <small className="text-muted">Enter your credentials to unlock your dashboard</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <div className="input-shell">
                      <span className="input-icon"><Mail size={18} /></span>
                      <input type="email" placeholder="user@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold">Password</label>
                    <div className="input-shell">
                      <span className="input-icon"><Lock size={18} /></span>
                      <input type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-orange w-100 py-3 mb-3 fw-bold fs-6">
                    Continue to Dashboard <MoveRight size={18} />
                  </button>

                  <div className="text-center pt-2 border-top">
                    <span className="text-muted small">New here? </span>
                    <button type="button" className="btn btn-link p-0 text-orange fw-bold text-decoration-none small ms-1" onClick={() => onNavigate('register')}>
                      Create account
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <div className="text-center mb-4">
                    <div className="auth-icon-pill">
                      <UserCheck size={26} />
                    </div>
                    <h4 className="fw-bold text-dark mb-1">Create New Account</h4>
                    <small className="text-muted">Join SuccessX and start building your earning path</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Full Name</label>
                    <div className="input-shell">
                      <span className="input-icon"><User size={18} /></span>
                      <input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email Address</label>
                    <div className="input-shell">
                      <span className="input-icon"><Mail size={18} /></span>
                      <input type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Mobile Number</label>
                    <div className="input-shell">
                      <span className="input-icon"><Phone size={18} /></span>
                      <input type="tel" placeholder="03001234567" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Password</label>
                    <div className="input-shell">
                      <span className="input-icon"><Lock size={18} /></span>
                      <input type="password" placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Confirm Password</label>
                    <div className="input-shell">
                      <span className="input-icon"><Lock size={18} /></span>
                      <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold">Referral Code <span className="text-muted">(optional)</span></label>
                    <div className="input-shell">
                      <span className="input-icon"><Share2 size={18} /></span>
                      <input type="text" placeholder="SX123456" value={referralId} onChange={handleReferralChange} />
                    </div>
                    <small className="text-muted d-block mt-2">Sponsor: {fetchingSponsor ? 'Checking...' : sponsorName}</small>
                  </div>

                  <button type="submit" className="btn btn-orange w-100 py-3 mb-3 fw-bold fs-6">
                    Create My Account <ArrowRight size={18} />
                  </button>

                  <div className="text-center pt-2 border-top">
                    <span className="text-muted small">Already have an account? </span>
                    <button type="button" className="btn btn-link p-0 text-orange fw-bold text-decoration-none small ms-1" onClick={() => onNavigate('login')}>
                      Sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
