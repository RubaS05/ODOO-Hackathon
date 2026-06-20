import React, { useEffect, useState } from 'react';
import { ShoppingBag, QrCode, CheckCircle2, Gift, Utensils } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
export const CustomerDisplay = () => {
    const { cart, activeCoupon, getCartTotals, orders } = usePOSStore();
    const { subtotal, tax, discount, total } = getCartTotals();
    // Track checkout success transitions
    const [successOrder, setSuccessOrder] = useState(null);
    // Detect new order creation to show success screen
    useEffect(() => {
        if (orders.length > 0) {
            const latestOrder = orders[0];
            // If it is a fresh completed order (placed within last 5 seconds), show thank you screen
            const orderAgeMs = Date.now() - new Date(latestOrder.date).getTime();
            if (latestOrder.status === 'completed' && orderAgeMs < 5000) {
                setSuccessOrder(latestOrder);
                // Clear success screen after 6 seconds to return to welcome/idle
                const timer = setTimeout(() => {
                    setSuccessOrder(null);
                }, 6000);
                return () => clearTimeout(timer);
            }
        }
    }, [orders]);
    // Visual slideshow/idle promo images when cart is empty
    const [promoIndex, setPromoIndex] = useState(0);
    const promos = [
        { title: "Gastro Special Burger Combo", desc: "Get Truffle Fries & Craft Lemonade at 15% off!", color: "from-pink-500 to-rose-600" },
        { title: "Authentic Stone Baked Pizzas", desc: "Fresh mozzarella, local herbs, 100% organic dough.", color: "from-orange-500 to-amber-600" },
        { title: "Summer Happy Hours", desc: "All refreshing cold press drinks buy 2 get 1 free!", color: "from-cyan-500 to-blue-600" }
    ];
    useEffect(() => {
        const interval = setInterval(() => {
            setPromoIndex((prev) => (prev + 1) % promos.length);
        }, 4500);
        return () => clearInterval(interval);
    }, []);
    // 1. SUCCESS SCREEN
    if (successOrder) {
        return (<div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white text-center relative overflow-hidden">
        {/* Gradients */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none"/>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none"/>
        
        <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10 border border-emerald-500/30">
            <CheckCircle2 size={56} className="animate-bounce"/>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">Thank You!</h1>
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs">Payment Received</p>
            <p className="text-muted-foreground text-sm mt-3">
              Your order is being sent to the kitchen.
            </p>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-xl font-mono text-xs space-y-2 max-w-sm mx-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order No:</span>
              <span className="font-bold">{successOrder.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-bold text-primary">${successOrder.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Gift size={16} className="text-yellow-500 animate-spin"/>
            <span>You earned 45 customer loyalty points!</span>
          </div>
        </div>
      </div>);
    }
    // 2. IDLE WELCOME SCREEN (Cart empty)
    if (cart.length === 0) {
        return (<div className="min-h-screen bg-slate-950 flex flex-col justify-between p-8 text-white relative overflow-hidden">
        {/* Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-primary/10 blur-[150px] pointer-events-none"/>

        {/* Top Header */}
        <header className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg">
            G
          </div>
          <div>
            <h2 className="font-black text-base tracking-tight">GastroPOS</h2>
            <p className="text-xxs text-muted-foreground">Fresh Food Premium Experience</p>
          </div>
        </header>

        {/* Dynamic Slideshow */}
        <main className="flex-1 flex flex-col justify-center items-center py-12">
          <div className={`p-8 rounded-2xl bg-gradient-to-r ${promos[promoIndex].color} w-full max-w-2xl text-center space-y-4 shadow-2xl transition-all duration-700 animate-in fade-in slide-in-from-bottom-6`}>
            <div className="inline-flex w-12 h-12 rounded-full bg-white/20 items-center justify-center">
              <Utensils size={24}/>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{promos[promoIndex].title}</h1>
            <p className="text-white/90 text-sm sm:text-base max-w-md mx-auto">{promos[promoIndex].desc}</p>
          </div>
        </main>

        {/* Footer Welcome message */}
        <footer className="text-center border-t border-white/5 pt-4">
          <p className="text-sm font-semibold tracking-wide animate-pulse">Welcome to GastroPOS. Please place your order with the cashier.</p>
        </footer>
      </div>);
    }
    // 3. ACTIVE CART & CHECKOUT DISPLAY
    return (<div className="min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row">
      {/* Left side: Cart List (60% width) */}
      <div className="flex-1 p-8 flex flex-col justify-between border-r border-white/5 lg:max-h-screen lg:overflow-hidden">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <ShoppingBag size={22} className="text-primary"/>
            <h2 className="text-xl font-bold tracking-tight">Your Ordered Items</h2>
          </div>

          {/* Cart Table List */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {cart.map((item) => (<div key={item.product.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">{item.product.name}</h4>
                  <p className="text-xxs text-muted-foreground mt-1">
                    Unit price: ${item.product.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  <span className="font-bold text-sm bg-white/15 px-3 py-1 rounded-full">
                    Qty: {item.quantity}
                  </span>
                  <span className="font-mono font-bold text-sm sm:text-base min-w-[70px] text-right">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>))}
          </div>
        </div>

        {/* Footer brand info */}
        <footer className="hidden lg:block pt-4 text-xxs text-muted-foreground border-t border-white/5">
          GastroPOS Client Display Screen • Table #{usePOSStore.getState().activeTable?.number || 'Guest'}
        </footer>
      </div>

      {/* Right side: Payment Details (40% width) */}
      <div className="w-full lg:w-[450px] bg-slate-900/60 p-8 flex flex-col justify-between border-t border-white/5 lg:border-t-0">
        <div className="space-y-6">
          <h2 className="text-lg font-bold border-b border-white/5 pb-3 uppercase tracking-wider text-muted-foreground">Checkout Bill</h2>

          {/* Checkout Total details */}
          <div className="space-y-3 font-mono text-xs bg-white/5 p-5 rounded-xl border border-white/10">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (GST/VAT):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {discount > 0 && (<div className="flex justify-between text-emerald-400 font-bold">
                <span>Discount:</span>
                <span>-${discount.toFixed(2)}</span>
              </div>)}
            <div className="border-t border-white/10 pt-3 flex justify-between items-center text-sm font-black">
              <span>TOTAL DUE:</span>
              <span className="text-xl font-bold text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* UPI Scan Code Widget */}
          <div className="p-6 bg-slate-950 border border-white/10 rounded-2xl text-center space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Pay Instantly via UPI</h3>
            <div className="mx-auto w-40 h-40 bg-white p-3 rounded-xl flex items-center justify-center shadow-md">
              <QrCode size={140} className="text-slate-950"/>
            </div>
            <div className="space-y-1">
              <p className="text-xxs text-muted-foreground">Scan QR code using GooglePay, PhonePe or Paytm</p>
              <p className="text-xs font-black text-primary font-mono">${total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Small footer alert */}
        <div className="mt-8 p-3 rounded-lg bg-primary/10 border border-primary/20 text-center text-xxs text-primary font-medium">
          Cashier will checkout your receipt after scanning.
        </div>
      </div>
    </div>);
};
export default CustomerDisplay;
