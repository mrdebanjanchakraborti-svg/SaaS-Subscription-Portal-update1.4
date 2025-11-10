
import React, { useState, createContext, useMemo, useEffect, useCallback, useContext } from 'react';
import { User, UserRole, Notification, NotificationType, SubscriptionPlan } from './types';
import { mockUsers, api } from './services/mockApiService';
import AdminPortal from './features/admin/AdminPortal';
import UserPortal from './features/user/UserPortal';
import CustomerPortal from './features/customer/CustomerPortal';
import LandingPage from './features/landing/LandingPage';
import SystemDesignPage from './features/system/SystemDesignPage';
import RegistrationPage from './features/auth/RegistrationPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import { LOGO_BASE64 } from './constants';
import CheckoutPage from './features/customer/CheckoutPage';


// Simple Auth Context
export const AuthContext = createContext<{ user: User | null; login: (user: User) => void; logout: () => void; }>({
    user: null,
    login: () => {},
    logout: () => {},
});

// Branding Context
export const BrandingContext = createContext<{
    logo: string;
    banner: string | null;
    setBranding: (updates: Partial<{logo: string, banner: string | null}>) => Promise<void>;
}>({
    logo: LOGO_BASE64,
    banner: null,
    setBranding: async () => {},
});


const LoginPage: React.FC<{ 
    onLogin: (email: string, pass: string) => Promise<User | null>, 
    onSwitchToRegister: () => void, 
    onBackToLanding: () => void, 
    onForgotPassword: () => void,
    demoUsers: User[]
}> = ({ onLogin, onSwitchToRegister, onBackToLanding, onForgotPassword, demoUsers }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { logo } = useContext(BrandingContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const user = await onLogin(email, password);
        
        setLoading(false);
        if (!user) {
            setError('Invalid credentials. Please try again.');
        }
    };
    
    const handleDemoLogin = async (demoUser: User) => {
        setLoading(true);
        setError('');
        
        setEmail(demoUser.email);
        setPassword('password'); // Any password works, so this is just for show
        
        const user = await onLogin(demoUser.email, 'password');
        
        setLoading(false);
        if (!user) {
            setError('Demo login failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
            <div className="w-full max-w-md bg-base-200 p-8 rounded-xl shadow-lg relative">
                <img src={logo} alt="Inflow logo" className="h-12 mx-auto mb-8" />
                <button onClick={onBackToLanding} className="absolute top-4 left-4 text-content-muted hover:text-white">&larr; Back</button>
                <h2 className="text-3xl font-bold text-center text-white mb-8">Portal Login</h2>
                
                {error && <div className="bg-red-900 border border-red-700 text-red-300 px-4 py-3 rounded-md mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-content-muted mb-1" htmlFor="email">Email Address</label>
                        <input 
                            id="email"
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="w-full bg-base-300 text-white p-3 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" 
                            required 
                            autoComplete="email"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-content-muted mb-1" htmlFor="password">Password</label>
                        <input 
                            id="password"
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full bg-base-300 text-white p-3 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" 
                            required 
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="text-right">
                        <button type="button" onClick={onForgotPassword} className="text-sm text-brand-primary hover:underline">
                            Forgot Password?
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm text-content-muted">
                    New customer?{' '}
                    <button onClick={onSwitchToRegister} className="font-semibold text-brand-primary hover:underline">
                        Sign up here
                    </button>
                </p>

                <div className="mt-8 pt-6 border-t border-base-300">
                    <h3 className="text-center font-bold text-white mb-4">Quick Access Demo Accounts</h3>
                    <p className="text-center text-xs text-content-muted mb-4">Click a button to log in instantly. For manual login, any password will work.</p>
                    <div className="space-y-3">
                        {demoUsers.map(user => (
                            <div key={user.id} className="bg-base-300 p-3 rounded-md flex items-center justify-between animate-fade-in">
                                <div>
                                    <p className="font-semibold text-white">{user.name} ({user.role})</p>
                                    <p className="text-sm text-content-muted">{user.email}</p>
                                </div>
                                <button 
                                    onClick={() => handleDemoLogin(user)}
                                    disabled={loading}
                                    className="bg-brand-secondary text-white font-bold py-1 px-3 rounded-lg hover:bg-purple-500 text-sm transition-colors disabled:opacity-50"
                                >
                                    Login
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

// Deep link state type
type DeepLinkState = {
    target: 'support';
    ticketId: string;
} | null;

const getNotificationIcon = (type?: NotificationType) => {
    switch (type) {
        case NotificationType.TASK_OVERDUE:
            return '🔥';
        case NotificationType.TASK_DUE_SOON:
            return '⏰';
        case NotificationType.NEW_TICKET:
        default:
            return '📩';
    }
};


const App: React.FC = () => {
    const [branding, setBranding] = useState<{ logo: string; banner: string | null; }>({ logo: LOGO_BASE64, banner: null });
    const [user, setUser] = useState<User | null>(null);
    const [page, setPage] = useState<'portal' | 'system'>('portal');
    const [view, setView] = useState<'landing' | 'login' | 'register' | 'forgotPassword' | 'resetPassword'>('landing');
    const [refCode, setRefCode] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [deepLink, setDeepLink] = useState<DeepLinkState>(null);
    const [emailForReset, setEmailForReset] = useState<string | null>(null);
    const [pendingSubscription, setPendingSubscription] = useState<{ softwareId: string; plan: SubscriptionPlan } | null>(null);


     useEffect(() => {
        const fetchBrandingData = async () => {
            const settings = await api.getBrandingSettings();
            if (settings) {
                setBranding(settings);
            }
        };
        fetchBrandingData();

        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');
        if (ref) {
            setRefCode(ref);
            setView('register'); // Go directly to register if ref link is used
        }
    }, []);
    
    const fetchNotifications = useCallback(async () => {
        if(user) {
            const userNotifications = await api.getNotificationsForUser(user.id);
            setNotifications(userNotifications.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications to simulate real-time updates
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const brandingContextValue = useMemo(() => ({
        logo: branding.logo,
        banner: branding.banner,
        setBranding: async (updates: Partial<{logo: string, banner: string | null}>) => {
            const newSettings = { ...branding, ...updates };
            try {
                await api.setBrandingSettings(newSettings);
                setBranding(newSettings);
            } catch (error) {
                 console.error("Could not save branding settings:", error);
                 alert("Could not save settings. Your browser's storage might be full or disabled.");
            }
        },
    }), [branding]);

    const authContextValue = useMemo(() => ({
        user,
        login: (loggedInUser: User) => {
            setUser(loggedInUser);
        },
        logout: () => {
            setUser(null);
            setPage('portal');
            setView('landing');
            setNotifications([]);
            setPendingSubscription(null);
        }
    }), [user]);
    
    const attemptLogin = async (email: string, pass: string): Promise<User | null> => {
        const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return null; // User not found
        }

        // For newly registered users, password must match.
        // For the original demo users, any password is fine to maintain the "Quick Access" feature.
        const isOriginalDemoUser = [
            'admin@saas.com',
            'sales1@saas.com',
            'sales2@saas.com',
            'ravi@customer.com',
            'priya@customer.com'
        ].includes(user.email.toLowerCase());

        if (isOriginalDemoUser || user.password === pass) {
            authContextValue.login(user);
            return user;
        }

        return null; // Password incorrect
    };


    const handleNotificationClick = async (notification: Notification) => {
        setPage('portal');
        setDeepLink({ target: 'support', ticketId: notification.ticketId });
        setShowNotifications(false);
        await api.markNotificationAsRead(notification.id);
        fetchNotifications(); // Refresh immediately
    };

    const renderPortal = () => {
        if (!user) return null; // Should be handled by the main view logic
        
        const portalProps = {
            deepLink,
            clearDeepLink: () => setDeepLink(null)
        };
        
        switch (user.role) {
            case UserRole.ADMIN:
                return <AdminPortal {...portalProps} />;
            case UserRole.USER:
                return <UserPortal {...portalProps} />;
            case UserRole.CUSTOMER:
                return <CustomerPortal />;
            default:
                 // This case should not be reached when logged in
                return null;
        }
    };
    
    const renderAppContent = () => {
        if (!user) {
            switch(view) {
                case 'login': {
                    const demoUsersForLogin = [
                        mockUsers.find(u => u.role === UserRole.ADMIN),
                        mockUsers.find(u => u.role === UserRole.USER),
                        mockUsers.find(u => u.role === UserRole.CUSTOMER)
                    ].filter((u): u is User => u !== undefined);

                    return <LoginPage 
                        onLogin={attemptLogin} 
                        onSwitchToRegister={() => setView('register')} 
                        onBackToLanding={() => setView('landing')}
                        onForgotPassword={() => setView('forgotPassword')}
                        demoUsers={demoUsersForLogin}
                    />;
                }
                case 'register':
                    return <RegistrationPage onSwitchToLogin={() => setView('login')} initialRefCode={refCode} />;
                case 'forgotPassword':
                    return <ForgotPasswordPage 
                        onSwitchToLogin={() => setView('login')} 
                        onProceedToReset={(email) => {
                            setEmailForReset(email);
                            setView('resetPassword');
                        }}
                    />;
                case 'resetPassword':
                    return <ResetPasswordPage onSwitchToLogin={() => setView('login')} email={emailForReset} />;
                case 'landing':
                default:
                    return <LandingPage 
                        onNavigateToLogin={(softwareId, plan) => {
                            if (softwareId && plan) {
                                setPendingSubscription({ softwareId, plan });
                            } else {
                                setPendingSubscription(null);
                            }
                            setView('login');
                        }} 
                        onNavigateToRegister={() => {
                            setPendingSubscription(null);
                            setView('register');
                        }}
                    />;
            }
        }

        // Post-login logic
        if (pendingSubscription && user.role === UserRole.CUSTOMER) {
            return <CheckoutPage 
                pendingSubscription={pendingSubscription}
                onSubscriptionComplete={() => {
                    setPendingSubscription(null);
                    // Force a re-render to go to the customer portal
                    setUser({ ...user }); 
                }}
                onCancel={() => setPendingSubscription(null)}
            />
        }
        
        const unreadCount = notifications.filter(n => !n.isRead).length;

        return (
            <div className="flex">
                <nav className="w-16 md:w-56 bg-base-200 min-h-screen p-2 md:p-4 flex flex-col justify-between">
                    <div>
                        <div className="mb-8 p-2">
                            <img src={branding.logo} alt="Inflow logo" className="h-8 hidden md:block" />
                            <img src={branding.logo} alt="Inflow logo" className="h-8 w-auto md:hidden" />
                        </div>
                        <ul className="space-y-2">
                            <li>
                                <button onClick={() => setPage('portal')} className={`w-full text-left flex items-center p-2 rounded-lg transition-colors ${page === 'portal' ? 'bg-brand-primary text-white' : 'hover:bg-base-300'}`}>
                                    <span className="md:mr-3">🏠</span> <span className="hidden md:inline">Portal</span>
                                </button>
                            </li>
                             {user.role !== UserRole.CUSTOMER && (
                                <li className="relative">
                                    <button onClick={() => setShowNotifications(s => !s)} className={`w-full text-left flex items-center p-2 rounded-lg transition-colors hover:bg-base-300`}>
                                        <span className="md:mr-3 relative">
                                            🔔
                                            {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">{unreadCount}</span>}
                                        </span>
                                        <span className="hidden md:inline">Notifications</span>
                                    </button>
                                    {showNotifications && (
                                        <div className="absolute left-16 top-0 md:left-0 md:top-12 z-20 w-80 bg-base-300 rounded-lg shadow-xl border border-content-muted/20">
                                            <div className="p-3 font-bold text-white border-b border-base-200">Notifications</div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length > 0 ? notifications.map(n => (
                                                    <button key={n.id} onClick={() => handleNotificationClick(n)} className={`w-full text-left p-3 text-sm hover:bg-brand-primary/20 ${!n.isRead ? 'bg-brand-primary/10' : ''}`}>
                                                        <p className="font-bold text-white flex items-center">
                                                            <span className="mr-2">{getNotificationIcon(n.type)}</span>
                                                            {n.title}
                                                        </p>
                                                        <p className="text-content-muted pl-6">{n.message}</p>
                                                        <p className="text-xs text-content-muted/50 mt-1 pl-6">{new Date(n.createdAt).toLocaleString()}</p>
                                                    </button>
                                                )) : <p className="p-4 text-sm text-content-muted">No notifications yet.</p>}
                                            </div>
                                        </div>
                                    )}
                                </li>
                             )}
                            {user.role === UserRole.ADMIN && (
                                <li>
                                    <button onClick={() => setPage('system')} className={`w-full text-left flex items-center p-2 rounded-lg transition-colors ${page === 'system' ? 'bg-brand-primary text-white' : 'hover:bg-base-300'}`}>
                                       <span className="md:mr-3">🛠️</span> <span className="hidden md:inline">System Design</span>
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                     <button onClick={authContextValue.logout} className="w-full text-left flex items-center p-2 rounded-lg transition-colors hover:bg-red-500 hover:text-white">
                         <span className="md:mr-3">🚪</span> <span className="hidden md:inline">Logout</span>
                    </button>
                </nav>
                <main className="flex-1 min-h-screen bg-base-100">
                    {page === 'portal' ? renderPortal() : <SystemDesignPage />}
                </main>
            </div>
        );
    };

    return (
        <BrandingContext.Provider value={brandingContextValue}>
            <AuthContext.Provider value={authContextValue}>
                {renderAppContent()}
            </AuthContext.Provider>
        </BrandingContext.Provider>
    );
};

export default App;