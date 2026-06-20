import React, { useEffect, useState } from 'react';
import { Monitor, Play, X, Clock, TrendingUp, ShoppingBag, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { apiService } from '../services/api';
import { usePOSStore } from '../store/posStore';

export const POSSession = () => {
  // Global store for current authenticated user (set during login)
  const { currentUser } = usePOSStore();

  // Local state driven by real API
  const [posSession, setPosSession] = useState(null);
  const [lastSession, setLastSession] = useState(null);
  const [orders, setOrders] = useState([]);

  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('0');
  const [closingSummary, setClosingSummary] = useState(null);
  const [elapsed, setElapsed] = useState('00:00:00');

  // Load current session on mount and whenever a session is opened/closed
  const loadCurrentSession = async () => {
    try {
      const current = await apiService.sessions.getCurrent();
      if (current && current.status === 'OPEN') {
        setPosSession(current);
        const sessionOrders = await apiService.orders.getBySession(current.id);
        setOrders(sessionOrders);
      } else {
        setPosSession(null);
        if (current && current.status === 'CLOSED') {
            setLastSession(current);
        } else {
            const all = await apiService.sessions.getAll();
            if (all && all.length) setLastSession(all[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load session', e);
    }
  };

  // Initial fetch
  useEffect(() => {
    loadCurrentSession();
  }, []);

  // Elapsed timer for open session
  useEffect(() => {
    if (!posSession) return;
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(posSession.openedAt).getTime();
      const h = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [posSession]);

  // Helper to format dates consistently
  const formatDate = (iso) =>
    iso
      ? new Date(iso).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  // Session stats derived from orders
  const sessionOpenTime = posSession ? new Date(posSession.openedAt).getTime() : 0;
  const sessionOrders = orders.filter(
    (o) => o.status === 'COMPLETED' && new Date(o.date).getTime() >= sessionOpenTime
  );
  const sessionRevenue = sessionOrders.reduce((sum, o) => sum + o.total, 0);

  const handleOpenSession = async (e) => {
    e.preventDefault();
    try {
      const created = await apiService.sessions.open(parseFloat(openingBalance) || 0);
      setPosSession(created);
      setOrders([]);
      setOpenModalOpen(false);
    } catch (err) {
      console.error('Open session error', err);
    }
  };

  const handleCloseSession = async () => {
    try {
      const summary = await apiService.sessions.close();
      setClosingSummary(summary);
      setPosSession(null);
      setOrders([]);
      const all = await apiService.sessions.getAll();
      if (all && all.length) setLastSession(all[0]);
      setCloseModalOpen(false);
    } catch (err) {
      console.error('Close session error', err);
    }
  };

  // ── CLOSING SUMMARY MODAL ──────────────────────────────────────────────
  if (closingSummary) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-3">
            <div className="mx-auto w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 size={44} className="text-emerald-500" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Session Closed</h1>
            <p className="text-muted-foreground text-sm">Shift summary for {closingSummary.openedBy}</p>
          </div>
          <div className="border-2 border-dashed border-border rounded-2xl p-6 font-mono text-sm space-y-4 bg-card">
            <div className="text-center border-b border-border pb-3">
              <p className="font-extrabold uppercase text-base">ODOO CAFE POS</p>
              <p className="text-xxs text-muted-foreground">End of Shift Receipt</p>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['Session Opened', formatDate(closingSummary.openedAt)],
                ['Session Closed', formatDate(closingSummary.closedAt)],
                ['Opened By', closingSummary.employeeName],
                ['Total Orders', closingSummary.totalOrders],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">{label}:</span>
                  <span className="font-bold text-right">{value}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center text-sm font-black">
              <span>CLOSING SALE</span>
              <span className="text-primary text-xl font-mono">₹{(closingSummary.closingSaleAmount || 0).toFixed(2)}</span>
            </div>
          </div>
          <Button className="w-full font-bold py-5" onClick={() => setClosingSummary(null)}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  // ── ACTIVE SESSION VIEW ───────────────────────────────────────────────
  if (posSession) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow shadow-emerald-400" />
              Session Active
            </h1>
            <p className="text-muted-foreground">
              Opened by {posSession.employeeName} at {formatDate(posSession.openedAt)}
            </p>
          </div>
          {currentUser?.role === 'ADMIN' && (
            <Button variant="destructive" className="font-bold cursor-pointer" onClick={() => setCloseModalOpen(true)}>
              <X size={16} className="mr-2" />
              Close Session
            </Button>
          )}
        </div>

        {/* Live Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Elapsed Time',
              value: <span className="font-mono text-2xl font-black">{elapsed}</span>,
              icon: Clock,
              color: 'text-primary',
              bg: 'bg-primary/10',
            },
            {
              label: 'Orders This Session',
              value: <span className="text-2xl font-black">{sessionOrders.length}</span>,
              icon: ShoppingBag,
              color: 'text-emerald-500',
              bg: 'bg-emerald-500/10',
            },
            {
              label: 'Revenue This Session',
              value: (
                <span className="text-2xl font-black font-mono">₹{sessionRevenue.toFixed(2)}</span>
              ),
              icon: TrendingUp,
              color: 'text-orange-500',
              bg: 'bg-orange-500/10',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={22} className={color} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 text-sm text-muted-foreground flex items-center gap-3">
          <Monitor size={20} className="text-primary shrink-0" />
          <p>
            Your POS terminal is active. Switch to the <strong className="text-foreground">POS Order</strong> tab from the sidebar to begin taking orders.
          </p>
        </div>

        {/* Close Session Confirm Modal */}
        <Modal isOpen={closeModalOpen} onClose={() => setCloseModalOpen(false)} title="Close POS Session">
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle size={18} className="text-destructive mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-bold text-destructive">End of shift confirmation</p>
                <p className="text-muted-foreground text-xs mt-1">
                  This will close the current POS session. A closing summary will be generated.
                </p>
              </div>
            </div>

            <div className="bg-accent/30 rounded-xl p-4 text-sm space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opened At:</span>
                <span>{formatDate(posSession.openedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders Taken:</span>
                <span>{sessionOrders.length}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-muted-foreground">Est. Closing Sale:</span>
                <span className="text-primary">₹{sessionRevenue.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 font-bold cursor-pointer" onClick={() => setCloseModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1 font-bold cursor-pointer" onClick={handleCloseSession}>
                <X size={14} className="mr-1" /> Close Session
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ── NO SESSION: LANDING PAGE ────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">POS Terminal</h1>
        <p className="text-muted-foreground">Start a session to begin accepting orders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Open Session Card */}
        {currentUser?.role === 'ADMIN' ? (
          <div className="bg-gradient-to-br from-primary/5 to-orange-100/60 border-2 border-primary/20 rounded-2xl p-8 flex flex-col items-center text-center gap-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
              <Monitor size={36} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Open Session</h2>
              <p className="text-muted-foreground text-sm mt-1">Launch the POS terminal for a new shift.</p>
            </div>
            <Button className="w-full font-black py-5 text-sm cursor-pointer" onClick={() => setOpenModalOpen(true)}>
              <Play size={16} className="mr-2" />
              Open POS Session
            </Button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-200 rounded-2xl p-8 flex flex-col items-center text-center gap-5 shadow-sm">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center border border-orange-200">
              <Clock size={36} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-orange-700">Waiting for Session</h2>
              <p className="text-orange-600/80 text-sm mt-1">Please wait for an Admin to open the POS session.</p>
            </div>
          </div>
        )}

        {/* Last Session Card */}
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold">Last Session</h3>
              <p className="text-xs text-muted-foreground">Previous shift summary</p>
            </div>
          </div>
          {lastSession ? (
            <div className="space-y-3 font-mono text-sm">
              {[
                ['Opened', formatDate(lastSession.openedAt)],
                ['Closed', formatDate(lastSession.closedAt)],
                ['Cashier', lastSession.employeeName],
                ['Orders', lastSession.totalOrders || 0],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-border/40 pb-2 last:border-0">
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className="font-bold text-xs text-right">{value}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground text-xs font-bold">Closing Sale</span>
                <span className="font-black text-primary text-base">₹{(lastSession.closingSaleAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-6">
              <p>No previous sessions found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Open Session Modal */}
      <Modal isOpen={openModalOpen} onClose={() => setOpenModalOpen(false)} title="Open POS Session">
        <form onSubmit={handleOpenSession} className="space-y-5">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm space-y-1">
            <p className="font-bold text-primary">Starting new shift as: {currentUser?.name}</p>
            <p className="text-muted-foreground text-xs">All orders placed during this session will be tracked.</p>
          </div>
          <Input
            label="Opening Cash Balance (₹)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
          />
          <Button type="submit" className="w-full font-black py-5 cursor-pointer">
            <Play size={16} className="mr-2" />
            Open Session Now
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default POSSession;
