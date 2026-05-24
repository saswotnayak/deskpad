import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './AuthStyles.css';

export function LoginScreen() {
  const { sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState(false);
  const [devOtpCode, setDevOtpCode] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const res = await sendOtp(email);
      setStep('otp');
      // If server returns otp in body (meaning we are running console fallback)
      if (res.code) {
        setOtpNotice(true);
        setDevOtpCode(res.code);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      await verifyOtp(email, code);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>DeskPad</h1>
          <p>
            {step === 'email'
              ? 'Enter your email to sign in or create an account'
              : `Enter the verification code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp}>
            <div className="auth-form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                className="auth-input"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading || !email}>
              {loading ? <div className="auth-spinner" /> : 'Send Login Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="auth-form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                id="code"
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                className="auth-input"
                placeholder="000000"
                style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.4rem' }}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading || code.length !== 6}>
              {loading ? <div className="auth-spinner" /> : 'Verify & Login'}
            </button>
            <button
              type="button"
              className="auth-btn auth-btn--secondary"
              onClick={() => {
                setStep('email');
                setCode('');
                setError(null);
                setOtpNotice(false);
              }}
              disabled={loading}
            >
              Back
            </button>

            {otpNotice && (
              <div className="auth-info-hint">
                💡 SMTP is not configured in `.env`. Dev OTP Code: <strong style={{ color: '#6366f1', fontSize: '1.1rem' }}>{devOtpCode}</strong>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
