

import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Customer, Subscription, User, ProjectStatus, UserRole, Software } from '../../types';
import { api, mockSubscriptions, mockSoftware, mockCustomers, mockUsers } from '../../services/mockApiService';
import { AuthContext } from '../../App';

interface EnrichedSubscription extends Subscription {
    customerName: string;
    customerCompany: string;
    customerEmail: string;
    softwareName: string;
}

const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
        case ProjectStatus.REVIEW: return { bg: 'bg-yellow-900/50', border: 'border-yellow-500' };
        case ProjectStatus.PENDING: return { bg: 'bg-orange-900/50', border: 'border-orange-500' };
        case ProjectStatus.TRAINING: return { bg: 'bg-blue-900/50', border: 'border-blue-500' };
        case ProjectStatus.COMPLETE: return { bg: 'bg-green-900/50', border: 'border-green-500' };
        default: return { bg: 'bg-gray-800/50', border: 'border-gray-600' };
    }
};


interface CustomerCardProps {
    subscription: EnrichedSubscription;
    onEdit: (subscription: EnrichedSubscription) => void;
}
const CustomerCard: React.FC<CustomerCardProps> = ({ subscription, onEdit }) => {
    const { user } = useContext(AuthContext);
    const isOverdue = subscription.nextActionDate && new Date(subscription.nextActionDate) < new Date() && subscription.status !== ProjectStatus.COMPLETE;

    return (
        <div className="bg-base-300 p-4 rounded-lg shadow-md mb-3 cursor-grab active:cursor-grabbing border-l-4 border-brand-primary">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-white text-md">{subscription.customerName}</h4>
                    <p className="text-sm text-content-muted">{subscription.customerCompany}</p>
                </div>
                <button onClick={() => onEdit(subscription)} className="text-content-muted hover:text-white p-1 rounded-full">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                </button>
            </div>
            <p className="text-xs text-content-muted mt-2">{subscription.softwareName}</p>
            {subscription.nextActionDate && (
                 <p className={`text-xs mt-2 font-semibold flex items-center ${isOverdue ? 'text-red-400' : 'text-content-muted'}`}>
                    <span className="mr-1">📅</span> Next Action: {new Date(subscription.nextActionDate).toLocaleDateString()}
                 </p>
            )}
            {subscription.remarks && (
                <div className="mt-2 pt-2 border-t border-base-100">
                    <p className="text-xs text-content-muted italic whitespace-pre-wrap truncate">"{subscription.remarks}"</p>
                </div>
            )}
        </div>
    );
};

const EditModal: React.FC<{
    subscription: EnrichedSubscription;
    onClose: () => void;
    onSave: (subscriptionId: string, updates: { nextActionDate?: string, remarks?: string }) => void;
}> = ({ subscription, onClose, onSave }) => {
    const { user } = useContext(AuthContext);
    const [nextActionDate, setNextActionDate] = useState(subscription.nextActionDate || '');
    const [remarks, setRemarks] = useState(subscription.remarks || '');
    const isUser = user?.role === UserRole.USER;
    const isAdmin = user?.role === UserRole.ADMIN;

    const handleSave = () => {
        onSave(subscription.id, {
            nextActionDate: nextActionDate || undefined,
            remarks: remarks || undefined,
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-base-200 p-6 rounded-lg shadow-xl max-w-lg w-full">
                <div className="flex justify-between items-center border-b border-base-300 pb-3 mb-4">
                    <h2 className="text-2xl font-bold text-white">Details for {subscription.customerName}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-base-300 text-2xl leading-none">&times;</button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-content-muted mb-1">Next Action Date</label>
                        <input
                            type="date"
                            value={nextActionDate}
                            onChange={(e) => setNextActionDate(e.target.value)}
                            disabled={!isUser}
                            className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none disabled:opacity-70"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-content-muted mb-1">Remarks</label>
                        <textarea
                            rows={5}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            disabled={!isUser}
                            placeholder={isAdmin ? "No remarks added." : "Add remarks for follow-up..."}
                            className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none disabled:opacity-70"
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-base-300">
                    <button onClick={onClose} className="bg-base-300 text-white font-bold py-2 px-6 rounded-lg hover:bg-base-100 transition-colors">
                        {isUser ? 'Cancel' : 'Close'}
                    </button>
                    {isUser && (
                        <button onClick={handleSave} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-secondary transition-colors">
                            Save Changes
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


const CrmPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [subscriptions, setSubscriptions] = useState<EnrichedSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSub, setEditingSub] = useState<EnrichedSubscription | null>(null);
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);

            let relevantCustomers: Customer[];
            if (user.role === UserRole.ADMIN) {
                relevantCustomers = await api.getAllCustomers();
            } else {
                relevantCustomers = await api.getCustomersForUser(user.id);
            }

            const customerIds = new Set(relevantCustomers.map(c => c.id));
            const allSubscriptions = mockSubscriptions; // In real app, this would be an API call
            const userSubscriptions = allSubscriptions.filter(s => customerIds.has(s.customerId));
            
            const enrichedData = userSubscriptions.map(sub => {
                const customer = relevantCustomers.find(c => c.id === sub.customerId);
                const software = mockSoftware.find(s => s.id === sub.softwareId);
                return {
                    ...sub,
                    customerName: customer?.name || 'N/A',
                    customerCompany: customer?.company || 'N/A',
                    customerEmail: customer?.email || '',
                    softwareName: software?.name || 'N/A',
                };
            });

            setSubscriptions(enrichedData);
            setLoading(false);
        };
        fetchData();
    }, [user]);
    
    const filteredSubscriptions = useMemo(() => {
        return subscriptions.filter(s => {
            const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.customerCompany.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.softwareName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesDate = !dateFilter || s.nextActionDate === dateFilter;

            return matchesSearch && matchesDate;
        });
    }, [subscriptions, searchTerm, dateFilter]);

    const kanbanColumns = useMemo(() => {
        const columns: { [key in ProjectStatus]: EnrichedSubscription[] } = {
            [ProjectStatus.REVIEW]: [],
            [ProjectStatus.PENDING]: [],
            [ProjectStatus.TRAINING]: [],
            [ProjectStatus.COMPLETE]: [],
        };
        filteredSubscriptions.forEach(sub => {
            if (columns[sub.status]) {
                columns[sub.status].push(sub);
            }
        });
        return columns;
    }, [filteredSubscriptions]);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, subscriptionId: string) => {
        e.dataTransfer.setData('subscriptionId', subscriptionId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, newStatus: ProjectStatus) => {
        e.preventDefault();
        const subscriptionId = e.dataTransfer.getData('subscriptionId');
        if (!subscriptionId) return;
        
        const subscription = subscriptions.find(s => s.id === subscriptionId);
        if (!subscription || subscription.status === newStatus) return;

        const originalSubscriptions = [...subscriptions];
        
        // Optimistic UI update
        setSubscriptions(prevSubs => prevSubs.map(s => 
            s.id === subscriptionId ? { ...s, status: newStatus } : s
        ));

        try {
            await api.updateSubscriptionDetails(subscriptionId, { status: newStatus });
            // Send email notification to customer
            const subject = `Update on your ${subscription.softwareName} Subscription`;
            const body = `Hi ${subscription.customerName},\n\nThe status of your project for ${subscription.softwareName} has been updated to "${newStatus}".\n\nOur team is working on it and will be in touch with the next steps.\n\nThanks,\nInFlow Team`;
            await api.sendEmail(subscription.customerEmail, subject, body);
        } catch (error) {
            console.error("Failed to update status", error);
            setSubscriptions(originalSubscriptions); // Revert on failure
            alert("Failed to update status. Please try again.");
        }
    };

    const handleSaveDetails = async (subscriptionId: string, updates: { nextActionDate?: string; remarks?: string }) => {
        const originalSubscriptions = [...subscriptions];
        
        // Optimistic UI update and close modal
        setSubscriptions(prevSubs => prevSubs.map(s => 
            s.id === subscriptionId ? { ...s, ...updates } : s
        ));
        setEditingSub(null); 
    
        try {
            await api.updateSubscriptionDetails(subscriptionId, updates);
            // Send email notification to the user who made the change
            if (user && updates.nextActionDate) {
                const subscription = subscriptions.find(s => s.id === subscriptionId);
                const subject = `CRM Task Update for ${subscription?.customerName}`;
                const body = `Hello ${user.name},\n\nA next action date has been set for ${updates.nextActionDate} regarding the ${subscription?.softwareName} subscription for ${subscription?.customerName}.\n\nRemarks: ${updates.remarks || 'N/A'}\n\nThis is a reminder for your records.`;
                await api.sendEmail(user.email, subject, body);
            }
        } catch (error) {
            console.error("Failed to save details", error);
            setSubscriptions(originalSubscriptions); // Revert on failure
            alert("Failed to save details. Please try again.");
        }
    };


    if (loading) {
        return <div className="p-8 text-center">Loading CRM...</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 min-h-full flex flex-col">
            <header className="flex-shrink-0">
                <h1 className="text-4xl font-bold text-white">Customer Relationship Management</h1>
                <p className="text-content-muted mt-1">Manage your customer pipeline with a drag & drop interface.</p>
            </header>
            
            <div className="mb-4 flex-shrink-0 flex flex-wrap gap-4 items-center">
                <input
                    type="text"
                    placeholder="Search by customer, company, or software..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 bg-base-200 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                />
                 <div className="flex items-center gap-2">
                    <label htmlFor="actionDate" className="text-sm text-content-muted">Next Action Date:</label>
                    <input
                        id="actionDate"
                        type="date"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        className="bg-base-200 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                </div>
                {dateFilter && (
                    <button
                        onClick={() => setDateFilter('')}
                        className="text-sm text-brand-primary hover:underline"
                    >
                        Clear Filter
                    </button>
                )}
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* FIX: Use Object.keys to iterate over kanbanColumns to preserve type information. Object.entries infers values as 'unknown'. */}
                {Object.keys(kanbanColumns).map((status) => {
                    const statusTyped = status as ProjectStatus;
                    const subs = kanbanColumns[statusTyped];
                    const { bg, border } = getStatusColor(statusTyped);
                    return (
                        <div 
                            key={status}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, statusTyped)}
                            className={`p-4 rounded-lg ${bg} border-t-4 ${border} transition-colors duration-300 ease-in-out flex flex-col`}
                        >
                            <h3 className="text-lg font-bold text-white mb-4 flex justify-between items-center flex-shrink-0">
                                <span>{status}</span>
                                <span className="text-sm font-normal bg-base-300 text-content-muted px-2 py-1 rounded-full">{subs.length}</span>
                            </h3>
                            <div className="space-y-3 flex-grow overflow-y-auto">
                                {subs.length > 0 ? subs.map(sub => (
                                    <div 
                                        key={sub.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, sub.id)}
                                    >
                                        <CustomerCard subscription={sub} onEdit={setEditingSub} />
                                    </div>
                                )) : <p className="text-sm text-content-muted text-center p-4">No customers in this stage.</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
             {editingSub && (
                <EditModal 
                    subscription={editingSub} 
                    onClose={() => setEditingSub(null)}
                    onSave={handleSaveDetails}
                />
            )}
        </div>
    );
};

export default CrmPage;