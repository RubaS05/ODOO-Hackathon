import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePOSStore } from '../store/posStore';

const STORAGE_KEY = 'cafe_customer';

const TableEntry = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const tables = usePOSStore((s) => s.tables);
    const table = tables.find((t) => t.id === tableId);

    const [step, setStep] = useState('email'); // 'email' | 'name'
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If customer already identified in this browser, skip straight to dashboard
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.email) {
                    navigate(`/table/${tableId}/order`, { replace: true });
                }
            } catch { localStorage.removeItem(STORAGE_KEY); }
        }
    }, [tableId, navigate]);

    const handleEmailSubmit = (e) => {
        e.preventDefault();
        setError('');
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setError('Please enter a valid email address.');
            return;
        }
        // Check if customer is known (stored in localStorage of same browser previously)
        // For simplicity: always ask name for new sessions unless email matches stored record
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.email === trimmed) {
                    // Returning customer – go straight in
                    navigate(`/table/${tableId}/order`, { replace: true });
                    return;
                }
            } catch { /* ignore */ }
        }
        // New customer – ask name
        setStep('name');
    };

    const handleNameSubmit = (e) => {
        e.preventDefault();
        setError('');
        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedName) { setError('Please enter your name.'); return; }
        setLoading(true);
        // Store customer info in localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: trimmedName, email: trimmedEmail }));
        setTimeout(() => {
            navigate(`/table/${tableId}/order`, { replace: true });
        }, 400);
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            padding: '24px',
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '20px',
                padding: '40px 36px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
                color: '#fff',
            }}>
                {/* Logo / branding */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '28px', marginBottom: '16px',
                    }}>🍽️</div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Welcome!</h1>
                    {table && (
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>
                            Table {table.number} &bull; {table.floor}
                        </p>
                    )}
                    {!table && (
                        <p style={{ fontSize: '13px', color: '#f87171', marginTop: '6px' }}>
                            Table not found. Please scan the QR code on your table.
                        </p>
                    )}
                </div>

                {table && step === 'email' && (
                    <form onSubmit={handleEmailSubmit}>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px', lineHeight: 1.5 }}>
                            Enter your email to start ordering. We'll use it to track your orders.
                        </p>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoFocus
                            style={inputStyle}
                        />
                        {error && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>{error}</p>}
                        <button type="submit" style={btnStyle}>Continue →</button>
                    </form>
                )}

                {table && step === 'name' && (
                    <form onSubmit={handleNameSubmit}>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '20px', lineHeight: 1.5 }}>
                            Looks like you're new here! What should we call you?
                        </p>
                        <label style={labelStyle}>Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Rahul"
                            autoFocus
                            style={inputStyle}
                        />
                        {error && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px' }}>{error}</p>}
                        <button type="submit" disabled={loading} style={btnStyle}>
                            {loading ? 'Setting up…' : 'Let\'s Order! 🎉'}
                        </button>
                        <button type="button" onClick={() => setStep('email')} style={ghostBtnStyle}>← Back</button>
                    </form>
                )}
            </div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
};

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};

const btnStyle = {
    marginTop: '20px',
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
};

const ghostBtnStyle = {
    marginTop: '12px',
    width: '100%',
    padding: '10px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '13px',
    cursor: 'pointer',
};

export default TableEntry;
