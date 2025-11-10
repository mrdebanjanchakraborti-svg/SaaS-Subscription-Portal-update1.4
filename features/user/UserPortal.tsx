

import React, { useState, useEffect, useContext } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Customer, Subscription, Commission, Software, ProjectStatus } from '../../types';
import { api, mockSubscriptions, mockSoftware, mockCustomers, mockInvoices } from '../../services/mockApiService';
import { AuthContext } from '../../App';
import SupportPortal from '../support/SupportPortal';
import UserReportsPage from './UserReportsPage';
import ReferralProgramPage from './ReferralProgramPage';
import CrmPage from '../crm/CrmPage';
import CustomerManagementPage from './CustomerManagementPage';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-base-300 border border-content-muted/20 rounded-lg shadow-xl text-sm">
                <p className="font-bold text-white">{label}</p>
                {payload.map((pld: any) => (
                    <p className="text-content" key={pld.dataKey}>
                        <span style={{ color: pld.stroke || pld.fill }}>{pld.name}</span>: {formatCurrency(pld.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.REVIEW: return 'bg-yellow-900 text-yellow-300';
        case ProjectStatus.PENDING: return 'bg-orange-900 text-orange-300';
        case ProjectStatus.TRAINING: return 'bg-blue-900 text-blue-300';
        case ProjectStatus.COMPLETE: return 'bg-green-900 text-green-300';
        default: return 'bg-gray-700 text-gray-300';
    }
};

const StatCard: React.FC<{ title: string; value: string; icon: string }> = ({ title, value, icon }) => (
    <div className="bg-base-300 p-6 rounded-lg shadow-lg flex items-center space-x-4">
        <div className="bg-base-200 p-3 rounded-full">
            <span className="text-2xl">{icon}</span>
        </div>
        <div>
            <p className="text-content-muted text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

interface EnrichedSubscription extends Subscription {
    customerName: string;
    softwareName: string;
}

const UserDashboard: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [assignedCustomers, setAssignedCustomers] = useState<Customer[]>([]);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [activeSubscriptions, setActiveSubscriptions] = useState(0);
    const [enrichedSubscriptions, setEnrichedSubscriptions] = useState<EnrichedSubscription[]>([]);
    const [signupData, setSignupData] = useState<any[]>([]);
    const [revenueAndCommissionData, setRevenueAndCommissionData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);
            const [customers, comms, settings] = await Promise.all([
                api.getCustomersForUser(user.id),
                api.getCommissionsForUser(user.id),
                api.getAppSettings()
            ]);
            setAssignedCustomers(customers);
            setCommissions(comms);
            setBaseUrl(settings.baseUrl);

            // Calculate this month's revenue from assigned and referred customers
            const allCustomers = mockCustomers;
            const allInvoices = mockInvoices;

            const relatedCustomerIds = new Set<string>();
            allCustomers.forEach(customer => {
                if (customer.assignedToUserId === user.id || customer.referredByUserId === user.id) {
                    relatedCustomerIds.add(customer.id);
                }
            });

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const currentMonthRevenue = allInvoices
                .filter(inv => {
                    if (!inv.paymentDate || !relatedCustomerIds.has(inv.customerId)) {
                        return false;
                    }
                    const paymentDate = new Date(inv.paymentDate);
                    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
                })
                .reduce((acc, inv) => acc + inv.amount, 0);
            
            setMonthlyRevenue(currentMonthRevenue);

            const userSubscriptions = mockSubscriptions.filter(sub => relatedCustomerIds.has(sub.customerId));
            setActiveSubscriptions(userSubscriptions.length);
            
            // --- Enrich subscriptions with customer and software names for the table view ---
            const assignedCustomerIds = new Set(customers.map(c => c.id));
            const assignedSubscriptions = mockSubscriptions.filter(sub => assignedCustomerIds.has(sub.customerId));

            const enrichedSubs: EnrichedSubscription[] = assignedSubscriptions.map(sub => {
                const customer = customers.find(c => c.id === sub.customerId);
                const software = mockSoftware.find(s => s.id === sub.softwareId);
                return {
                    ...sub,
                    customerName: customer?.name || 'Unknown',
                    softwareName: software?.name || 'Unknown'
                };
            }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
            
            setEnrichedSubscriptions(enrichedSubs);

            // --- Chart Data ---
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const userCustomers = allCustomers.filter(customer => relatedCustomerIds.has(customer.id));
            const userInvoices = allInvoices.filter(inv => relatedCustomerIds.has(inv.customerId));

            // Revenue & Commission Chart Data
            const monthlyRevenueData = userInvoices
                .filter(inv => inv.paymentDate && new Date(inv.paymentDate) >= sixMonthsAgo)
                .reduce((acc, inv) => {
                    const date = new Date(inv.paymentDate as string);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
                    if (!acc[monthKey]) {
                        acc[monthKey] = {
                            name: date.toLocaleString('default', { month: 'short' }),
                            revenue: 0
                        };
                    }
                    acc[monthKey].revenue += inv.amount;
                    return acc;
                }, {} as Record<string, {name: string, revenue: number}>);
            
            const monthlyCommissionData = comms
                .filter(com => new Date(com.date) >= sixMonthsAgo)
                .reduce((acc, com) => {
                    const date = new Date(com.date);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
                    if (!acc[monthKey]) {
                        acc[monthKey] = {
                            name: date.toLocaleString('default', { month: 'short' }),
                            commission: 0,
                        };
                    }
                    acc[monthKey].commission += com.amount;
                    return acc;
                }, {} as Record<string, {name: string, commission: number}>);

            const allMonthKeys = new Set([...Object.keys(monthlyRevenueData), ...Object.keys(monthlyCommissionData)]);
            
            const mergedChartData = Array.from(allMonthKeys)
                .sort()
                .map(key => {
                    const revenueEntry = monthlyRevenueData[key];
                    const commissionEntry = monthlyCommissionData[key];
                    const name = revenueEntry?.name || commissionEntry?.name;

                    return {
                        name: name,
                        revenue: revenueEntry?.revenue || 0,
                        commission: commissionEntry?.commission || 0,
                    };
                });
            
            setRevenueAndCommissionData(mergedChartData);
            
            // Customer Signup Chart Data
            const signupDataMonthly = userCustomers
                .filter(cust => new Date(cust.signupDate) >= sixMonthsAgo)
                .reduce((acc, cust) => {
                    const date = new Date(cust.signupDate);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
                    if (!acc[monthKey]) {
                        acc[monthKey] = {
                            name: date.toLocaleString('default', { month: 'short' }),
                            signups: 0
                        };
                    }
                    acc[monthKey].signups += 1;
                    return acc;
                }, {} as Record<string, {name: string, signups: number}>);

            const signupChartData = Object.keys(signupDataMonthly).sort().map(key => signupDataMonthly[key]);
            setSignupData(signupChartData);

            setLoading(false);
        };
        fetchData();
    }, [user]);

    const totalCommission = commissions.reduce((sum, c) => sum + c.amount, 0);
    
    const fullReferralLink = user?.referralCode ? `${baseUrl || window.location.origin}/?ref=${user.referralCode}` : '';

    const copyReferralLink = () => {
        if (fullReferralLink) {
            navigator.clipboard.writeText(fullReferralLink);
            alert('Referral link copied to clipboard!');
        }
    };
    
    const handleShare = async () => {
        if (navigator.share && fullReferralLink) {
            try {
                await navigator.share({
                    title: 'Join me on InFlow!',
                    text: "Check out this SaaS platform. I think you'll find it useful.",
                    url: fullReferralLink,
                });
            } catch (error) {
                console.error('Share failed:', error);
            }
        }
    };
    

    if (loading) {
        return <div className="p-8 text-center">Loading your dashboard...</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 bg-base-100 min-h-full">
            <header>
                <h1 className="text-4xl font-bold text-white">Sales Dashboard</h1>
                <p className="text-content-muted mt-1">Welcome, {user?.name}!</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Assigned Customers" value={String(assignedCustomers.length)} icon="👥" />
                <StatCard title="Active Subscriptions" value={String(activeSubscriptions)} icon="📄" />
                <StatCard title="Total Commission Earned" value={formatCurrency(totalCommission)} icon="💰" />
                <StatCard title="This Month's Revenue" value={formatCurrency(monthlyRevenue)} icon="📈" />
                <div className="bg-base-300 p-6 rounded-lg shadow-lg md:col-span-2 lg:col-span-4">
                    <p className="text-content-muted text-sm">Your Referral Link</p>
                    <div className="flex items-center space-x-2 mt-2">
                        <input type="text" readOnly value={fullReferralLink || ''} className="w-full bg-base-200 text-content p-2 rounded-md text-sm" />
                        <button onClick={copyReferralLink} className="bg-brand-primary p-2 rounded-md hover:bg-brand-secondary" title="Copy link">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                        {navigator.share && (
                             <button onClick={handleShare} className="bg-brand-secondary p-2 rounded-md hover:bg-purple-500" title="Share link">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-base-300 p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-4">Revenue & Commission (Last 6 Months)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueAndCommissionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" tickFormatter={(value) => formatCurrency(Number(value))} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" name="Your Revenue" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="commission" name="Your Commission" stroke="#34d399" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                    {revenueAndCommissionData.length === 0 && (
                        <p className="text-center pt-8 text-content-muted">No revenue or commissions in the last 6 months.</p>
                    )}
                </div>
                <div className="bg-base-300 p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-white mb-4">Your Customer Signups (Last 6 Months)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={signupData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                                labelStyle={{ color: '#d1d5db' }}
                                itemStyle={{ color: '#7c3aed' }}
                            />
                            <Legend />
                            <Bar dataKey="signups" fill="#7c3aed" name="New Customers" />
                        </BarChart>
                    </ResponsiveContainer>
                     {signupData.length === 0 && (
                        <p className="text-center pt-8 text-content-muted">No new customer signups in the last 6 months.</p>
                    )}
                </div>
            </div>

            <div className="bg-base-300 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Assigned Customer Subscriptions</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-content">
                        <thead className="text-xs text-content-muted uppercase bg-base-200">
                            <tr>
                                <th scope="col" className="px-6 py-3">Customer Name</th>
                                <th scope="col" className="px-6 py-3">Software</th>
                                <th scope="col" className="px-6 py-3">Plan</th>
                                <th scope="col" className="px-6 py-3">Next Renewal</th>
                                <th scope="col" className="px-6 py-3">Renewal Amount</th>
                                <th scope="col" className="px-6 py-3">Project Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrichedSubscriptions.map(sub => (
                                <tr key={sub.id} className="bg-base-300 border-b border-base-200 hover:bg-base-100">
                                    <td className="px-6 py-4 font-medium text-white">{sub.customerName}</td>
                                    <td className="px-6 py-4">{sub.softwareName}</td>
                                    <td className="px-6 py-4">{sub.plan}</td>
                                    <td className="px-6 py-4">{new Date(sub.nextRenewalDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">{formatCurrency(sub.renewalAmount)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sub.status)}`}>{sub.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
             <div className="bg-base-300 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4">Commission Report</h2>
                 <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-content">
                        <thead className="text-xs text-content-muted uppercase bg-base-200">
                             <tr>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Customer Name</th>
                                <th scope="col" className="px-6 py-3">Commission Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                           {commissions.map(commission => {
                               const customer = assignedCustomers.find(c => c.id === commission.customerId);
                               return (
                                <tr key={commission.id} className="bg-base-300 border-b border-base-200 hover:bg-base-100">
                                    <td className="px-6 py-4">{new Date(commission.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-white">{customer?.name}</td>
                                    <td className="px-6 py-4 font-semibold text-green-400">{formatCurrency(commission.amount)}</td>
                                </tr>
                           )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

interface UserPortalProps {
    deepLink: { target: string; ticketId: string; } | null;
    clearDeepLink: () => void;
}

const UserPortal: React.FC<UserPortalProps> = ({ deepLink, clearDeepLink }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'support' | 'reports' | 'referral' | 'crm'>('dashboard');
    const [initialTicketId, setInitialTicketId] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (deepLink?.target === 'support' && deepLink.ticketId) {
            setActiveTab('support');
            setInitialTicketId(deepLink.ticketId);
            clearDeepLink();
        }
    }, [deepLink, clearDeepLink]);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <UserDashboard />;
            case 'customers':
                return <CustomerManagementPage />;
            case 'referral':
                return <ReferralProgramPage />;
            case 'crm':
                return <CrmPage />;
            case 'support':
                return <SupportPortal initialTicketId={initialTicketId} />;
            case 'reports':
                return <UserReportsPage />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-base-200 min-h-full">
            <div className="px-4 md:px-8 border-b border-base-300">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'dashboard'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-content-muted hover:text-white hover:border-gray-500'
                        }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'customers'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-content-muted hover:text-white hover:border-gray-500'
                        }`}
                    >
                        Customers
                    </button>
                     <button
                        onClick={() => setActiveTab('referral')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'referral'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-content-muted hover:text-white hover:border-gray-500'
                        }`}
                    >
                        Referral Program
                    </button>
                     <button
                        onClick={() => setActiveTab('crm')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'crm'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-content-muted hover:text-white hover:border-gray-500'
                        }`}
                    >
                        CRM
                    </button>
                    <button
                        onClick={() => setActiveTab('support')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'support'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-content-muted hover:text-white hover:border-gray-500'
                        }`}
                    >
                        Support
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'reports'
                                ? 'border-brand-primary text-brand-primary'
                                : 'border-transparent text-content-muted hover:text-white hover:border-gray-500'
                        }`}
                    >
                        Reports
                    </button>
                </nav>
            </div>

            <div key={activeTab} className="animate-fade-in">
                {renderContent()}
            </div>
        </div>
    );
};

export default UserPortal;