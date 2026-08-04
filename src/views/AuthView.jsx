import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, Share2, UserCheck, ArrowRight, ShieldAlert } from 'lucide-react';
import { db, ref, get, set } from '../firebase';

export default function AuthView({ initialMode = 'login', onAuthSuccess, onNavigate }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
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

  // Check URL params for referral code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      setReferralId(refCode);
      fetchSponsor(refCode);
    }
  }, []);

  // Fetch Sponsor Name automatically when referralId changes
  const fetchSponsor = async (code) => {
    if (!code || code.trim() === '') {
      setSponsorName('System Direct');
      return;
    }
    setFetchingSponsor(true);
    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        const sponsor = Object.values(users).find(u => u.referralCode === code.trim() || u.uid === code.trim());
        if (sponsor) {
          setSponsorName(sponsor.name + ` (${sponsor.email.split('@')[0]})`);
        } else {
          setSponsorName('Invalid Sponsor Code');
        }
      } else {
        setSponsorName('System Direct');
      }
    } catch (err) {
      console.error('Error fetching sponsor:', err);
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
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const userFound = Object.values(usersData).find(
          u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.password === loginPassword
        );

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
      } else {
        setError('No users registered yet. Please create an account.');
      }
    } catch (err) {
      console.error(err);
      setError('Login error. Please try again.');
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

    setLoading(true);

    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const exists = Object.values(usersData).some(
          u => u.email.toLowerCase() === email.toLowerCase()
        );
        if (exists) {
          setError('An account with this email already exists! Please Login.');
          setLoading(false);
          return;
        }
      }

      // Generate unique UID & Referral Code
      const uid = 'sx_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
      const myReferralCode = 'SX' + Math.floor(100000 + Math.random() * 900000);

      const newUser = {
        uid,
        name,
        email: email.toLowerCase(),
        mobile,
        password,
        referralCode: myReferralCode,
        sponsorId: referralId.trim() || 'direct',
        sponsorName: sponsorName,
        walletBalance: 0.00,
        spinsAvailable: 0,
        rank: 'Member',
        createdAt: Date.now(),
        isBanned: false
      };

      await set(ref(db, `users/${uid}`), newUser);

      // Create notification
      const notifRef = ref(db, `notifications/${uid}/${Date.now()}`);
      await set(notifRef, {
        title: 'Welcome to SuccessX!',
        message: 'Your registration was successful. Welcome to the growth platform.',
        type: 'system',
        createdAt: Date.now(),
        read: false
      });

      localStorage.setItem('successx_user', JSON.stringify(newUser));
      onAuthSuccess(newUser);
      onNavigate('dashboard');
    } catch (err) {
      console.error(err);
      setError('Registration failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <div className="glass-card p-4 shadow-lg border-0">
            
            {/* Header Switcher */}
            <div className="d-flex justify-content-center gap-2 mb-4 bg-light p-1 rounded-pill" style={{ background: 'rgba(255, 107, 0, 0.08)' }}>
              <button 
                className={`btn btn-sm flex-fill rounded-pill py-2 fw-semibold ${mode === 'login' ? 'btn-orange' : 'btn-light border-0'}`}
                onClick={() => { setMode('login'); setError(''); }}
              >
                Login
              </button>
              <button 
                className={`btn btn-sm flex-fill rounded-pill py-2 fw-semibold ${mode === 'register' ? 'btn-orange' : 'btn-light border-0'}`}
                onClick={() => { setMode('register'); setError(''); }}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="alert alert-danger py-2 rounded-3 small d-flex align-items-center gap-2">
                <ShieldAlert size={18} />
                <span>{error}</span>
              </div>
            )}

            {mode === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLogin}>
                <h4 className="fw-bold text-dark mb-1">Welcome Back!</h4>
                <p className="text-muted small mb-4">Login to access your wallet, plans, & tasks.</p>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><Mail size={18} className="text-muted" /></span>
                    <input 
                      type="email" 
                      className="form-control border-start-0"
                      placeholder="user@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><Lock size={18} className="text-muted" /></span>
                    <input 
                      type="password" 
                      className="form-control border-start-0"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-orange w-100 py-3 mb-3 fw-bold" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login to Account'}
                </button>

                <div className="text-center">
                  <span className="text-muted small">Don't have an account? </span>
                  <button type="button" className="btn btn-link p-0 text-orange fw-bold text-decoration-none small" onClick={() => { setMode('register'); setError(''); }}>
                    Register Here
                  </button>
                </div>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegister}>
                <h4 className="fw-bold text-dark mb-1">Create Account</h4>
                <p className="text-muted small mb-3">Join SuccessX and start earning daily.</p>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Full Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><User size={18} className="text-muted" /></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><Mail size={18} className="text-muted" /></span>
                    <input 
                      type="email" 
                      className="form-control border-start-0"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Mobile Number</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><Phone size={18} className="text-muted" /></span>
                    <input 
                      type="tel" 
                      className="form-control border-start-0"
                      placeholder="03001234567"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><Lock size={18} className="text-muted" /></span>
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

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Confirm Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><Lock size={18} className="text-muted" /></span>
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

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Referral ID (Optional)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><Share2 size={18} className="text-muted" /></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0"
                      placeholder="e.g. SX123456"
                      value={referralId}
                      onChange={handleReferralChange}
                    />
                  </div>
                </div>

                {/* Auto Fetch Sponsor Name */}
                <div className="mb-4 p-2 bg-light rounded-3 d-flex align-items-center justify-content-between border">
                  <span className="small text-muted d-flex align-items-center gap-1">
                    <UserCheck size={16} className="text-orange" style={{ color: '#ff6b00' }} /> Sponsor:
                  </span>
                  <span className="small fw-bold text-dark">
                    {fetchingSponsor ? 'Fetching Sponsor...' : sponsorName}
                  </span>
                </div>

                <button type="submit" className="btn btn-orange w-100 py-3 mb-3 fw-bold" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Register Now'}
                </button>

                <div className="text-center">
                  <span className="text-muted small">Already have an account? </span>
                  <button type="button" className="btn btn-link p-0 text-orange fw-bold text-decoration-none small" onClick={() => { setMode('login'); setError(''); }}>
                    Login Here
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
