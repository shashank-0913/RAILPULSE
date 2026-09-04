import React, { useState } from 'react';
import { ShieldCheck, Lock, CreditCard, User, AlertCircle, Sparkles, Building2, CheckCircle2, ChevronRight, Info } from 'lucide-react';
import { api } from '../services/api';
import { VerifiedUser } from '../types';

interface SecurityGateModalProps {
  onVerified: (user: VerifiedUser) => void;
  onCancel?: () => void;
}

export const SecurityGateModal: React.FC<SecurityGateModalProps> = ({ onVerified, onCancel }) => {
  const [idType, setIdType] = useState<'aadhaar' | 'pan' | 'passport' | 'driving_licence'>('aadhaar');
  const [idNumber, setIdNumber] = useState('9845 2314 7890');
  const [fullName, setFullName] = useState('Sh. Rajesh Kumar Verma');
  const [role, setRole] = useState('Chief Section Controller (Waltair Division)');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);

  const idTypeConfigs = {
    aadhaar: {
      label: 'Aadhaar (UIDAI)',
      placeholder: '9845 2314 7890 (12 Digits)',
      guide: 'Enter exactly 12 numeric digits.',
      registeredRecords: [
        { id: '9845 2314 7890', name: 'Sh. Rajesh Kumar Verma', role: 'Chief Section Controller (Waltair Division)' },
        { id: '1234 5678 9012', name: 'Shashank Sharma', role: 'Senior Operations Director (Railway Board)' }
      ]
    },
    pan: {
      label: 'PAN Card (Income Tax)',
      placeholder: 'ABCDE1234F (10 Alphanumeric)',
      guide: '5 letters, 4 digits, 1 letter.',
      registeredRecords: [
        { id: 'ABCDE1234F', name: 'Dr. Priya Sundaram', role: 'AI Operations & Telemetry Analyst' }
      ]
    },
    passport: {
      label: 'Indian Passport (MEA)',
      placeholder: 'K4892150 (1 Letter + 7 Digits)',
      guide: '1 capital letter followed by 7 digits.',
      registeredRecords: [
        { id: 'K4892150', name: 'Arunav Sengupta', role: 'Passenger (Coaching Operations Portal)' }
      ]
    },
    driving_licence: {
      label: 'Driving Licence (MoRTH)',
      placeholder: 'DL-1420110012345 (State + Digits)',
      guide: 'Valid State Driving Licence format.',
      registeredRecords: [
        { id: 'DL-1420110012345', name: 'Karan Singh Rathore', role: 'Loco Pilot Special Grade' }
      ]
    }
  };

  const handleSelectRecord = (id: string, name: string, assignedRole: string, type: 'aadhaar' | 'pan' | 'passport' | 'driving_licence') => {
    setIdType(type);
    setIdNumber(id);
    setFullName(name);
    setRole(assignedRole);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber.trim()) {
      setError('Please enter your Government ID number.');
      return;
    }

    if (!fullName.trim()) {
      setError('Official registered name is required to match your government ID record.');
      return;
    }

    // Format validation
    if (idType === 'aadhaar') {
      const rawDigits = idNumber.replace(/[\s-]+/g, '');
      if (!/^\d+$/.test(rawDigits)) {
        setError('Aadhaar number must contain only numeric digits (0-9).');
        return;
      }
      if (rawDigits.length !== 12) {
        setError(`Aadhaar number must consist of exactly 12 digits (currently ${rawDigits.length} digit${rawDigits.length === 1 ? '' : 's'}).`);
        return;
      }
    } else if (idType === 'pan') {
      const panUpper = idNumber.replace(/[\s-]+/g, '').toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panUpper)) {
        setError('PAN Card format must be 10 characters (5 letters, 4 digits, 1 letter, e.g. ABCDE1234F).');
        return;
      }
    } else if (idType === 'passport') {
      const passUpper = idNumber.replace(/[\s-]+/g, '').toUpperCase();
      if (!/^[A-Z]{1}[0-9]{7}$/.test(passUpper)) {
        setError('Passport number must be 1 letter followed by 7 digits (e.g. K4892150).');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.verifyIdentity({
        idType,
        idNumber: idNumber.trim(),
        fullName: fullName.trim(),
        role,
        isPreset: false
      });

      if (res.success && res.user) {
        onVerified(res.user);
      } else {
        setError(res.message || 'Authentication failed: Name does not match registered Government ID records.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Identity verification failed: Name does not match registered official record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--modal-overlay)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1.5rem'
    }}>
      <div className="control-card control-card-glow-green" style={{
        maxWidth: '720px',
        width: '100%',
        background: 'var(--modal-bg)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: 'var(--card-shadow)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              background: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
            }}>
              <ShieldCheck size={24} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                RAILPULSE SECURITY CLEARANCE GATE
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Official Government ID & Name Verification Protocol | SIH26028
              </p>
            </div>
          </div>
          <div className="badge-status badge-ai-intel" style={{ fontSize: '0.7rem' }}>
            <Lock size={12} /> SECURE PROTOCOL
          </div>
        </div>

        {/* Security Notice */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '10px',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start'
        }}>
          <CheckCircle2 size={18} color="var(--color-green)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--color-green)' }}>Strict Identity Matching Policy:</strong> The entered Name <strong>must strictly match</strong> the official registered name for the provided Government ID Number (Aadhaar, PAN, or Passport). Unmatched or fabricated credentials are automatically rejected.
          </div>
        </div>

        {/* Quick 1-Click Fill Preset Cards for Evaluators */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles size={13} color="var(--color-cyan)" /> Authorized Test Directory (Click to Populate):
            </div>
            <button
              type="button"
              onClick={() => setShowDirectory(!showDirectory)}
              style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', fontSize: '0.725rem', cursor: 'pointer', fontWeight: 600 }}
            >
              {showDirectory ? 'Hide Directory ▲' : 'View Full Registry ▼'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleSelectRecord('9845 2314 7890', 'Sh. Rajesh Kumar Verma', 'Chief Section Controller (Waltair Division)', 'aadhaar')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', textAlign: 'left', borderColor: 'var(--color-green)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-green)' }}>👑 Rajesh Kumar Verma</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>Aadhaar: 9845 2314 7890</div>
              </div>
              <ChevronRight size={14} color="var(--color-green)" />
            </button>

            <button
              type="button"
              onClick={() => handleSelectRecord('1234 5678 9012', 'Shashank Sharma', 'Senior Operations Director (Railway Board)', 'aadhaar')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', textAlign: 'left', borderColor: 'var(--color-cyan)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-cyan)' }}>⚡ Shashank Sharma</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>Aadhaar: 1234 5678 9012</div>
              </div>
              <ChevronRight size={14} color="var(--color-cyan)" />
            </button>

            <button
              type="button"
              onClick={() => handleSelectRecord('ABCDE1234F', 'Dr. Priya Sundaram', 'AI Operations & Telemetry Analyst', 'pan')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', textAlign: 'left', borderColor: '#f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#f59e0b' }}>🧠 Dr. Priya Sundaram</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>PAN: ABCDE1234F</div>
              </div>
              <ChevronRight size={14} color="#f59e0b" />
            </button>

            <button
              type="button"
              onClick={() => handleSelectRecord('K4892150', 'Arunav Sengupta', 'Passenger (Coaching Operations Portal)', 'passport')}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem', textAlign: 'left', borderColor: '#a855f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#a855f7' }}>🚆 Arunav Sengupta</div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>Passport: K4892150</div>
              </div>
              <ChevronRight size={14} color="#a855f7" />
            </button>
          </div>

          {/* Full Registry Modal Drawer */}
          {showDirectory && (
            <div style={{
              marginTop: '0.75rem',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              fontSize: '0.75rem'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Info size={14} color="var(--color-cyan)" /> Complete Verified Government Registry
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {idTypeConfigs[idType].registeredRecords.map(rec => (
                  <div
                    key={rec.id}
                    onClick={() => handleSelectRecord(rec.id, rec.name, rec.role, idType)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.name}</div>
                    <div style={{ fontSize: '0.675rem', color: 'var(--color-green)', fontFamily: 'JetBrains Mono' }}>{rec.id}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{rec.role}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* ID Type Selector Tabs */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Select Government Identification Type:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {(['aadhaar', 'pan', 'passport', 'driving_licence'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setIdType(type);
                    const defaultRec = idTypeConfigs[type].registeredRecords[0];
                    if (defaultRec) {
                      setIdNumber(defaultRec.id);
                      setFullName(defaultRec.name);
                      setRole(defaultRec.role);
                    }
                    setError(null);
                  }}
                  style={{
                    padding: '0.6rem 0.4rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: idType === type ? '1px solid var(--color-green)' : '1px solid var(--border-subtle)',
                    background: idType === type ? 'var(--color-green-glow)' : 'var(--bg-elevated)',
                    color: idType === type ? 'var(--color-green)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {idTypeConfigs[type].label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* ID Number Input */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {idTypeConfigs[idType].label} Number:
              </label>
              {idType === 'aadhaar' && (
                <span style={{
                  fontSize: '0.725rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: idNumber.replace(/[\s-]+/g, '').length === 12 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: idNumber.replace(/[\s-]+/g, '').length === 12 ? 'var(--color-green)' : 'var(--color-red)',
                  border: idNumber.replace(/[\s-]+/g, '').length === 12 ? '1px solid var(--color-green)' : '1px solid var(--color-red)'
                }}>
                  {idNumber.replace(/[\s-]+/g, '').length} / 12 Digits {idNumber.replace(/[\s-]+/g, '').length === 12 ? '✓' : '(Must be exactly 12)'}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <CreditCard size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                placeholder={idTypeConfigs[idType].placeholder}
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: idType === 'aadhaar' && idNumber.trim() && idNumber.replace(/[\s-]+/g, '').length !== 12 ? '1px solid var(--color-red)' : '1px solid var(--input-border)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Format requirement: {idTypeConfigs[idType].guide}
            </div>
          </div>

          {/* Full Name & Role */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Full Legal Name (Must Match ID):
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Sh. Rajesh Kumar Verma"
                  style={{
                    width: '100%',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '8px',
                    padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Assigned Role:
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.825rem',
                  outline: 'none'
                }}
              >
                <option value="Chief Section Controller (Waltair Division)">Chief Section Controller</option>
                <option value="Senior Operations Director (Railway Board)">Senior Operations Director</option>
                <option value="AI Operations & Telemetry Analyst">AI Operations Analyst</option>
                <option value="Safety & Dispatch Controller (Central Railway)">Safety Dispatch Controller</option>
                <option value="Passenger (Coaching Operations Portal)">Passenger Portal User</option>
              </select>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: '#fca5a5',
              fontSize: '0.8rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              lineHeight: 1.4
            }}>
              <AlertCircle size={18} color="var(--color-red)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                style={{ padding: '0.85rem 1.25rem', fontSize: '0.9rem', fontWeight: 600 }}
              >
                ← Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '0.85rem', fontSize: '0.95rem' }}
            >
              {loading ? (
                <span>Authenticating with Railway Gateway...</span>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>Verify Identity & Enter Control Platform</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={13} />
            Centre for Railway Information Systems (CRIS)
          </div>
          <div>UIDAI / NSDL / Passport Seva Gateway Active</div>
        </div>
      </div>
    </div>
  );
};
