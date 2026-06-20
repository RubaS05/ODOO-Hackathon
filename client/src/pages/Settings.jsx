import React, { useState } from 'react';
import { usePOSStore } from '../store/posStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Store, Receipt, Wallet, Save } from 'lucide-react';

export const Settings = () => {
    const { storeSettings, updateStoreSettings } = usePOSStore();
    const [formData, setFormData] = useState({
        businessName: storeSettings?.businessName || 'GastroPOS',
        upiId: storeSettings?.upiId || 'prathaban009-1@okhdfcbank',
        defaultTaxRate: ((storeSettings?.defaultTaxRate || 0.10) * 100).toFixed(2),
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            updateStoreSettings({
                businessName: formData.businessName,
                upiId: formData.upiId,
                defaultTaxRate: parseFloat(formData.defaultTaxRate) / 100,
            });
            setIsSaving(false);
            alert("Settings updated successfully!");
        }, 500);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Store Settings</h1>
                    <p className="text-muted-foreground">Manage your business details, taxes, and payment configurations.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="text-primary" size={20} />
                            Business Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Business Name</label>
                            <Input 
                                name="businessName" 
                                value={formData.businessName} 
                                onChange={handleChange} 
                                placeholder="Enter your restaurant name"
                                required
                            />
                            <p className="text-xs text-muted-foreground">This name will appear on receipts and digital menus.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="text-primary" size={20} />
                            Tax Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Default Tax Rate (%)</label>
                            <Input 
                                type="number"
                                step="0.01"
                                min="0"
                                name="defaultTaxRate" 
                                value={formData.defaultTaxRate} 
                                onChange={handleChange} 
                                placeholder="e.g. 5.00"
                                required
                            />
                            <p className="text-xs text-muted-foreground">Default tax applied to all orders unless overridden by specific products.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="text-primary" size={20} />
                            Payment Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">UPI ID (VPA)</label>
                            <Input 
                                name="upiId" 
                                value={formData.upiId} 
                                onChange={handleChange} 
                                placeholder="example@upi"
                                required
                            />
                            <p className="text-xs text-muted-foreground">Used to dynamically generate QR codes for customers to scan and pay.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSaving} className="w-full sm:w-auto cursor-pointer">
                        {isSaving ? 'Saving...' : (
                            <>
                                <Save size={18} className="mr-2" /> Save Settings
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};
