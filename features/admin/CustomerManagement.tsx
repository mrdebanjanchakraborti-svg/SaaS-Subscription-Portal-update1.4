import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Customer, User, UserRole } from '../../types';
import { api } from '../../services/mockApiService';

const CustomerManagement: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [customerData, userData] = await Promise.all([
            api.getAllCustomers(),
            api.getAllUsers()
        ]);
        setCustomers(customerData);
        setUsers(userData);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleReassignCustomer = async (customerId: string, newUserId: string) => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return;

        const originalUserId = customer.assignedToUserId;
        if (newUserId === (originalUserId || '')) return; // No actual change

        const originalCustomers = customers;
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, assignedToUserId: newUserId || undefined } : c));

        const customerName = customer.name;
        const newUserName = users.find(u => u.id === newUserId)?.name || '"Unassigned"';

        if (window.confirm(`Are you sure you want to assign customer "${customerName}" to ${newUserName}?`)) {
            const result = await api.reassignCustomer(customerId, newUserId || undefined);
            if (result.success) {
                 const newUser = users.find(u => u.id === newUserId);
                 if(newUser) {
                    const subject = `New Customer Assigned: ${customer.name}`;
                    const body = `Hello ${newUser.name},\n\nCustomer "${customer.name}" from ${customer.company} has been assigned to you.\n\nPlease review their details in the portal.\n\nThanks,\nInFlow Team`;
                    await api.sendEmail(newUser.email, subject, body);
                 }
            } else {
                alert(result.message);
                setCustomers(originalCustomers);
            }
        } else {
            setCustomers(originalCustomers);
        }
    };
    
    const handleInputChange = (customerId: string, field: keyof Customer, value: string) => {
        setCustomers(prev => prev.map(c => 
            c.id === customerId ? { ...c, [field]: value } : c
        ));
    };

    const handleInputBlur = async (customerId: string, field: keyof Customer, value: string) => {
        await api.updateCustomerDetails(customerId, { [field]: value });
        // In a real app, you might want to add success/error feedback here
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.company.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customers, searchTerm]);

    if (loading) {
        return <div className="p-8 text-center">Loading customer data...</div>;
    }

    const inputClasses = "bg-base-300 text-white p-1 rounded-md border border-base-300 focus:ring-1 focus:ring-brand-primary focus:outline-none w-full";

    return (
        <div className="p-4 md:p-8 space-y-8">
            <h1 className="text-4xl font-bold text-white">Customer Management</h1>
            <div className="bg-base-200 p-6 rounded-lg shadow-lg">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by customer name or company..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-1/3 bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-content">
                        <thead className="text-xs text-content-muted uppercase bg-base-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Company</th>
                                <th scope="col" className="px-6 py-3">Phone</th>
                                <th scope="col" className="px-6 py-3">WhatsApp</th>
                                <th scope="col" className="px-6 py-3">City</th>
                                <th scope="col" className="px-6 py-3">State</th>
                                <th scope="col" className="px-6 py-3">PIN Code</th>
                                <th scope="col" className="px-6 py-3">Assigned User</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => (
                                <tr key={customer.id} className="bg-base-200 border-b border-base-300 hover:bg-base-300">
                                    <td className="px-6 py-4 align-top">
                                        <input
                                            type="text"
                                            value={customer.name}
                                            onChange={(e) => handleInputChange(customer.id, 'name', e.target.value)}
                                            onBlur={(e) => handleInputBlur(customer.id, 'name', e.target.value)}
                                            className={inputClasses}
                                        />
                                    </td>
                                     <td className="px-6 py-4 align-top">
                                        <p className="pt-1">{customer.company}</p>
                                        <p className="text-xs text-content-muted">{customer.email}</p>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <input
                                            type="text"
                                            value={customer.mobile || ''}
                                            onChange={(e) => handleInputChange(customer.id, 'mobile', e.target.value)}
                                            onBlur={(e) => handleInputBlur(customer.id, 'mobile', e.target.value)}
                                            className={inputClasses}
                                            placeholder="N/A"
                                        />
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <input
                                            type="text"
                                            value={customer.whatsapp || ''}
                                            onChange={(e) => handleInputChange(customer.id, 'whatsapp', e.target.value)}
                                            onBlur={(e) => handleInputBlur(customer.id, 'whatsapp', e.target.value)}
                                            className={inputClasses}
                                            placeholder="N/A"
                                        />
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                         <input
                                            type="text"
                                            value={customer.city || ''}
                                            onChange={(e) => handleInputChange(customer.id, 'city', e.target.value)}
                                            onBlur={(e) => handleInputBlur(customer.id, 'city', e.target.value)}
                                            className={inputClasses}
                                            placeholder="N/A"
                                        />
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                         <input
                                            type="text"
                                            value={customer.state || ''}
                                            onChange={(e) => handleInputChange(customer.id, 'state', e.target.value)}
                                            onBlur={(e) => handleInputBlur(customer.id, 'state', e.target.value)}
                                            className={inputClasses}
                                            placeholder="N/A"
                                        />
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                         <input
                                            type="text"
                                            value={customer.pin || ''}
                                            onChange={(e) => handleInputChange(customer.id, 'pin', e.target.value)}
                                            onBlur={(e) => handleInputBlur(customer.id, 'pin', e.target.value)}
                                            className={inputClasses}
                                            placeholder="N/A"
                                        />
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                       <select
                                            value={customer.assignedToUserId || ''}
                                            onChange={(e) => handleReassignCustomer(customer.id, e.target.value)}
                                            className="bg-base-100 text-white p-2 rounded-md border border-base-100 focus:ring-2 focus:ring-brand-primary focus:outline-none w-full max-w-xs"
                                        >
                                            <option value="">-- Unassigned --</option>
                                            {users.filter(u => u.role === UserRole.USER).map(user => (
                                                <option key={user.id} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerManagement;