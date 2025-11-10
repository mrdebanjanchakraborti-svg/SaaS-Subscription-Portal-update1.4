
import React, { useState, useContext, useRef } from 'react';
import { BrandingContext } from '../../App';

const BrandingManagement: React.FC = () => {
    const { logo, banner, setBranding } = useContext(BrandingContext);

    const [newLogo, setNewLogo] = useState<string | null>(null);
    const [newBanner, setNewBanner] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (data: string | null) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async () => {
        const updates: Partial<{logo: string, banner: string | null}> = {};
        if (newLogo) {
            updates.logo = newLogo;
        }
        if (newBanner !== null) {
            updates.banner = newBanner || null; // Handle empty string for removal
        }

        if (Object.keys(updates).length > 0) {
            await setBranding(updates);
        }
        
        setNewLogo(null);
        setNewBanner(null);
        alert('Branding updated successfully!');
    };
    
    const handleClearBanner = () => {
        setNewBanner(''); // Use empty string to signify removal
    };


    return (
        <div className="p-4 md:p-8 space-y-8">
            <h1 className="text-4xl font-bold text-white">Branding & Appearance</h1>

            <div className="bg-base-200 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4 border-b border-base-300 pb-2">Logo Management</h2>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-content mb-2">Current Logo</h3>
                        <div className="bg-base-300 p-4 rounded-lg flex items-center justify-center min-h-[120px]">
                            <img src={logo} alt="Current logo" className="max-h-16" />
                        </div>
                    </div>
                    <div>
                         <h3 className="text-lg font-semibold text-content mb-2">Upload New Logo</h3>
                         <div className="p-4 border-2 border-dashed border-base-300 rounded-lg text-center min-h-[120px] flex flex-col justify-center">
                            {newLogo ? (
                                <img src={newLogo} alt="New logo preview" className="max-h-16 mx-auto mb-4" />
                            ) : (
                                <p className="text-content-muted mb-4">Preview will appear here.</p>
                            )}
                             <input 
                                type="file" 
                                accept="image/png, image/jpeg, image/svg+xml"
                                ref={logoInputRef}
                                onChange={(e) => handleFileChange(e, setNewLogo)}
                                className="hidden" 
                             />
                             <button onClick={() => logoInputRef.current?.click()} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary transition-colors">
                                Choose Logo...
                             </button>
                             <p className="text-xs text-content-muted mt-2">Recommended: PNG with transparent background, max 300px width.</p>
                         </div>
                    </div>
                </div>
            </div>

            <div className="bg-base-200 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold text-white mb-4 border-b border-base-300 pb-2">Landing Page Banner</h2>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-content mb-2">Current Banner</h3>
                        <div className="bg-base-300 p-4 rounded-lg flex items-center justify-center min-h-[200px]">
                            {banner ? (
                                <img src={banner} alt="Current banner" className="max-w-full max-h-40 rounded-md" />
                            ): (
                                <p className="text-content-muted">No banner is currently set.</p>
                            )}
                        </div>
                    </div>
                    <div>
                         <h3 className="text-lg font-semibold text-content mb-2">Upload New Banner</h3>
                         <div className="p-4 border-2 border-dashed border-base-300 rounded-lg text-center min-h-[200px] flex flex-col justify-center">
                            {newBanner ? (
                                <img src={newBanner} alt="New banner preview" className="max-w-full max-h-40 mx-auto mb-4 rounded-md" />
                            ) : (
                                <p className="text-content-muted mb-4">Preview will appear here.</p>
                            )}
                             <input 
                                type="file" 
                                accept="image/png, image/jpeg"
                                ref={bannerInputRef}
                                onChange={(e) => handleFileChange(e, setNewBanner)}
                                className="hidden" 
                             />
                             <div className="flex justify-center gap-x-2">
                                <button onClick={() => bannerInputRef.current?.click()} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary transition-colors">
                                    Choose Banner...
                                </button>
                                <button onClick={handleClearBanner} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors">
                                    Remove Banner
                                </button>
                             </div>
                             <p className="text-xs text-content-muted mt-2">Recommended: 1200px by 400px. JPG or PNG.</p>
                         </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button 
                    onClick={handleSaveChanges} 
                    disabled={!newLogo && newBanner === null}
                    className="bg-green-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Save All Changes
                </button>
            </div>
        </div>
    );
};

export default BrandingManagement;