

import React, { useState, useEffect, useContext } from 'react';
import { api } from '../../services/mockApiService';
import { BrandingContext } from '../../App';

interface RegistrationPageProps {
    onSwitchToLogin: () => void;
    initialRefCode?: string | null;
}

const RegistrationPage: React.FC<RegistrationPageProps> = ({ onSwitchToLogin, initialRefCode }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [company, setCompany] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [referralCode, setReferralCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { logo } = useContext(BrandingContext);

    useEffect(() => {
        if (initialRefCode) {
            setReferralCode(initialRefCode);
        }
    }, [initialRefCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name || !email || !company || !password) {
            setError('Please fill out all required fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const result = await api.registerCustomer({
            name,
            email,
            company,
            password,
            referralCode: referralCode || undefined,
        });

        if (result.success) {
            setSuccess(result.message + " You can now log in.");
            setName('');
            setEmail('');
            setCompany('');
            setPassword('');
            setConfirmPassword('');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
            <div className="w-full max-w-md bg-base-200 p-8 rounded-xl shadow-lg">
                <img src={logo} alt="Inflow logo" className="h-12 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-center text-white mb-6">Create Your Account</h2>

                {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-md mb-4 text-sm">{error}</div>}
                {success && <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-md mb-4 text-sm">{success}</div>}
                
                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-content-muted mb-1">Full Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-content-muted mb-1">Company Name</label>
                            <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-content-muted mb-1">Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-content-muted mb-1">Password</label>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-content-muted mb-1">Confirm Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-content-muted mb-1">Referral Code (Optional)</label>
                            <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                        </div>
                        <button type="submit" className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-brand-secondary transition-colors mt-2">
                            Sign Up
                        </button>
                    </form>
                )}

                <p className="text-center mt-6 text-sm text-content-muted">
                    Already have an account?{' '}
                    <button onClick={onSwitchToLogin} className="font-semibold text-brand-primary hover:underline">
                        Log in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default RegistrationPage;