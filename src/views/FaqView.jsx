import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, HelpCircle, Search } from 'lucide-react';

export default function FaqView({ onNavigate }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [search, setSearch] = useState('');

  const faqs = [
    { q: "What is SuccessX?", a: "SuccessX is a modern financial ecosystem where users can buy investment plans, complete daily tasks, participate in lucky spins, claim weekly salaries, and earn 3-tier downline referral commissions." },
    { q: "How do I register an account on SuccessX?", a: "Click on the Register button on the homepage, fill in your Name, Email, Mobile Number, Password, and optional Referral ID. The system automatically fetches your Sponsor Name." },
    { q: "What is the PKR conversion rate?", a: "The fixed currency conversion rate is $1 USD = 300 PKR across all deposits and withdrawals." },
    { q: "How do I deposit funds into my wallet?", a: "Go to the Deposit section, choose Easypaisa, JazzCash, or Bank Transfer, select your USD amount, send the PKR equivalent to the displayed account details, and upload your payment screenshot with TRX ID." },
    { q: "How long does a deposit approval take?", a: "Deposits are reviewed and approved by admin quickly, usually within a few minutes up to 2 hours." },
    { q: "How do investment plans work?", a: "Once you purchase a plan using your wallet balance, it yields daily profit. You can claim your daily profit once every 24 hours in the Task section." },
    { q: "Can I buy the same investment plan multiple times?", a: "Yes! You can purchase any investment plan as many times as you like. Each purchased plan operates independently with its own 24-hour task timer." },
    { q: "How do I claim daily task earnings?", a: "Navigate to the Task tab, find your active plan, and click 'Watch Task'. The daily profit will be added immediately to your wallet balance, starting a 24-hour countdown for the next claim." },
    { q: "How does the Lucky Spin Wheel work?", a: "For every $10 plan purchase, you receive 1 Lucky Spin. Spin the wheel to win guaranteed cash rewards up to $0.50 credited straight to your wallet." },
    { q: "What are the 3-Tier Referral Commissions?", a: "You earn 8% commission on Level 1 direct downlines, 3% on Level 2, and 1% on Level 3 whenever a team member buys an investment plan." },
    { q: "When are referral commissions credited?", a: "Commissions are credited instantly to your wallet balance as soon as a downline member buys a plan." },
    { q: "What is the Team Deposit Bonus?", a: "It is a one-time claimable cash bonus awarded when your Level 1 team reaches specific deposit milestones (ranging from $20+ up to $500+)." },
    { q: "What are Rank Badges?", a: "As your team deposit volume increases, you unlock ranks (Bronze, Silver, Gold, Platinum, Diamond, Crown, Royal Titan, Supreme President) displayed on your profile." },
    { q: "How does the Weekly Salary system work?", a: "If your total downline team deposit reaches milestones ($100 to $1000+), you unlock weekly recurring salary payouts ranging from $2 to $10 per week." },
    { q: "Can I claim multiple weekly salaries at the same time?", a: "No. Only the highest unlocked salary tier is claimed, which triggers a 7-day countdown timer before the next claim." },
    { q: "How do I request a withdrawal?", a: "Go to the Withdrawal section, select your payment channel (Easypaisa, Jazzcash, NayaPay, SadaPay, AllBank), enter your account details and USD amount, then click Submit." },
    { q: "What is the minimum withdrawal limit and tax fee?", a: "Minimum withdrawal is $5. The withdrawal tax fee is set by admin (default 5%) and deducted automatically upon request." },
    { q: "What happens if my withdrawal request is rejected?", a: "If an admin rejects a withdrawal request due to incorrect account details, the full withdrawal amount is automatically refunded back to your wallet balance." },
    { q: "Is my personal data and balance secure?", a: "Yes, SuccessX utilizes Firebase Realtime Database with strict security rules to ensure safe transaction logging and data protection." },
    { q: "How can I contact customer support?", a: "Visit the Support tab to connect with our official WhatsApp support or join our Telegram channel for 24/7 assistance." }
  ];

  const filteredFaqs = faqs.filter(
    f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container py-2">
      
      {/* Top Header */}
      <div className="d-flex align-items-center gap-3 mb-3">
        <button className="btn btn-light rounded-circle p-2 border-0 shadow-sm" onClick={() => onNavigate('dashboard')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h4 className="fw-bold m-0">Frequently Asked Questions</h4>
          <small className="text-muted">Find answers to 20 common questions about SuccessX</small>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="input-group input-group-lg glass-card border-0 shadow-sm">
          <span className="input-group-text bg-white border-0"><Search size={20} className="text-muted" /></span>
          <input 
            type="text" 
            className="form-control border-0 fs-6" 
            placeholder="Search FAQ questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="d-flex flex-column gap-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="glass-card border-0 shadow-sm overflow-hidden">
              <div 
                className="p-3.5 d-flex justify-content-between align-items-center cursor-pointer bg-white"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                style={{ cursor: 'pointer' }}
              >
                <h6 className="fw-bold text-dark m-0 pe-2 d-flex align-items-center gap-2">
                  <span className="badge bg-orange-subtle text-orange rounded-circle px-2 py-1 small" style={{ background: 'rgba(255,107,0,0.12)', color: '#ff6b00' }}>
                    Q{idx + 1}
                  </span>
                  {faq.q}
                </h6>
                <ChevronDown size={20} className={`text-muted transition-all ${isOpen ? 'rotate-180 text-orange' : ''}`} />
              </div>

              {isOpen && (
                <div className="p-3.5 bg-light border-top text-muted small" style={{ lineHeight: '1.6' }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
