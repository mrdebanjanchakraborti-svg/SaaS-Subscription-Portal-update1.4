

import React, { useState, useContext } from 'react';
import { api } from '../../services/mockApiService';
import { BrandingContext } from '../../App';

interface ForgotPasswordPageProps {
    onSwitchToLogin: () => void;
    onProceedToReset: (email: string) => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onSwitchToLogin, onProceedToReset }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { logo } = useContext(BrandingContext);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        const result = await api.requestPasswordReset(email);
        
        setMessage(result.message);
        setIsSubmitted(true);
        setLoading(false);
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
            <div className="w-full max-w-md bg-base-200 p-8 rounded-xl shadow-lg relative">
                <img src={logo} alt="Inflow logo" className="h-12 mx-auto mb-6" />
                <button onClick={onSwitchToLogin} className="absolute top-4 left-4 text-content-muted hover:text-white">&larr; Back to Login</button>
                <h2 className="text-3xl font-bold text-center text-white mb-6">Forgot Password</h2>
                
                {message && (
                    <div className="bg-blue-900 border border-blue-700 text-blue-300 px-4 py-3 rounded-md mb-4 text-sm space-y-3">
                        <p>{message}</p>
                        <p className="font-semibold">For this demo, you can proceed to the next step directly.</p>
                        <button 
                            onClick={() => onProceedToReset(email)}
                            className="bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-500 w-full transition-colors"
                        >
                            Continue to Reset Password
                        </button>
                    </div>
                )}
                
                {!isSubmitted && (
                    <>
                        <p className="text-center text-sm text-content-muted mb-6">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-content-muted mb-1">Email Address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" required />
                            </div>
                            
                            <button type="submit" disabled={loading} className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-brand-secondary transition-colors mt-2 disabled:opacity-50">
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
export default ForgotPasswordPage;
