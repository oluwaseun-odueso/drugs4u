import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: '💊', title: 'Prescription Management', desc: 'Create and track prescriptions with full audit trail. Automatic stock deduction and status updates in real time.' },
    { icon: '👥', title: 'Customer Records', desc: 'Maintain complete patient profiles including medication history, allergies, and medical conditions securely.' },
    { icon: '📦', title: 'Inventory Control', desc: 'Track medicine batches, expiry dates, and stock levels with automatic low-stock alerts before you run out.' },
    { icon: '🔔', title: 'Risk & Alert System', desc: 'Instant alerts for age-restricted medicines, ID verification requirements, and controlled drug dispensing.' },
    { icon: '📊', title: 'Reporting & Analytics', desc: 'Generate prescription reports by date, customer, or medicine. Make data-driven decisions with clear insights.' },
    { icon: '🔒', title: 'Secure & Compliant', desc: 'Role-based access control, full audit logging, and data protection built-in for NHS pharmacy compliance.' },
  ];

  const steps = [
    { n: '01', title: 'Register Customer', desc: 'Add patient details including NHS number, DOB, allergies and medical history.' },
    { n: '02', title: 'Create Prescription', desc: 'Select medicines from verified inventory. System flags age restrictions and ID checks automatically.' },
    { n: '03', title: 'Dispense Safely', desc: 'Acknowledge any risk alerts, dispense medication, and stock updates instantly.' },
  ];

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className={`land-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="land-nav-logo">
          <div className="logo-icon-nav">D4</div>
          <span>Drugs 4U PMS</span>
        </div>
        <ul className="land-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How It Works</a></li>
        </ul>
        <div className="land-nav-cta">
          <button className="btn btn-outline-white" onClick={() => navigate('/login')}>
            Staff Login
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="land-hero">
        <div className="land-hero-bg" />
        <div className="hero-shape hero-shape-1" />
        <div className="hero-shape hero-shape-2" />
        <div className="hero-shape hero-shape-3" />

        <div className="land-hero-content">
          <div className="land-hero-text animate-slideRight">
            <div className="hero-eyebrow">
              <span>🏥</span> Staffordshire Pharmacy Solution
            </div>
            <h1>
              Smarter Pharmacy<br />
              Management for<br />
              <em>Drugs 4U</em>
            </h1>
            <p>
              A complete digital solution to manage prescriptions, patient records,
              inventory and risk alerts — replacing paper-based processes with
              a fast, secure, and compliant system.
            </p>
            <div className="hero-actions">
              <button className="btn btn-white btn-lg" onClick={() => navigate('/login')}>
                Staff Login →
              </button>
              <a href="#features" className="btn btn-outline-white btn-lg">
                See Features
              </a>
            </div>
          </div>

          <div className="hero-visual animate-slideLeft delay-2">
            <div className="hero-cards">
              {/* Main card */}
              <div className="hcard hcard-main">
                <h4>Today's Prescriptions</h4>
                <div className="big">24</div>
                <div className="small-text">8 pending · 16 dispensed</div>
                <div className="hcard-status">
                  <div className="live-dot" />
                  System Active
                </div>
              </div>

              {/* Card A */}
              <div className="hcard hcard-a">
                <h4>Stock Alert</h4>
                <div className="med" style={{ color: '#ffd6d7' }}>3 items</div>
                <div className="small-text">Below threshold</div>
              </div>

              {/* Card B */}
              <div className="hcard hcard-b">
                <h4>Customers</h4>
                <div className="med">142</div>
                <div className="small-text">Registered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="land-stats">
        <div className="land-stats-inner">
          {[
            { num: '500+', lbl: 'Prescriptions Managed' },
            { num: '200+', lbl: 'Registered Patients' },
            { num: '100%', lbl: 'Digital Records' },
            { num: '24/7', lbl: 'System Availability' },
          ].map((s, i) => (
            <div className="land-stat reveal" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="num">{s.num}</div>
              <div className="lbl">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="land-section" id="features" style={{ background: '#f8fafb' }}>
        <div className="land-section-inner">
          <div className="section-head reveal">
            <div className="section-eyebrow">Core Features</div>
            <h2 className="section-title">Everything a pharmacy needs</h2>
            <p className="section-sub">
              Built specifically for UK pharmacies, covering every workflow from patient
              registration to prescription dispensing and compliance reporting.
            </p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card reveal" key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="land-section" id="how">
        <div className="land-section-inner">
          <div className="section-head reveal" style={{ textAlign: 'center' }}>
            <div className="section-eyebrow">Workflow</div>
            <h2 className="section-title">How it works</h2>
            <p className="section-sub" style={{ margin: '0 auto 56px' }}>
              A simple three-step process that guides pharmacy staff from patient
              registration to safe dispensing.
            </p>
          </div>
          <div className="steps-wrap">
            <div className="steps-line" />
            <div className="steps-grid">
              {steps.map((s, i) => (
                <div className="step-card reveal" key={i} style={{ transitionDelay: `${i * 0.15}s` }}>
                  <div className="step-num">{s.n}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="land-cta">
        <div className="land-cta-inner reveal">
          <h2>Ready to go paperless?</h2>
          <p>Sign in with your staff credentials to access the system.</p>
          <button className="btn btn-white btn-lg" onClick={() => navigate('/login')}>
            Sign In to PMS →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="land-footer">
        <strong>Drugs 4U</strong> Prescription Management System &mdash; Powered by <strong>Pharma4</strong> &copy; 2026
      </footer>
    </div>
  );
}
