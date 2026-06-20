import React, { useState, useMemo } from 'react';
import { Search, ShoppingCart, UserPlus, Receipt, ChefHat, Ticket, Check, RefreshCw, QrCode, CreditCard, DollarSign } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const POSOrder: React.FC = () => {
  // Store selectors
  const {
    products,
    categories,
    cart,
    activeCustomer,
    activeTable,
    activeCoupon,
    orderType,
    cartNotes,
    customers,
    coupons,
    paymentMethods,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    assignCustomer,
    assignTable,
    applyCoupon,
    setOrderType,
    setCartNotes,
    getCartTotals,
    createOrder,
    addCustomer,
  } = usePOSStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Modals state
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  
  // New customer form state
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Payment Method Selection & Inputs
  const [selectedPaymentType, setSelectedPaymentType] = useState<'cash' | 'card' | 'upi'>('cash');
  const [cashAmountReceived, setCashAmountReceived] = useState('');
  const [cardReference, setCardReference] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState<any>(null);

  // Totals calculations
  const { subtotal, tax, discount, total } = getCartTotals();

  // Filter products by category and search query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategoryId ? product.categoryId === selectedCategoryId : true;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Cash change calculation
  const changeDue = useMemo(() => {
    const received = parseFloat(cashAmountReceived);
    if (isNaN(received) || received < total) return 0;
    return parseFloat((received - total).toFixed(2));
  }, [cashAmountReceived, total]);

  const handleAddProduct = (product: any) => {
    addToCart(product);
  };

  const handleSendToKitchen = () => {
    if (cart.length === 0) return;
    const order = createOrder(undefined, false); // Creates standard pending order
    setCheckoutSuccess({
      ...order,
      kitchenSuccess: true
    });
    setReceiptModalOpen(true);
  };

  const handleSendReceipt = () => {
    if (cart.length === 0) return;
    const order = createOrder(undefined, true); // Saves as Draft
    setCheckoutSuccess({
      ...order,
      draftSuccess: true
    });
    setReceiptModalOpen(true);
  };

  const handleCheckoutPayment = () => {
    if (cart.length === 0) return;

    let paymentDetails: any = {};
    if (selectedPaymentType === 'cash') {
      const received = parseFloat(cashAmountReceived) || total;
      if (received < total) {
        alert('Received cash is less than order total.');
        return;
      }
      paymentDetails = {
        amountReceived: received,
        change: received - total,
      };
    } else if (selectedPaymentType === 'card') {
      if (!cardReference.trim()) {
        alert('Please enter a card transaction reference.');
        return;
      }
      paymentDetails = {
        reference: cardReference,
      };
    } else if (selectedPaymentType === 'upi') {
      paymentDetails = {
        reference: `UPI-TXN-${Date.now().toString().slice(-6)}`,
      };
    }

    const order = createOrder(paymentDetails, false); // Creates paid/completed order
    setCheckoutSuccess(order);
    
    // Reset payment inputs
    setCashAmountReceived('');
    setCardReference('');
    setReceiptModalOpen(true);
  };

  const handleQuickCash = (amount: number) => {
    setCashAmountReceived(amount.toString());
  };

  const handleAddNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName) return;
    const newCust = {
      name: newCustomerName,
      email: newCustomerEmail || `${newCustomerName.toLowerCase().replace(/ /g, '')}@example.com`,
      phone: newCustomerPhone || '+1 555-0100',
    };
    addCustomer(newCust);
    // Find newly added customer and assign
    const latestCustomers = usePOSStore.getState().customers;
    const added = latestCustomers[latestCustomers.length - 1];
    assignCustomer(added);

    // Reset fields
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color || '#6b7280';
  };

  return (
    <div className="space-y-6">
      {/* Title & Layout Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground">Add products to cart, choose service type, and complete checkout.</p>
        </div>

        {/* Dine-in vs Takeaway vs Delivery switcher */}
        <div className="flex bg-card p-1 rounded-lg border border-border/60">
          {(['dine-in', 'takeaway', 'delivery'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer ${
                orderType === type
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* POS Columns Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Product Grid (5 cols) */}
        <section className="lg:col-span-5 space-y-4">
          <Card className="glass border border-border/40">
            <div className="p-4 space-y-4">
              {/* Product search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Quick Scroll */}
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                <button
                  onClick={() => setSelectedCategoryId(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                    selectedCategoryId === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-accent/40 text-muted-foreground border-border/40 hover:text-foreground hover:bg-accent'
                  }`}
                >
                  All Items
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    style={{ borderColor: selectedCategoryId === cat.id ? cat.color : 'transparent' }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                      selectedCategoryId === cat.id
                        ? 'bg-card text-foreground'
                        : 'bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto max-h-[500px] pr-1">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((prod) => {
                const catColor = getCategoryColor(prod.categoryId);
                return (
                  <Card
                    key={prod.id}
                    className="cursor-pointer hover:border-primary/50 transition-all select-none hover:scale-[1.02] flex flex-col justify-between"
                    onClick={() => handleAddProduct(prod)}
                  >
                    <div className="h-2" style={{ backgroundColor: catColor }} />
                    <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-sm leading-snug line-clamp-1">{prod.name}</h4>
                        <p className="text-xxs text-muted-foreground line-clamp-2 mt-1 min-h-[24px]">
                          {prod.description || 'No description available'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono font-bold text-xs">${prod.price.toFixed(2)}</span>
                        <Badge variant="secondary" className="text-xxs font-mono">
                          {prod.unit}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                No products found matches the filter.
              </div>
            )}
          </div>
        </section>

        {/* CENTER COLUMN: Cart Section (4 cols) */}
        <section className="lg:col-span-4 space-y-4">
          <Card className="glass border border-border/40 flex flex-col h-[650px]">
            {/* Header info */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/40">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-primary" />
                <span className="font-bold text-sm">Active Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                disabled={cart.length === 0}
                className="text-xs text-muted-foreground hover:text-destructive cursor-pointer h-7 px-2"
              >
                Clear Cart
              </Button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-accent/20 border border-border/20"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-xs truncate leading-normal">{item.product.name}</h5>
                      <span className="text-xxs text-muted-foreground font-mono">
                        ${item.product.price.toFixed(2)} / {item.product.unit}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center border border-border rounded-md bg-background">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-1 text-xs hover:bg-accent font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 text-xs font-mono font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-1 text-xs hover:bg-accent font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right pl-2">
                      <span className="font-mono font-bold text-xs">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                  <ShoppingCart size={32} className="opacity-30 mb-2" />
                  <p className="text-xs">Your cart is empty.</p>
                  <p className="text-xxs opacity-80 mt-0.5">Click items in the grid to add them.</p>
                </div>
              )}
            </div>

            {/* Cart Meta / Notes */}
            {cart.length > 0 && (
              <div className="px-4 py-2 border-t border-border/30 bg-card/10">
                <input
                  type="text"
                  placeholder="Add order notes / special instructions..."
                  value={cartNotes}
                  onChange={(e) => setCartNotes(e.target.value)}
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none py-1"
                />
              </div>
            )}

            {/* Customer & Coupon Status bar */}
            <div className="px-4 py-2 border-t border-border/30 bg-card/20 flex flex-wrap gap-2 justify-between items-center text-xxs">
              <button
                onClick={() => setCustomerModalOpen(true)}
                className="flex items-center gap-1 text-primary hover:underline font-bold"
              >
                <UserPlus size={12} />
                {activeCustomer ? `Customer: ${activeCustomer.name}` : 'Assign Customer'}
              </button>
              
              <button
                onClick={() => setCouponModalOpen(true)}
                className="flex items-center gap-1 text-purple-500 hover:underline font-bold"
              >
                <Ticket size={12} />
                {activeCoupon ? `Coupon: ${activeCoupon.code} (${activeCoupon.value}%)` : 'Apply Coupon'}
              </button>
            </div>

            {/* Cart totals summary */}
            <div className="p-4 border-t border-border bg-card/40 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (GST/VAT)</span>
                <span className="font-mono">${tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-500 font-semibold">
                  <span>Discount</span>
                  <span className="font-mono">-${discount.toFixed(2)}</span>
                </div>
              )}
              {activeTable && (
                <div className="flex justify-between text-primary font-semibold">
                  <span>Linked Table</span>
                  <span>Table {activeTable.number}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-border/50">
                <span>Total Amount</span>
                <span className="font-mono text-base text-primary">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Cart Checkout Actions */}
            <div className="p-4 border-t border-border grid grid-cols-2 gap-2 bg-card/60">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendReceipt}
                disabled={cart.length === 0}
                className="text-xs cursor-pointer"
              >
                <Receipt size={14} className="mr-1.5" />
                Draft Order
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSendToKitchen}
                disabled={cart.length === 0}
                className="text-xs cursor-pointer hover:bg-emerald-500 hover:text-white"
              >
                <ChefHat size={14} className="mr-1.5" />
                Send To Kitchen
              </Button>
            </div>
          </Card>
        </section>

        {/* RIGHT COLUMN: Payment Section (3 cols) */}
        <section className="lg:col-span-3 space-y-4">
          <Card className="glass border border-border/40 p-4 space-y-4">
            <h3 className="font-bold text-sm border-b border-border/40 pb-2">Payment Details</h3>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-accent/40 p-1 rounded-lg">
              {(['cash', 'card', 'upi'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedPaymentType(method)}
                  className={`py-2 rounded-md text-xxs font-bold uppercase transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedPaymentType === method
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {method === 'cash' && <DollarSign size={14} />}
                  {method === 'card' && <CreditCard size={14} />}
                  {method === 'upi' && <QrCode size={14} />}
                  {method}
                </button>
              ))}
            </div>

            {/* Dynamic UI Panels based on selected Payment Method */}
            <div className="space-y-4 min-h-[220px]">
              {selectedPaymentType === 'cash' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <Input
                    label="Amount Received ($)"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    value={cashAmountReceived}
                    onChange={(e) => setCashAmountReceived(e.target.value)}
                  />

                  {/* Cash received shortcuts */}
                  <div className="grid grid-cols-3 gap-1">
                    {[10, 20, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleQuickCash(amt)}
                        className="py-1 px-2 text-xxs font-bold bg-accent/50 rounded hover:bg-accent border border-border/20 cursor-pointer"
                      >
                        ${amt}
                      </button>
                    ))}
                    <button
                      onClick={() => handleQuickCash(total)}
                      className="col-span-2 py-1 px-2 text-xxs font-black bg-primary/10 text-primary border border-primary/20 rounded hover:bg-primary/20 cursor-pointer"
                    >
                      Exact: ${total.toFixed(2)}
                    </button>
                  </div>

                  {/* Change display */}
                  <div className="p-3 bg-accent/30 rounded-lg border border-border/20 space-y-1">
                    <span className="text-xxs text-muted-foreground uppercase font-semibold">Change Due</span>
                    <div className="font-mono text-lg font-black text-emerald-500">${changeDue.toFixed(2)}</div>
                  </div>
                </div>
              )}

              {selectedPaymentType === 'card' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <p className="text-xxs text-muted-foreground">
                    Process the payment on your external card terminal, then enter the authorization/reference reference below.
                  </p>
                  <Input
                    label="Transaction Reference"
                    placeholder="TXN-XXXXXX"
                    value={cardReference}
                    onChange={(e) => setCardReference(e.target.value)}
                  />
                </div>
              )}

              {selectedPaymentType === 'upi' && (
                <div className="space-y-3 text-center animate-in fade-in duration-200">
                  <div className="mx-auto w-32 h-32 border-2 border-primary/20 bg-white/10 rounded-lg flex items-center justify-center p-2 relative group overflow-hidden">
                    {/* Simulated QR Grid */}
                    <QrCode size={100} className="text-foreground transition-all group-hover:scale-95" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xxs font-bold text-white px-2 py-1 bg-primary rounded-full">Scan to Pay</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xxs text-muted-foreground uppercase font-semibold">UPI Total Charge</span>
                    <div className="font-mono text-sm font-bold text-primary">${total.toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Complete checkout trigger */}
            <Button
              className="w-full font-black py-5 cursor-pointer text-sm"
              onClick={handleCheckoutPayment}
              disabled={cart.length === 0}
            >
              Complete Checkout
            </Button>
          </Card>
        </section>
      </div>

      {/* MODALS */}

      {/* 1. Assign Customer Modal */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Assign Customer to Order"
      >
        <div className="space-y-5">
          {/* List existing customers */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Customer</h4>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
              <div
                onClick={() => {
                  assignCustomer(null);
                  setCustomerModalOpen(false);
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                  activeCustomer === null ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-accent/40'
                }`}
              >
                <span className="font-semibold">Walk-in Guest</span>
                {activeCustomer === null && <Check size={14} className="text-primary" />}
              </div>
              {customers.map((cust) => (
                <div
                  key={cust.id}
                  onClick={() => {
                    assignCustomer(cust);
                    setCustomerModalOpen(false);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    activeCustomer?.id === cust.id ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-accent/40'
                  }`}
                >
                  <div>
                    <p className="font-bold">{cust.name}</p>
                    <p className="text-xxs text-muted-foreground mt-0.5">{cust.phone} | {cust.email}</p>
                  </div>
                  {activeCustomer?.id === cust.id && <Check size={14} className="text-primary" />}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border/40 my-3" />

          {/* Add customer form */}
          <form onSubmit={handleAddNewCustomer} className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Or Add New Customer</h4>
            <Input
              placeholder="Full Name"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              className="h-9 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Email"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                className="h-9 text-xs"
              />
              <Input
                placeholder="Phone Number"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <Button type="submit" size="sm" className="w-full text-xs font-bold h-9">
              Add & Assign Customer
            </Button>
          </form>
        </div>
      </Modal>

      {/* 2. Apply Coupon Modal */}
      <Modal
        isOpen={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title="Apply Discount Coupon"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Available Coupon</h4>
            <p className="text-xxs text-muted-foreground">Coupons are calculated on checkout totals.</p>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            <div
              onClick={() => {
                applyCoupon(null);
                setCouponModalOpen(false);
              }}
              className={`p-3 rounded-lg border text-xs cursor-pointer flex justify-between items-center transition-colors ${
                activeCoupon === null ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-accent/40'
              }`}
            >
              <span className="font-semibold">Remove active coupon</span>
              {activeCoupon === null && <Check size={14} className="text-primary" />}
            </div>
            {coupons.map((coup) => {
              const eligible = !coup.minAmount || subtotal >= coup.minAmount;
              return (
                <div
                  key={coup.id}
                  onClick={() => {
                    if (!eligible) return;
                    applyCoupon(coup);
                    setCouponModalOpen(false);
                  }}
                  className={`p-3 rounded-lg border text-xs flex justify-between items-center transition-colors ${
                    !eligible ? 'opacity-40 cursor-not-allowed border-border/20' : 'cursor-pointer'
                  } ${
                    activeCoupon?.id === coup.id ? 'border-primary bg-primary/10' : 'border-border/60 hover:bg-accent/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm bg-accent px-1.5 py-0.5 rounded text-foreground uppercase">
                        {coup.code}
                      </span>
                      <span className="font-semibold text-primary">
                        {coup.discountType === 'percentage' ? `${coup.value}% Off` : `$${coup.value} Off`}
                      </span>
                    </div>
                    {coup.minAmount && (
                      <p className="text-xxs text-muted-foreground mt-1">
                        Min. Order Amount: ${coup.minAmount.toFixed(2)} (Subtotal: ${subtotal.toFixed(2)})
                      </p>
                    )}
                  </div>
                  {activeCoupon?.id === coup.id && <Check size={14} className="text-primary" />}
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* 3. Checkout Receipt Printing Simulation Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false);
          setCheckoutSuccess(null);
        }}
        title="POS Order Submitted"
        size="sm"
      >
        {checkoutSuccess && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="text-center py-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <Check size={28} />
              </div>
              <h3 className="font-bold text-base">
                {checkoutSuccess.kitchenSuccess
                  ? 'Sent to Kitchen KDS!'
                  : checkoutSuccess.draftSuccess
                  ? 'Draft Order Created!'
                  : 'Checkout Complete!'}
              </h3>
              <p className="text-xxs text-muted-foreground mt-0.5">Order Number: {checkoutSuccess.orderNumber}</p>
            </div>

            {/* Receipt Summary */}
            <div className="p-4 border-2 border-dashed border-border rounded-lg bg-card text-xs font-mono space-y-3">
              <div className="text-center border-b border-border/40 pb-2 space-y-1">
                <p className="font-bold uppercase">GASTRO POS OUTLET</p>
                <p className="text-xxs text-muted-foreground">20-06-2026 13:10 PM</p>
                <p className="text-xxs">Cashier: Admin | {checkoutSuccess.orderType.toUpperCase()}</p>
              </div>

              {/* Items */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {checkoutSuccess.items.map((oi: any) => (
                  <div key={oi.id} className="flex justify-between text-xxs">
                    <span className="truncate max-w-[150px]">{oi.name} x{oi.quantity}</span>
                    <span>${oi.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-border/60 pt-2 space-y-1 text-xxs">
                <div className="flex justify-between text-xxs">
                  <span>Subtotal</span>
                  <span>${checkoutSuccess.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${checkoutSuccess.tax.toFixed(2)}</span>
                </div>
                {checkoutSuccess.discount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-bold">
                    <span>Discount</span>
                    <span>-${checkoutSuccess.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-border/30">
                  <span>TOTAL</span>
                  <span>${checkoutSuccess.total.toFixed(2)}</span>
                </div>
              </div>
              
              {checkoutSuccess.paymentDetails && (
                <div className="border-t border-border/40 pt-2 text-xxs space-y-0.5">
                  <p className="font-bold">Payment Method: {checkoutSuccess.paymentMethod?.toUpperCase()}</p>
                  {checkoutSuccess.paymentMethod === 'cash' && (
                    <>
                      <p>Received: ${checkoutSuccess.paymentDetails.amountReceived?.toFixed(2)}</p>
                      <p>Change: ${checkoutSuccess.paymentDetails.change?.toFixed(2)}</p>
                    </>
                  )}
                  {checkoutSuccess.paymentMethod === 'card' && (
                    <p className="truncate">Ref: {checkoutSuccess.paymentDetails.reference}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-bold text-xs h-9"
                onClick={() => {
                  window.print();
                }}
              >
                Print Receipt
              </Button>
              <Button
                className="flex-1 font-bold text-xs h-9"
                onClick={() => {
                  setReceiptModalOpen(false);
                  setCheckoutSuccess(null);
                }}
              >
                New Transaction
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default POSOrder;
