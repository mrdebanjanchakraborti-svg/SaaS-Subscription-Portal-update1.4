import React, { useState, useEffect, useCallback } from 'react';
import { EmailLog } from '../../types';
import { api } from '../../services/mockApiService';

const EmailLogsPage: React.FC = () => {
    const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        const logs = await api.getEmailLogs();
        setEmailLogs(logs);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    if (loading) {
        return <div className="p-8 text-center">Loading email logs...</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Modal to view email body */}
            {selectedEmail && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-base-200 p-6 rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="flex justify-between items-center border-b border-base-300 pb-3 mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">{selectedEmail.subject}</h2>
                                <p className="text-sm text-content-muted">To: {selectedEmail.recipient}</p>
                            </div>
                            <button onClick={() => setSelectedEmail(null)} className="p-1 rounded-full hover:bg-base-300 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                             <pre className="text-content whitespace-pre-wrap font-sans text-sm">{selectedEmail.body}</pre>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold text-white">Email Notification Logs</h1>
                 <button
                    onClick={fetchLogs}
                    className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary transition-colors"
                >
                    &#x21bb; Refresh Logs
                </button>
            </div>
            <div className="bg-base-200 p-6 rounded-lg shadow-lg">
                <p className="text-sm text-content-muted mb-4">This is a log of all automated emails simulated by the system.</p>
                 <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left text-content">
                        <thead className="text-xs text-content-muted uppercase bg-base-300">
                             <tr>
                                <th scope="col" className="px-6 py-3">Timestamp</th>
                                <th scope="col" className="px-6 py-3">Recipient</th>
                                <th scope="col" className="px-6 py-3">Subject</th>
                                <th scope="col" className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                           {emailLogs.map(log => (
                                <tr key={log.id} className="bg-base-200 border-b border-base-300 hover:bg-base-300">
                                    <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-medium text-white">{log.recipient}</td>
                                    <td className="px-6 py-4">{log.subject}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => setSelectedEmail(log)} className="text-brand-primary hover:underline">View Email</button>
                                    </td>
                                </tr>
                           ))}
                            {emailLogs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-content-muted">No emails have been sent yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmailLogsPage;
