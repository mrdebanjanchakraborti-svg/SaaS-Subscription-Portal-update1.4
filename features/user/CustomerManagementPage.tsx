
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Customer } from '../../types';
import { api } from '../../services/mockApiService';
import { AuthContext } from '../../App';

const CustomerManagementPage: React.FC = () => {
    const { user } = useContext(AuthContext);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setLoading(true);

            const [assigned, referred] = await Promise.all([
                api.getCustomersForUser(user.id),
                api.getReferredCustomersForUser(user.id)
            ]);
            
            const allCustomersMap = new Map<string, Customer>();
            assigned.forEach(c => allCustomersMap.set(c.id, c));
            referred.forEach(c => allCustomersMap.set(c.id, c));
            
            const uniqueCustomers = Array.from(allCustomersMap.values());

            setCustomers(uniqueCustomers.sort((a, b) => a.name.localeCompare(b.name)));
            setLoading(false);
        };

        fetchData();
    }, [user]);

    const filteredCustomers = useMemo(() => {
        return customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.company.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [customers, searchTerm]);

    if (loading) {
        return <div className="p-8 text-center">Loading your customers...</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            <h1 className="text-4xl font-bold text-white">My Customers</h1>
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
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map(customer => (
                                <tr key={customer.id} className="bg-base-200 border-b border-base-300 hover:bg-base-300">
                                    <td className="px-6 py-4 font-medium text-white">{customer.name}</td>
                                    <td className="px-6 py-4">
                                        <p>{customer.company}</p>
                                        <p className="text-xs text-content-muted">{customer.email}</p>
                                    </td>
                                    <td className="px-6 py-4">{customer.mobile || 'N/A'}</td>
                                    <td className="px-6 py-4">{customer.whatsapp || 'N/A'}</td>
                                    <td className="px-6 py-4">{customer.city || 'N/A'}</td>
                                    <td className="px-6 py-4">{customer.state || 'N/A'}</td>
                                    <td className="px-6 py-4">{customer.pin || 'N/A'}</td>
                                </tr>
                            ))}
                             {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-content-muted">No customers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerManagementPage;
