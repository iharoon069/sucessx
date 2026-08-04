import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AdminSecretModal from './components/AdminSecretModal';

import LandingView from './views/LandingView';
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import DepositView from './views/DepositView';
import BuyPlansView from './views/BuyPlansView';
import TaskView from './views/TaskView';
import WithdrawalView from './views/WithdrawalView';
import RecordView from './views/RecordView';
import SpinView from './views/SpinView';
import BonusView from './views/BonusView';
import SalaryView from './views/SalaryView';
import InviteView from './views/InviteView';
import SupportView from './views/SupportView';
import FaqView from './views/FaqView';
import NotificationsView from './views/NotificationsView';
import ProfileView from './views/ProfileView';
import AdminView from './views/AdminView';

import { db, ref, onValue } from './firebase';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('successx_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('successx_admin');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    const savedAdmin = localStorage.getItem('successx_admin');
    const savedUser = localStorage.getItem('successx_user');
    if (savedAdmin) return 'admin';
    if (savedUser) return 'dashboard';
    return 'landing';
  });

  const [showAdminSecretModal, setShowAdminSecretModal] = useState(false);

  // Live Sync User Data from Realtime DB
  useEffect(() => {
    if (!user || !user.uid) return;
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        if (data.isBanned) {
          alert('Your account has been banned by admin.');
          handleLogoutUser();
          return;
        }
        setUser(data);
        localStorage.setItem('successx_user', JSON.stringify(data));
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('successx_user', JSON.stringify(userData));
    setActiveTab('dashboard');
  };

  const handleAdminSuccess = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem('successx_admin', JSON.stringify(adminData));
    setActiveTab('admin');
  };

  const handleLogoutUser = () => {
    localStorage.removeItem('successx_user');
    setUser(null);
    setActiveTab('landing');
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('successx_admin');
    setAdmin(null);
    setActiveTab('landing');
  };

  const handleNavigate = (tabId) => {
    // Auth protection for internal features
    if (!user && ['dashboard', 'deposit', 'buy-plans', 'task', 'withdrawal', 'record', 'spin', 'bonus', 'salary', 'invite', 'profile', 'notifications'].includes(tabId)) {
      setActiveTab('login');
      return;
    }
    setActiveTab(tabId);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'linear-gradient(135deg, #fff7f0 0%, #ffefe0 50%, #fffaed 100%)' }}>
      
      {/* Header (Show everywhere except Admin panel) */}
      {activeTab !== 'admin' && (
        <Header 
          user={user} 
          onNavigate={handleNavigate}
          onOpenAdminSecret={() => setShowAdminSecretModal(true)}
        />
      )}

      {/* Main Content Router */}
      <main className="flex-grow-1">
        {activeTab === 'landing' && <LandingView onNavigate={handleNavigate} />}
        {activeTab === 'login' && <AuthView initialMode="login" onAuthSuccess={handleAuthSuccess} onNavigate={handleNavigate} />}
        {activeTab === 'register' && <AuthView initialMode="register" onAuthSuccess={handleAuthSuccess} onNavigate={handleNavigate} />}
        
        {activeTab === 'dashboard' && <DashboardView user={user} onNavigate={handleNavigate} />}
        {activeTab === 'deposit' && <DepositView user={user} onNavigate={handleNavigate} />}
        {activeTab === 'buy-plans' && <BuyPlansView user={user} onNavigate={handleNavigate} onUserUpdate={setUser} />}
        {activeTab === 'task' && <TaskView user={user} onNavigate={handleNavigate} onUserUpdate={setUser} />}
        {activeTab === 'withdrawal' && <WithdrawalView user={user} onNavigate={handleNavigate} onUserUpdate={setUser} />}
        {activeTab === 'record' && <RecordView user={user} onNavigate={handleNavigate} />}
        {activeTab === 'spin' && <SpinView user={user} onNavigate={handleNavigate} onUserUpdate={setUser} />}
        {activeTab === 'bonus' && <BonusView user={user} onNavigate={handleNavigate} onUserUpdate={setUser} />}
        {activeTab === 'salary' && <SalaryView user={user} onNavigate={handleNavigate} onUserUpdate={setUser} />}
        {activeTab === 'invite' && <InviteView user={user} onNavigate={handleNavigate} />}
        {activeTab === 'support' && <SupportView onNavigate={handleNavigate} />}
        {activeTab === 'faq' && <FaqView onNavigate={handleNavigate} />}
        {activeTab === 'notifications' && <NotificationsView user={user} onNavigate={handleNavigate} />}
        {activeTab === 'profile' && <ProfileView user={user} onNavigate={handleNavigate} onLogout={handleLogoutUser} />}
        
        {activeTab === 'admin' && <AdminView admin={admin} onLogoutAdmin={handleLogoutAdmin} onNavigate={handleNavigate} />}
      </main>

      {/* Bottom Nav Bar (Show on logged in user main screens) */}
      {user && activeTab !== 'admin' && (
        <BottomNav activeTab={activeTab} onNavigate={handleNavigate} />
      )}

      {/* Secret Key Entrance Modal for Admin */}
      <AdminSecretModal 
        show={showAdminSecretModal}
        onClose={() => setShowAdminSecretModal(false)}
        onAdminSuccess={handleAdminSuccess}
      />

    </div>
  );
}
