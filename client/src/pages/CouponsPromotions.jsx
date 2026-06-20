import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Power, PowerOff } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Pagination } from '../components/ui/Pagination';
import { apiService as api } from '../services/api';

export const CouponsPromotions = () => {
    const { coupons, promotions, products, setCoupons, setPromotions, deleteCoupon, deletePromotion } = usePOSStore();
    const [activeTab, setActiveTab] = useState('coupons');
    
    // Banner states
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [showPromoForm, setShowPromoForm] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [fetchedCoupons, fetchedPromotions] = await Promise.all([
                api.coupons.getAll(),
                api.promotions.getAll()
            ]);
            setCoupons(fetchedCoupons);
            setPromotions(fetchedPromotions);
        } catch (error) {
            console.error("Failed to load coupons/promotions:", error);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        setShowCouponForm(false);
        setShowPromoForm(false);
    }, [activeTab]);

    const currentList = activeTab === 'coupons' ? coupons : promotions;
    const totalPages = Math.ceil(currentList.length / rowsPerPage) || 1;
    
    const paginatedCoupons = coupons.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const paginatedPromotions = promotions.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Coupon form states
    const [couponCode, setCouponCode] = useState('');
    const [couponType, setCouponType] = useState('percentage');
    const [couponVal, setCouponVal] = useState('');
    const [couponMin, setCouponMin] = useState('');
    
    // Promo form states
    const [promoName, setPromoName] = useState('');
    const [promoType, setPromoType] = useState('product');
    const [promoMinQty, setPromoMinQty] = useState('2');
    const [promoMinAmt, setPromoMinAmt] = useState('100');
    const [promoDiscountType, setPromoDiscountType] = useState('percentage');
    const [promoDiscountVal, setPromoDiscountVal] = useState('50');
    const [promoProductId, setPromoProductId] = useState('');

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        if (!couponCode || !couponVal) return;
        try {
            await api.coupons.create({
                code: couponCode.toUpperCase().replace(/ /g, ''),
                discountType: couponType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
                discountValue: Number(couponVal),
                active: true,
                // minAmount: couponMin ? Number(couponMin) : undefined // Backend doesn't have minAmount yet but could be added later
            });
            await fetchData();
            setCouponCode('');
            setCouponVal('');
            setCouponMin('');
            setShowCouponForm(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreatePromo = async (e) => {
        e.preventDefault();
        if (!promoName || !promoDiscountVal) return;
        try {
            await api.promotions.create({
                name: promoName,
                // type: promoType,
                // minQuantity: promoType === 'product' ? Number(promoMinQty) : undefined,
                // minAmount: promoType === 'order' ? Number(promoMinAmt) : undefined,
                discountType: promoDiscountType === 'fixed' ? 'FIXED_AMOUNT' : 'PERCENTAGE',
                discountValue: Number(promoDiscountVal),
                active: true
                // productId: promoType === 'product' ? (promoProductId || products[0]?.id) : undefined,
            });
            await fetchData();
            setPromoName('');
            setShowPromoForm(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleCoupon = async (id) => {
        try {
            await api.coupons.toggleActive(id);
            await fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleTogglePromo = async (id) => {
        try {
            await api.promotions.toggleActive(id);
            await fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const getProductName = (prodId) => {
        return products.find(p => p.id === prodId)?.name || 'Unknown Product';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Coupons & Promos</h1>
                    <p className="text-muted-foreground">Manage code vouchers, discount campaigns, and item rules.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-card p-1.5 rounded-lg border border-border/60 max-w-xs">
                <button onClick={() => setActiveTab('coupons')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'coupons' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    Coupons
                </button>
                <button onClick={() => setActiveTab('promotions')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'promotions' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    Promotions
                </button>
            </div>

            {/* Coupon Banner Form */}
            {activeTab === 'coupons' && showCouponForm && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-primary">Create New Coupon</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowCouponForm(false)}>Cancel</Button>
                    </div>
                    <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <Input label="Coupon Code" placeholder="e.g. SAVEMORE20" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} required />
                        <Select label="Discount Type" value={couponType} onChange={(e) => setCouponType(e.target.value)} required>
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Flat ($)</option>
                        </Select>
                        <Input label="Discount Value" placeholder="e.g. 10 or 15.00" type="number" step="0.01" value={couponVal} onChange={(e) => setCouponVal(e.target.value)} required />
                        <Button type="submit" className="font-bold h-10 w-full">Create Coupon</Button>
                    </form>
                </div>
            )}

            {/* Promotion Banner Form */}
            {activeTab === 'promotions' && showPromoForm && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-primary">Create Marketing Promotion</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowPromoForm(false)}>Cancel</Button>
                    </div>
                    <form onSubmit={handleCreatePromo} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <Input label="Promotion Name" placeholder="e.g. Pizza Sunday" value={promoName} onChange={(e) => setPromoName(e.target.value)} required />
                        <Select label="Discount Type" value={promoDiscountType} onChange={(e) => setPromoDiscountType(e.target.value)} required>
                            <option value="percentage">Percentage (%)</option>
                            <option value="fixed">Fixed Flat ($)</option>
                        </Select>
                        <Input label="Discount Value" type="number" step="0.01" value={promoDiscountVal} onChange={(e) => setPromoDiscountVal(e.target.value)} required />
                        <Button type="submit" className="font-bold h-10 w-full">Create Promotion</Button>
                    </form>
                </div>
            )}

            {/* Coupons View */}
            {activeTab === 'coupons' && (
                <div className="space-y-4">
                    {!showCouponForm && (
                        <Button onClick={() => setShowCouponForm(true)} className="font-bold text-xs h-9 cursor-pointer">
                            <Plus size={14} className="mr-1.5" /> Add Coupon
                        </Button>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Coupon Code</TableHead>
                                <TableHead>Discount Value</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedCoupons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No coupons created yet.</TableCell>
                                </TableRow>
                            ) : paginatedCoupons.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="font-mono font-bold text-xs">
                                        <span className="bg-primary/10 text-primary px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                                            {c.code}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs font-bold font-mono">
                                        {c.discountType === 'PERCENTAGE' || c.discountType === 'percentage' ? `${c.discountValue || c.value}% Off` : `$${c.discountValue || c.value} Off`}
                                    </TableCell>
                                    <TableCell>
                                        {c.active ? (
                                            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">Active</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">Disabled</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className={`h-8 w-8 cursor-pointer mr-2 ${c.active ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`} onClick={() => handleToggleCoupon(c.id)}>
                                            <Power size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => deleteCoupon(c.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Promotions View */}
            {activeTab === 'promotions' && (
                <div className="space-y-4">
                    {!showPromoForm && (
                        <Button onClick={() => setShowPromoForm(true)} className="font-bold text-xs h-9 cursor-pointer">
                            <Plus size={14} className="mr-1.5" /> Create Promotion
                        </Button>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Promotion Name</TableHead>
                                <TableHead>Discount Output</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedPromotions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No promotions created yet.</TableCell>
                                </TableRow>
                            ) : paginatedPromotions.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-bold text-xs">{p.name}</TableCell>
                                    <TableCell className="text-xs font-bold text-emerald-500 font-mono">
                                        {p.discountType === 'PERCENTAGE' || p.discountType === 'percentage' ? `${p.discountValue}% Off` : `$${p.discountValue} Flat Off`}
                                    </TableCell>
                                    <TableCell>
                                        {p.active ? (
                                            <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">Active</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">Disabled</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className={`h-8 w-8 cursor-pointer mr-2 ${p.active ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`} onClick={() => handleTogglePromo(p.id)}>
                                            <Power size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => deletePromotion(p.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
        </div>
    );
};

export default CouponsPromotions;
