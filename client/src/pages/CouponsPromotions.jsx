import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { useEffect } from 'react';

export const CouponsPromotions = () => {
    const { coupons, promotions, products, addCoupon, deleteCoupon, addPromotion, deletePromotion } = usePOSStore();
    // Tab states
    const [activeTab, setActiveTab] = useState('coupons');
    // Modals
    const [couponModalOpen, setCouponModalOpen] = useState(false);
    const [promoModalOpen, setPromoModalOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const currentList = activeTab === 'coupons' ? coupons : promotions;
    const totalPages = Math.ceil(currentList.length / rowsPerPage);
    
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
    const handleCreateCoupon = (e) => {
        e.preventDefault();
        if (!couponCode || !couponVal)
            return;
        addCoupon({
            code: couponCode.toUpperCase().replace(/ /g, ''),
            discountType: couponType,
            value: Number(couponVal),
            minAmount: couponMin ? Number(couponMin) : undefined,
        });
        setCouponCode('');
        setCouponVal('');
        setCouponMin('');
        setCouponModalOpen(false);
    };
    const handleCreatePromo = (e) => {
        e.preventDefault();
        if (!promoName || !promoDiscountVal)
            return;
        addPromotion({
            name: promoName,
            type: promoType,
            minQuantity: promoType === 'product' ? Number(promoMinQty) : undefined,
            minAmount: promoType === 'order' ? Number(promoMinAmt) : undefined,
            discountType: promoDiscountType,
            discountValue: Number(promoDiscountVal),
            productId: promoType === 'product' ? (promoProductId || products[0]?.id) : undefined,
        });
        setPromoName('');
        setPromoModalOpen(false);
    };
    const getProductName = (prodId) => {
        return products.find(p => p.id === prodId)?.name || 'Unknown Product';
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Coupons & Promos</h1>
          <p className="text-muted-foreground">Manage code vouchers, discount campaigns, and item quantity-based rules.</p>
        </div>
        <Button onClick={() => activeTab === 'coupons' ? setCouponModalOpen(true) : setPromoModalOpen(true)} className="font-bold text-xs h-9 cursor-pointer">
          <Plus size={14} className="mr-1.5"/>
          {activeTab === 'coupons' ? 'Add Coupon' : 'Create Promotion'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-card p-1.5 rounded-lg border border-border/60 max-w-xs">
        <button onClick={() => setActiveTab('coupons')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'coupons'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}`}>
          Coupons
        </button>
        <button onClick={() => setActiveTab('promotions')} className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'promotions'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}`}>
          Promotions
        </button>
      </div>

      {/* Coupons View */}
      {activeTab === 'coupons' && (<Table>
          <TableHeader>
            <TableRow>
              <TableHead>Coupon Code</TableHead>
              <TableHead>Discount Value</TableHead>
              <TableHead>Eligibility Condition</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCoupons.map((c) => (<TableRow key={c.id}>
                <TableCell className="font-mono font-bold text-xs">
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                    {c.code}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-bold font-mono">
                  {c.discountType === 'percentage' ? `${c.value}% Off` : `$${c.value} Off`}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.minAmount ? `Minimum Cart Amount: $${c.minAmount.toFixed(2)}` : 'No Minimum Amount'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => deleteCoupon(c.id)}>
                    <Trash2 size={12}/>
                  </Button>
                </TableCell>
              </TableRow>))}
          </TableBody>
        </Table>)}

      {/* Promotions View */}
      {activeTab === 'promotions' && (<Table>
          <TableHeader>
            <TableRow>
              <TableHead>Promotion Name</TableHead>
              <TableHead>Rule Scope</TableHead>
              <TableHead>Minimum Requirements</TableHead>
              <TableHead>Discount Output</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPromotions.map((p) => (<TableRow key={p.id}>
                <TableCell className="font-bold text-xs">{p.name}</TableCell>
                <TableCell className="text-xs capitalize font-semibold text-muted-foreground">
                  {p.type === 'product' ? `Product: ${getProductName(p.productId || '')}` : 'Order Subtotal'}
                </TableCell>
                <TableCell className="text-xs">
                  {p.type === 'product'
                    ? `Min. Quantity: ${p.minQuantity} items`
                    : `Min. Order Value: $${p.minAmount?.toFixed(2)}`}
                </TableCell>
                <TableCell className="text-xs font-bold text-emerald-500 font-mono">
                  {p.discountType === 'percentage' ? `${p.discountValue}% Off` : `$${p.discountValue} Flat Off`}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => deletePromotion(p.id)}>
                    <Trash2 size={12}/>
                  </Button>
                </TableCell>
              </TableRow>))}
          </TableBody>
        </Table>)}
        
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* MODALS */}

      {/* Add Coupon Modal */}
      <Modal isOpen={couponModalOpen} onClose={() => setCouponModalOpen(false)} title="Create Discount Coupon">
        <form onSubmit={handleCreateCoupon} className="space-y-4">
          <Input label="Coupon Voucher Code" placeholder="e.g. SAVEMORE20" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} required/>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Discount Type" value={couponType} onChange={(e) => setCouponType(e.target.value)} required>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Flat ($)</option>
            </Select>

            <Input label="Discount Value" placeholder="e.g. 10 or 15.00" type="number" step="0.01" value={couponVal} onChange={(e) => setCouponVal(e.target.value)} required/>
          </div>

          <Input label="Minimum Cart Subtotal Required ($)" placeholder="Optional (e.g. 50.00)" type="number" step="0.01" value={couponMin} onChange={(e) => setCouponMin(e.target.value)}/>

          <Button type="submit" className="w-full font-bold">
            Create Coupon
          </Button>
        </form>
      </Modal>

      {/* Add Promotion Modal */}
      <Modal isOpen={promoModalOpen} onClose={() => setPromoModalOpen(false)} title="Create Marketing Promotion">
        <form onSubmit={handleCreatePromo} className="space-y-4">
          <Input label="Promotion Name" placeholder="e.g. Pizza Sunday discount" value={promoName} onChange={(e) => setPromoName(e.target.value)} required/>

          <Select label="Promotion Scope" value={promoType} onChange={(e) => setPromoType(e.target.value)} required>
            <option value="product">Product specific rule</option>
            <option value="order">Order subtotal rule</option>
          </Select>

          {promoType === 'product' ? (<div className="grid grid-cols-2 gap-3">
              <Select label="Target Menu Item" value={promoProductId} onChange={(e) => setPromoProductId(e.target.value)} required>
                {products.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </Select>

              <Input label="Minimum Quantity" type="number" value={promoMinQty} onChange={(e) => setPromoMinQty(e.target.value)} required/>
            </div>) : (<Input label="Minimum Subtotal Required ($)" type="number" step="0.01" value={promoMinAmt} onChange={(e) => setPromoMinAmt(e.target.value)} required/>)}

          <div className="grid grid-cols-2 gap-3">
            <Select label="Discount Output Type" value={promoDiscountType} onChange={(e) => setPromoDiscountType(e.target.value)} required>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Flat ($)</option>
            </Select>

            <Input label="Discount Output Value" type="number" step="0.01" value={promoDiscountVal} onChange={(e) => setPromoDiscountVal(e.target.value)} required/>
          </div>

          <Button type="submit" className="w-full font-bold">
            Create Promotion
          </Button>
        </form>
      </Modal>
    </div>);
};
export default CouponsPromotions;
