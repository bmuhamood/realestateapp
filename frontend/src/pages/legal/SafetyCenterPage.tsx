// src/pages/legal/SafetyCenterPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const RED = '#e63946';
const NAVY = '#0d1b2e';
const TEAL = '#25a882';
const AMBER = '#f59e0b';
const SLATE = '#475569';

const SafetyCenterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f7fb', fontFamily: "'DM Sans', sans-serif", marginTop: 64 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: NAVY, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            🛡️ Safety Center
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 16 }}>
            Your safety is our priority. Learn how to protect yourself from scams and stay safe on Metro Care Properties.
          </p>
        </div>

        {/* Alert Banner */}
        <div style={{ backgroundColor: '#fef3c7', borderLeft: `4px solid ${AMBER}`, borderRadius: 12, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 8, fontSize: 16 }}>⚠️ Important Warning</div>
          <p style={{ color: '#92400e', margin: 0, fontSize: 14 }}>
            Metro Care Properties will NEVER ask for your password, request payment outside our platform, or pressure you to complete a transaction urgently. 
            If anyone claims to be from Metro Care asking for these things, report them immediately.
          </p>
        </div>

        {/* Common Scams Section */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            🚨 Common Scams to Avoid
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {/* Scam 1 */}
            <div style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Advance Fee Fraud</h3>
              <p style={{ fontSize: 13, color: SLATE, marginBottom: 12 }}>Requests for payment before viewing the property or signing any agreement.</p>
              <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Red flags:</div>
              <ul style={{ margin: '8px 0 0 20px', fontSize: 12, color: '#64748b' }}>
                <li>"Holding fee" before viewing</li>
                <li>Pressure to pay quickly</li>
                <li>Requests for untraceable payment</li>
              </ul>
            </div>

            {/* Scam 2 */}
            <div style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏠</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Fake Listings</h3>
              <p style={{ fontSize: 13, color: SLATE, marginBottom: 12 }}>Properties that don't exist or are significantly misrepresented.</p>
              <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Red flags:</div>
              <ul style={{ margin: '8px 0 0 20px', fontSize: 12, color: '#64748b' }}>
                <li>Price too good to be true</li>
                <li>Stock photos instead of real images</li>
                <li>Agent refuses to meet in person</li>
              </ul>
            </div>

            {/* Scam 3 */}
            <div style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Fake Landlords</h3>
              <p style={{ fontSize: 13, color: SLATE, marginBottom: 12 }}>People claiming to own properties they don't actually own.</p>
              <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Red flags:</div>
              <ul style={{ margin: '8px 0 0 20px', fontSize: 12, color: '#64748b' }}>
                <li>Can't show title deed documents</li>
                <li>Requests cash payments only</li>
                <li>Keys don't work or property is occupied</li>
              </ul>
            </div>

            {/* Scam 4 */}
            <div style={{ padding: '16px', backgroundColor: '#f8faff', borderRadius: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📧</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginBottom: 8 }}>Phishing Attempts</h3>
              <p style={{ fontSize: 13, color: SLATE, marginBottom: 12 }}>Fake emails or messages trying to steal your login information.</p>
              <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>Red flags:</div>
              <ul style={{ margin: '8px 0 0 20px', fontSize: 12, color: '#64748b' }}>
                <li>Suspicious links to fake login pages</li>
                <li>Requests for your password</li>
                <li>Poor grammar and urgent tone</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How to Stay Safe */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            🛡️ How to Stay Safe
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✅</div>
              <div>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>Always view the property in person</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Never send money for a property you haven't seen.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✅</div>
              <div>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>Verify agent identity</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Check verified badges and ask for identification.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✅</div>
              <div>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>Request ownership documents</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Ask for Title Deed or land registration documents.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✅</div>
              <div>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>Get everything in writing</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Sign a written agreement before making payments.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✅</div>
              <div>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>Use traceable payments</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Avoid cash payments. Use bank transfer or mobile money with receipts.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, backgroundColor: '#dcfce7', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✅</div>
              <div>
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 4 }}>Keep communication on platform</div>
                <div style={{ fontSize: 13, color: '#64748b' }}>Use our messaging system to keep records.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Badges */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            ✓ Verified Agents and Properties
          </h2>
          <p style={{ color: SLATE, marginBottom: 16 }}>Look for these badges on agent profiles and property listings:</p>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#f8faff', padding: '10px 16px', borderRadius: 10 }}>
              <span style={{ fontSize: 20 }}>✓</span>
              <span style={{ fontWeight: 600, color: TEAL }}>Verified Agent</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>Identity & license verified</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#f8faff', padding: '10px 16px', borderRadius: 10 }}>
              <span style={{ fontSize: 20 }}>🏠</span>
              <span style={{ fontWeight: 600, color: TEAL }}>Verified Property</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>Physically verified by our team</span>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 16 }}>Note: Verification badges increase trust but do not guarantee transaction safety. Always do your own due diligence.</p>
        </div>

        {/* What to Do If Scammed */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            🆘 What to Do If You Suspect a Scam
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: '#ef4444' }}>1</div>
              <div><strong>Stop all communication</strong> with the suspected scammer</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: '#ef4444' }}>2</div>
              <div><strong>Do not send any more money</strong></div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: '#ef4444' }}>3</div>
              <div><strong>Gather evidence</strong> – Save screenshots, messages, receipts</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: '#ef4444' }}>4</div>
              <div><strong>Report to Metro Care</strong> – Use our complaint system</div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 28, height: 28, backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: '#ef4444' }}>5</div>
              <div><strong>File a police report</strong> – Contact your local police station or CID</div>
            </div>
          </div>
        </div>

        {/* Contact & Report */}
        <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: '28px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: NAVY, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            📞 Need Help?
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Report a complaint</div>
              <button 
                onClick={() => navigate('/legal/complaints/new')}
                style={{ padding: '8px 20px', backgroundColor: RED, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                File a Complaint →
              </button>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Contact support</div>
              <div style={{ fontSize: 13, color: SLATE }}>Email: safety@metrocareproperties.ug</div>
              <div style={{ fontSize: 13, color: SLATE }}>Phone: +256 700 123 456</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Emergency contacts</div>
              <div style={{ fontSize: 13, color: SLATE }}>Police: 999</div>
              <div style={{ fontSize: 13, color: SLATE }}>CID Fraud Desk: +256 414 337 000</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyCenterPage;