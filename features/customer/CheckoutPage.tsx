
import React, { useState, useEffect, useContext } from 'react';
import { Software, SubscriptionPlan } from '../../types';
import { api } from '../../services/mockApiService';
import { AuthContext } from '../../App';

interface CheckoutPageProps {
    pendingSubscription: {
        softwareId: string;
        plan: SubscriptionPlan;
    };
    onSubscriptionComplete: () => void;
    onCancel: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};


const CheckoutPage: React.FC<CheckoutPageProps> = ({ pendingSubscription, onSubscriptionComplete, onCancel }) => {
    const { user } = useContext(AuthContext);
    const [software, setSoftware] = useState<Software | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    
    useEffect(() => {
        const fetchSoftwareDetails = async () => {
            setLoading(true);
            const sw = await api.getSoftware(pendingSubscription.softwareId);
            setSoftware(sw || null);
            setLoading(false);
        };
        fetchSoftwareDetails();
    }, [pendingSubscription]);
    
    const handleConfirmPurchase = async () => {
        if (!user || !software) return;

        setProcessing(true);
        setError('');

        const customer = (await api.getAllCustomers()).find(c => c.email === user.email);
        if (!customer) {
            setError("Could not find your customer account. Please contact support.");
            setProcessing(false);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate gateway processing

        const result = await api.createSubscriptionAndPayFirstInvoice(customer.id, software.id, pendingSubscription.plan);

        if (result.success) {
            setShowSuccess(true);
            setTimeout(() => {
                onSubscriptionComplete();
            }, 2000);
        } else {
            setError(result.message);
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading your selection...</div>;
    }

    if (!software) {
        return (
             <div className="min-h-screen flex flex-col items-center justify-center text-white">
                <p className="text-red-400 mb-4">Could not load the selected software. Please try again.</p>
                <button onClick={onCancel} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    const planPrice = software.pricing[pendingSubscription.plan];
    const setupFee = software.setupFee;
    const totalAmount = planPrice + setupFee;

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
             {showSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50">
                    <div className="bg-base-200 p-8 rounded-full mb-4">
                        <svg className="w-24 h-24" viewBox="0 0 52 52">
                            <circle className="stroke-current text-green-600" cx="26" cy="26" r="25" fill="none" strokeWidth="4" style={{ strokeDasharray: 157, strokeDashoffset: 157, animation: 'draw-circle 0.5s ease-out forwards' }} />
                            <path className="stroke-current text-green-500" fill="none" strokeWidth="5" d="M14.1 27.2l7.1 7.2 16.7-16.8" style={{ strokeDasharray: 48, strokeDashoffset: 48, animation: 'draw-check 0.4s 0.5s ease-out forwards' }} />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">Subscription Successful!</h2>
                     <style>{`
                        @keyframes draw-circle { to { stroke-dashoffset: 0; } }
                        @keyframes draw-check { to { stroke-dashoffset: 0; } }
                    `}</style>
                 </div>
            )}
            <div className="w-full max-w-2xl bg-base-200 p-8 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-center text-white mb-2">Confirm Your Subscription</h1>
                <p className="text-center text-content-muted mb-8">Review your selection below and proceed to payment.</p>
                
                <div className="bg-base-300 p-6 rounded-lg space-y-4">
                    <div className="flex justify-between items-center text-lg">
                        <span className="text-content">Software:</span>
                        <span className="font-bold text-white">{software.name}</span>
                    </div>
                     <div className="flex justify-between items-center text-lg">
                        <span className="text-content">Plan:</span>
                        <span className="font-bold text-white">{pendingSubscription.plan}</span>
                    </div>
                    <div className="border-t border-base-100 my-4"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-content-muted">{pendingSubscription.plan} Price:</span>
                        <span className="text-content">{formatCurrency(planPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-content-muted">One-time Setup Fee:</span>
                        <span className="text-content">{formatCurrency(setupFee)}</span>
                    </div>
                     <div className="flex justify-between items-center text-2xl pt-4 border-t border-base-100">
                        <span className="font-bold text-white">Total Due Today:</span>
                        <span className="font-bold text-white">{formatCurrency(totalAmount)}</span>
                    </div>
                </div>

                {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-md mt-6 text-sm text-center">{error}</div>}

                <div className="flex justify-between items-center mt-8">
                    <button onClick={onCancel} className="text-content-muted hover:text-white transition-colors">
                        &larr; Cancel and go to dashboard
                    </button>
                    <button 
                        onClick={handleConfirmPurchase}
                        disabled={processing}
                        className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                        {processing ? 'Processing Payment...' : 'Confirm & Subscribe'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
