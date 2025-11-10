
import React, { useState, useEffect, useContext } from 'react';
import { Software, SubscriptionPlan } from '../../types';
import { api } from '../../services/mockApiService';
import { BrandingContext } from '../../App';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const SoftwareCard: React.FC<{ software: Software; onSubscribeClick: (softwareId: string, plan: SubscriptionPlan) => void; }> = ({ software, onSubscribeClick }) => {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(SubscriptionPlan.MONTHLY);

    return (
        <div className="bg-base-200 rounded-lg shadow-xl overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
            <div className="p-6">
                <h3 className="text-2xl font-bold text-white">{software.name}</h3>
                <p className="text-content-muted mt-2 h-12">{software.description}</p>
                
                <div className="mt-6">
                    <p className="font-semibold text-white">Features:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-content">
                        {software.features.slice(0, 3).map(feature => <li key={feature}>{feature}</li>)}
                    </ul>
                </div>

                <div className="mt-6">
                     <div className="flex bg-base-300 p-1 rounded-lg">
                        {Object.values(SubscriptionPlan).map(plan => (
                             <button 
                                key={plan}
                                onClick={() => setSelectedPlan(plan)}
                                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${selectedPlan === plan ? 'bg-brand-primary text-white' : 'text-content-muted'}`}
                             >
                                 {plan}
                             </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-4xl font-extrabold text-white">{formatCurrency(software.pricing[selectedPlan])}</p>
                    <p className="text-content-muted">per {selectedPlan.toLowerCase().replace('ly', '')}</p>
                    {software.setupFee > 0 && <p className="text-sm text-yellow-400 mt-2">+ {formatCurrency(software.setupFee)} one-time setup fee</p>}
                </div>
                
                <button onClick={() => onSubscribeClick(software.id, selectedPlan)} className="w-full mt-8 bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-brand-secondary transition-colors">
                    Subscribe Now
                </button>
            </div>
        </div>
    );
};

interface LandingPageProps {
    onNavigateToLogin: (softwareId?: string, plan?: SubscriptionPlan) => void;
    onNavigateToRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToRegister }) => {
    const [softwareList, setSoftwareList] = useState<Software[]>([]);
    const { logo, banner } = useContext(BrandingContext);

    useEffect(() => {
        api.getAllSoftware().then(setSoftwareList);
    }, []);

    return (
        <div className="min-h-screen bg-base-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                 <nav className="flex justify-between items-center py-4">
                    <img src={logo} alt="Inflow logo" className="h-10" />
                    <div className="space-x-4">
                        <button onClick={() => onNavigateToLogin()} className="text-content hover:text-white transition-colors">Login</button>
                        <button onClick={onNavigateToRegister} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary transition-colors">Sign Up</button>
                    </div>
                </nav>

                <header className="text-center py-16">
                     {banner && (
                        <div className="mb-12">
                            <img src={banner} alt="Promotional banner" className="w-full max-w-5xl mx-auto rounded-lg shadow-lg" />
                        </div>
                    )}
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white">
                        Powerful Software Solutions for Your Business
                    </h1>
                    <p className="mt-4 text-lg text-content-muted max-w-2xl mx-auto">
                        Discover our suite of tools designed to boost productivity, streamline workflows, and drive growth.
                    </p>
                </header>

                <main>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {softwareList.map(sw => (
                            <SoftwareCard key={sw.id} software={sw} onSubscribeClick={onNavigateToLogin} />
                        ))}
                    </div>
                </main>
                
                <footer className="text-center py-12 mt-16 border-t border-base-300">
                    <p className="text-content-muted">&copy; {new Date().getFullYear()} SaaS Subscription Portal. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;