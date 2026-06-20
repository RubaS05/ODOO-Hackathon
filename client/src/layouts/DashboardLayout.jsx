import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, Monitor, ClipboardList, Users, TableProperties, Package, Tags, CreditCard, Ticket, UserSquare2, ChefHat, BarChart3, LogOut, Sun, Moon, Bell, Menu, X, Clock } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Button } from '../components/ui/Button';
export const DashboardLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const { currentUser, logout, darkMode, toggleDarkMode } = usePOSStore();
    // Apply dark mode class to HTML element
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);
    // Simulate active POS session timer
    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const diff = Date.now() - startTime;
            const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
            const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
            const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
            setElapsedTime(`${hours}:${minutes}:${seconds}`);
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const allMenuItems = [
        { name: 'POS Terminal', path: '/', icon: Monitor, roles: ['ADMIN', 'EMPLOYEE'] },
        { name: 'POS Order', path: '/pos', icon: LayoutGrid, roles: ['ADMIN', 'EMPLOYEE'] },
        { name: 'Orders', path: '/orders', icon: ClipboardList, roles: ['ADMIN', 'EMPLOYEE'] },
        { name: 'Customers', path: '/customers', icon: Users, roles: ['ADMIN', 'EMPLOYEE'] },
        { name: 'Tables', path: '/tables', icon: TableProperties, roles: ['ADMIN', 'EMPLOYEE'] },
        { name: 'Products', path: '/products', icon: Package, roles: ['ADMIN'] },
        { name: 'Categories', path: '/categories', icon: Tags, roles: ['ADMIN'] },
        { name: 'Payment Methods', path: '/payment-methods', icon: CreditCard, roles: ['ADMIN'] },
        { name: 'Coupons & Promos', path: '/coupons', icon: Ticket, roles: ['ADMIN'] },
        { name: 'Users / Employees', path: '/users', icon: UserSquare2, roles: ['ADMIN'] },
        { name: 'Kitchen (KDS)', path: '/kitchen', icon: ChefHat, roles: ['ADMIN', 'CHEF'] },
        { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN'] },
    ];
    const menuItems = allMenuItems.filter(item => item.roles.includes(currentUser?.role || ''));
    return (<div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/40 backdrop-blur-md sticky top-0 h-screen z-20">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border/40">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-extrabold shadow-md shadow-primary/30">
            P
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            GastroPOS
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (<Link key={item.name} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
                <Icon size={18}/>
                <span>{item.name}</span>
              </Link>);
        })}
        </nav>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-border/40 space-y-3 bg-card/60">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-bold truncate">{currentUser?.name}</h4>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{currentUser?.role}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer" onClick={handleLogout}>
            <LogOut size={18} className="mr-2"/>
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {isMobileOpen && (<div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Drawer backdrop */}
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}/>
          {/* Drawer Content */}
          <aside className="relative flex flex-col w-64 bg-card border-r border-border h-full max-w-xs animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border/40">
              <span className="font-extrabold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">GastroPOS</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="h-8 w-8 cursor-pointer">
                <X size={18}/>
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1" onClick={() => setIsMobileOpen(false)}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (<Link key={item.name} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-muted-foreground hover:bg-accent'}`}>
                    <Icon size={18}/>
                    <span>{item.name}</span>
                  </Link>);
            })}
            </nav>
            <div className="p-4 border-t border-border/40 space-y-3 bg-card/60">
              <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer" onClick={handleLogout}>
                <LogOut size={18} className="mr-2"/>
                Logout
              </Button>
            </div>
          </aside>
        </div>)}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6">
          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden cursor-pointer" onClick={() => setIsMobileOpen(true)}>
              <Menu size={20}/>
            </Button>

            {/* Session Timer Widget */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-accent/50 rounded-full text-xs font-medium text-muted-foreground border border-border/40">
              <Clock size={14} className="text-primary animate-pulse"/>
              <span>Session:</span>
              <span className="font-semibold text-foreground font-mono">{elapsedTime}</span>
            </div>
            
            <Link to="/customer-display" target="_blank" className="hidden md:inline-flex items-center text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-all border border-primary/20">
              Customer Screen ↗
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Switcher */}
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer">
              {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
            </Button>

            {/* Notification Center */}
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setNotificationsOpen(!notificationsOpen)} className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer">
                <Bell size={18}/>
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full ring-2 ring-background border-none animate-ping"/>
              </Button>

              {notificationsOpen && (<>
                  <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)}/>
                  <div className="absolute right-0 mt-2 w-80 glass border border-border rounded-xl shadow-lg p-4 z-40 animate-in fade-in slide-in-from-top-3 duration-200">
                    <h3 className="font-bold text-sm mb-3">Live KDS Notifications</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <div className="p-2.5 rounded-lg bg-accent/30 border border-border/20 text-xs">
                        <p className="font-semibold text-foreground">Order #ORD-20260620-002 Completed</p>
                        <p className="text-muted-foreground mt-0.5">Chef marked Pepperoni Pizza as ready.</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-accent/30 border border-border/20 text-xs">
                        <p className="font-semibold text-foreground">New Dine-In Order #ORD-20260620-001</p>
                        <p className="text-muted-foreground mt-0.5">Sent to Kitchen Display (Table 102).</p>
                      </div>
                    </div>
                  </div>
                </>)}
            </div>

            {/* Profile widget */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <span className="hidden sm:inline text-sm font-semibold truncate max-w-24">{currentUser?.name}</span>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shadow-sm select-none border border-primary/10">
                {currentUser?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content body wrapper */}
        <main className="flex-1 overflow-y-auto p-6 bg-background/95">
          {children}
        </main>
      </div>
    </div>);
};
