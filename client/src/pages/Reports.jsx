import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, ShoppingBag, FileText, Download } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
const COLORS = ['#ec4899', '#f97316', '#eab308', '#a855f7', '#06b6d4', '#10b981'];
export const Reports = () => {
    const { orders, products, categories } = usePOSStore();
    // 1. Calculate General KPI Cards
    const stats = useMemo(() => {
        // Only count completed (paid) orders for revenue calculations
        const paidOrders = orders.filter((o) => o.status === 'completed');
        const totalOrders = paidOrders.length;
        const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
        const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
        return {
            totalOrders,
            revenue,
            avgOrderValue,
        };
    }, [orders]);
    // 2. Sales Trend (Hourly/Daily Mock Data fitted to active orders)
    const salesData = useMemo(() => {
        return [
            { name: '09:00 AM', sales: 45.50 },
            { name: '10:00 AM', sales: 90.00 },
            { name: '11:00 AM', sales: 180.20 },
            { name: '12:00 PM', sales: stats.revenue * 0.4 || 350.00 },
            { name: '01:00 PM', sales: stats.revenue * 0.35 || 420.00 },
            { name: '02:00 PM', sales: stats.revenue * 0.25 || 210.00 },
            { name: '03:00 PM', sales: 120.00 },
        ];
    }, [stats.revenue]);
    // 3. Category Distribution Data
    const categoryChartData = useMemo(() => {
        const counts = {};
        orders.forEach((order) => {
            if (order.status !== 'completed')
                return;
            order.items.forEach((item) => {
                const prod = products.find(p => p.id === item.productId);
                if (prod) {
                    counts[prod.categoryId] = (counts[prod.categoryId] || 0) + item.lineTotal;
                }
            });
        });
        return categories.map((cat) => ({
            name: cat.name,
            value: parseFloat((counts[cat.id] || 20.00).toFixed(2)),
        }));
    }, [orders, products, categories]);
    // 4. Top Selling Products
    const topProducts = useMemo(() => {
        const list = {};
        orders.forEach((order) => {
            if (order.status !== 'completed')
                return;
            order.items.forEach((item) => {
                const prod = products.find((p) => p.id === item.productId);
                const categoryName = prod ? categories.find(c => c.id === prod.categoryId)?.name || 'Food' : 'Food';
                if (!list[item.productId]) {
                    list[item.productId] = {
                        name: item.name,
                        category: categoryName,
                        qty: 0,
                        sales: 0,
                    };
                }
                list[item.productId].qty += item.quantity;
                list[item.productId].sales += item.lineTotal;
            });
        });
        return Object.values(list)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);
    }, [orders, products, categories]);
    const handleExport = (format) => {
        alert(`Generating ${format} report export. Downloader will start shortly...`);
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Business Intelligence</h1>
          <p className="text-muted-foreground">Monitor store turnover metrics, popular dishes, and category sales charts.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('Excel')} className="text-xs h-9 cursor-pointer">
            <Download size={14} className="mr-1.5"/>
            Excel Export
          </Button>
          <Button size="sm" onClick={() => handleExport('PDF')} className="text-xs h-9 cursor-pointer">
            <FileText size={14} className="mr-1.5"/>
            PDF Export
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* KPI 1: Revenue */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xxs font-semibold text-muted-foreground uppercase tracking-wider">Gross Sales Revenue</span>
              <h3 className="text-3xl font-black tracking-tight font-mono">${stats.revenue.toFixed(2)}</h3>
              <p className="text-xxs text-emerald-500 font-bold">+12.4% vs yesterday</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
              <DollarSign size={24}/>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Total Orders */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xxs font-semibold text-muted-foreground uppercase tracking-wider">Completed Receipts</span>
              <h3 className="text-3xl font-black tracking-tight font-mono">{stats.totalOrders}</h3>
              <p className="text-xxs text-emerald-500 font-bold">+8.3% vs yesterday</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
              <ShoppingBag size={24}/>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Average Order Value */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="text-xxs font-semibold text-muted-foreground uppercase tracking-wider">Average Ticket Size</span>
              <h3 className="text-3xl font-black tracking-tight font-mono">${stats.avgOrderValue.toFixed(2)}</h3>
              <p className="text-xxs text-emerald-500 font-bold">+4.1% vs yesterday</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
              <TrendingUp size={24}/>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Trend Chart (7 cols) */}
        <Card className="lg:col-span-8 glass border border-border/40">
          <CardHeader className="pb-2">
            <CardTitle>Sales Revenue Trend</CardTitle>
            <CardDescription>Intraday sales performance tracker.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/30"/>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground"/>
                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground"/>
                <Tooltip contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px'
        }}/>
                <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)"/>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Contribution Chart (4 cols) */}
        <Card className="lg:col-span-4 glass border border-border/40">
          <CardHeader className="pb-2">
            <CardTitle>Category Turnovers</CardTitle>
            <CardDescription>Share of sales by category.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex flex-col justify-between pt-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categoryChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                  </Pie>
                  <Tooltip contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            borderColor: 'hsl(var(--border))',
            borderRadius: '8px'
        }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="grid grid-cols-3 gap-2 text-xxs font-bold text-center border-t border-border/30 pt-3">
              {categoryChartData.slice(0, 6).map((item, index) => (<div key={item.name} className="flex flex-col items-center">
                  <span className="w-2.5 h-2.5 rounded-full mb-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}/>
                  <span className="truncate max-w-[60px] text-muted-foreground">{item.name}</span>
                </div>))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top lists tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm">Best Selling Dishes</CardTitle>
            <CardDescription>Top products ranked by sales receipts value.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Food Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sales Volume</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.length > 0 ? (topProducts.map((p, index) => (<TableRow key={index}>
                      <TableCell className="font-bold text-xs">{p.name}</TableCell>
                      <TableCell className="text-xs">{p.category}</TableCell>
                      <TableCell className="font-mono text-xs">{p.qty} portion</TableCell>
                      <TableCell className="font-mono font-bold text-xs text-right text-primary">${p.sales.toFixed(2)}</TableCell>
                    </TableRow>))) : (<TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs">
                      No sales recorded in this session.
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Categories rank table */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-sm">Top Performance Categories</CardTitle>
            <CardDescription>Categorized sales volume rankings.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total Turnovers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryChartData.map((item, index) => (<TableRow key={index}>
                    <TableCell className="font-bold text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}/>
                        {item.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-xs text-right text-primary">${item.value.toFixed(2)}</TableCell>
                  </TableRow>))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>);
};
export default Reports;
