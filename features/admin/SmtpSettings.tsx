import React, { useState, useEffect } from 'react';
import { api } from '../../services/mockApiService';
import { SmtpConfig, AppSettings, PaymentGatewaySettings } from '../../types';

const SettingsPage: React.FC = () => {
    const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
        host: '',
        port: 587,
        user: '',
        pass: '',
        encryption: 'ssl',
        fromName: '',
        fromEmail: ''
    });
     const [appSettings, setAppSettings] = useState<AppSettings>({
        baseUrl: ''
    });
    const [paymentSettings, setPaymentSettings] = useState<PaymentGatewaySettings>({
        razorpay: { keyId: '', keySecret: '', enabled: false },
        paypal: { clientId: '', clientSecret: '', enabled: false }
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    
    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            const [savedSmtpConfig, savedAppSettings, savedPaymentSettings] = await Promise.all([
                api.getSmtpConfig(),
                api.getAppSettings(),
                api.getPaymentGatewaySettings()
            ]);
            if (savedSmtpConfig) {
                setSmtpConfig(savedSmtpConfig);
            }
             if (savedAppSettings) {
                setAppSettings(savedAppSettings);
            }
            if (savedPaymentSettings) {
                setPaymentSettings(savedPaymentSettings);
            }
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const handleSmtpChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSmtpConfig(prev => ({ ...prev, [name]: name === 'port' ? parseInt(value) || 0 : value }));
    };
    
    const handleAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAppSettings(prev => ({...prev, [name]: value }));
    }

    const handlePaymentChange = (gateway: 'razorpay' | 'paypal', e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPaymentSettings(prev => ({
            ...prev,
            [gateway]: {
                ...prev[gateway],
                [name]: value
            }
        }));
    };

    const handlePaymentToggle = (gateway: 'razorpay' | 'paypal') => {
        setPaymentSettings(prev => ({
            ...prev,
            [gateway]: {
                ...prev[gateway],
                enabled: !prev[gateway].enabled
            }
        }));
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSaveMessage('');
        await Promise.all([
            api.setSmtpConfig(smtpConfig),
            api.setAppSettings(appSettings),
            api.setPaymentGatewaySettings(paymentSettings)
        ]);
        setSaving(false);
        setSaveMessage('Settings saved successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        const result = await api.testSmtpConnection(smtpConfig);
        setTestResult(result);
        setTesting(false);
    };

    if (loading) {
        return <div className="p-8 text-center">Loading settings...</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8">
            <h1 className="text-4xl font-bold text-white">Application Settings</h1>

            <form onSubmit={handleSaveChanges} className="space-y-8">
                <div className="bg-base-200 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4 border-b border-base-300 pb-2">Email Server (SMTP) Settings</h2>
                    <p className="text-sm text-content-muted mb-6">Configure your SMTP server to enable sending real emails. If not configured, emails will only be simulated and logged in the console.</p>
                    <div className="space-y-6">
                        {/* Server and Port */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-content-muted mb-1">SMTP Host</label>
                                <input type="text" name="host" value={smtpConfig.host} onChange={handleSmtpChange} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="smtp.example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-content-muted mb-1">Port</label>
                                <input type="number" name="port" value={smtpConfig.port} onChange={handleSmtpChange} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                        </div>
                        {/* Username and Password */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-content-muted mb-1">Username</label>
                                <input type="text" name="user" value={smtpConfig.user} onChange={handleSmtpChange} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="your-email@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-content-muted mb-1">Password</label>
                                <input type="password" name="pass" value={smtpConfig.pass} onChange={handleSmtpChange} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="••••••••••••" />
                            </div>
                        </div>
                         {/* Encryption and From */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-content-muted mb-1">Encryption</label>
                                 <select name="encryption" value={smtpConfig.encryption} onChange={handleSmtpChange} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none">
                                    <option value="ssl">SSL / TLS</option>
                                    <option value="none">None</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 grid grid-cols-2 gap-6">
                                 <div>
                                    <label className="block text-sm font-medium text-content-muted mb-1">"From" Name</label>
                                    <input type="text" name="fromName" value={smtpConfig.fromName} onChange={handleSmtpChange} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="InFlow Support" />
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-content-muted mb-1">"From" Email</label>
                                    <input type="email" name="fromEmail" value={smtpConfig.fromEmail} onChange={handleSmtpChange} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="support@example.com" />
                                </div>
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-base-300 flex justify-start items-center">
                             <button 
                                type="button" 
                                onClick={handleTestConnection} 
                                disabled={testing}
                                className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50"
                            >
                                {testing ? 'Testing...' : 'Test Connection'}
                             </button>
                             {testResult && (
                                <p className={`text-sm ml-4 inline-block ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>{testResult.message}</p>
                             )}
                        </div>
                    </div>
                </div>

                <div className="bg-base-200 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4 border-b border-base-300 pb-2">Payment Gateway Settings</h2>
                    
                    {/* Razorpay */}
                    <div className="space-y-6 border-b border-base-300 pb-6 mb-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-white">Razorpay</h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={paymentSettings.razorpay.enabled} onChange={() => handlePaymentToggle('razorpay')} className="sr-only peer" />
                                <div className="w-11 h-6 bg-base-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                <span className="ml-3 text-sm font-medium text-content">{paymentSettings.razorpay.enabled ? 'Enabled' : 'Disabled'}</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-content-muted mb-1">Key ID</label>
                                <input type="text" name="keyId" value={paymentSettings.razorpay.keyId} onChange={(e) => handlePaymentChange('razorpay', e)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-content-muted mb-1">Key Secret</label>
                                <input type="password" name="keySecret" value={paymentSettings.razorpay.keySecret} onChange={(e) => handlePaymentChange('razorpay', e)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                        </div>
                    </div>
                    
                    {/* PayPal */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-semibold text-white">PayPal</h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={paymentSettings.paypal.enabled} onChange={() => handlePaymentToggle('paypal')} className="sr-only peer" />
                                <div className="w-11 h-6 bg-base-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-brand-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                <span className="ml-3 text-sm font-medium text-content">{paymentSettings.paypal.enabled ? 'Enabled' : 'Disabled'}</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-content-muted mb-1">Client ID</label>
                                <input type="text" name="clientId" value={paymentSettings.paypal.clientId} onChange={(e) => handlePaymentChange('paypal', e)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-content-muted mb-1">Client Secret</label>
                                <input type="password" name="clientSecret" value={paymentSettings.paypal.clientSecret} onChange={(e) => handlePaymentChange('paypal', e)} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" />
                            </div>
                        </div>
                    </div>
                </div>


                 <div className="bg-base-200 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4 border-b border-base-300 pb-2">Domain & URL Settings</h2>
                    <p className="text-sm text-content-muted mb-6">Set your application's public base URL. This is used to generate correct links, like referral links.</p>
                     <div>
                        <label className="block text-sm font-medium text-content-muted mb-1">Base URL</label>
                        <input type="url" name="baseUrl" value={appSettings.baseUrl} onChange={handleAppChange} className="w-full bg-base-300 text-white p-2 rounded-md border border-base-300 focus:ring-2 focus:ring-brand-primary focus:outline-none" placeholder="https://your-domain.com" />
                    </div>
                </div>

                <div className="max-w-4xl mx-auto flex justify-end items-center">
                     {saveMessage && <p className="text-sm text-green-400 mr-4">{saveMessage}</p>}
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default SettingsPage;