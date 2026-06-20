import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Download, Printer, QrCode, Plus } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { generateQrDataUrl } from '../services/qrService';
import { apiService } from '../services/api';

export const TableManagement = () => {
    const navigate = useNavigate();
    const {
        tables, orders, assignTable, setTableStatus,
        setTables, addTable, deleteTable, setTableQrDataUrl
    } = usePOSStore();

    const [selectedFloor, setSelectedFloor] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [activeTableDetail, setActiveTableDetail] = useState(null);

    // New Table Form States
    const [newTableNo, setNewTableNo] = useState('');
    const [newTableSeats, setNewTableSeats] = useState(4);
    const [newTableFloor, setNewTableFloor] = useState('1st Floor');

    // Available floors list
    const floors = useMemo(() => {
        const f = Array.from(new Set(tables.map((t) => t.floor).filter(Boolean)));
        return f.length ? f : ['1st Floor'];
    }, [tables]);

    // Auto-select first floor
    useEffect(() => {
        if (!selectedFloor && floors.length) setSelectedFloor(floors[0]);
    }, [floors, selectedFloor]);

    // Filter tables by floor
    const filteredTables = useMemo(() => {
        return tables.filter((t) => t.floor === selectedFloor);
    }, [tables, selectedFloor]);

    // Click always opens detail modal
    const handleTableClick = (table) => {
        const associatedOrder = orders.find(
            (o) => o.id === table.currentOrderId || (o.tableId === table.id && o.status === 'pending')
        );
        setActiveTableDetail({ table, order: associatedOrder || null });
    };

    const handleUpdateStatus = (tableId, status) => {
        setTableStatus(tableId, status, status === 'available' ? undefined : activeTableDetail?.table?.currentOrderId);
        setActiveTableDetail((prev) => prev ? { ...prev, table: { ...prev.table, status } } : null);
    };

    const loadTables = async () => {
        try {
            const apiTables = await apiService.tables.getAll();
            const mapped = await Promise.all(apiTables.map(async (t) => {
                const qrUrl = t.qrCodeUrl || `${window.location.origin}/table/${t.id}`;
                const dataUrl = await generateQrDataUrl(qrUrl);
                return {
                    ...t,
                    number: t.tableNumber,
                    floor: t.floor?.name || '1st Floor',
                    status: t.active ? 'available' : 'unavailable',
                    qrDataUrl: dataUrl
                };
            }));
            setTables(mapped);
        } catch (err) {
            console.error("Failed to load tables from API", err);
        }
    };

    useEffect(() => {
        loadTables();
    }, []);

    const handleCreateTable = async (e) => {
        e.preventDefault();
        if (!newTableNo) return;

        try {
            const newTable = await apiService.tables.create({
                tableNumber: newTableNo,
                seats: Number(newTableSeats),
                floorName: newTableFloor
            });

            const storeTable = {
                ...newTable,
                number: newTable.tableNumber,
                floor: newTable.floor?.name || newTableFloor,
                status: 'available',
            };

            addTable(storeTable);
            
            // Wait for state flush
            await new Promise((r) => setTimeout(r, 50));
            const qrUrl = `${window.location.origin}/table/${storeTable.id}`;
            const dataUrl = await generateQrDataUrl(qrUrl);
            setTableQrDataUrl(storeTable.id, dataUrl);

            setNewTableNo('');
            setNewTableSeats(4);
            setCreateModalOpen(false);
        } catch (error) {
            console.error("Failed to create table", error);
            alert("Error creating table");
        }
    };

    // QR codes are now generated during loadTables and handleCreateTable

    const handleDeleteTableClick = async (tableId) => {
        if (confirm('Are you sure you want to delete this table?')) {
            try {
                // If it's a UUID (tab-xxx), it's local only, but we use backend IDs now
                if (typeof tableId === 'number') {
                    await apiService.tables.delete(tableId);
                }
                deleteTable(tableId);
                setActiveTableDetail(null);
            } catch (err) {
                console.error("Failed to delete table", err);
                alert("Failed to delete table");
            }
        }
    };

    const handleDownloadQr = (table) => {
        if (!table.qrDataUrl) return;
        const a = document.createElement('a');
        a.href = table.qrDataUrl;
        a.download = `Table-${table.number}-QR.png`;
        a.click();
    };

    const handlePrintQr = (table) => {
        if (!table.qrDataUrl) return;
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>Table ${table.number} QR Code</title>
            <style>
                body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; background:#fff; }
                img { width:200px; height:200px; }
                h2 { margin-top:12px; font-size:20px; color:#111; }
                p { color:#555; font-size:13px; }
            </style></head>
            <body>
                <img src="${table.qrDataUrl}" alt="QR Code" />
                <h2>Table ${table.number}</h2>
                <p>${table.floor} &bull; ${table.seats} Seats</p>
                <p style="font-size:11px;color:#999;">Scan to order from your phone</p>
                <script>window.onload=()=>{ window.print(); window.close(); }<\/script>
            </body></html>
        `);
        win.document.close();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'available': return <Badge variant="success">Available</Badge>;
            case 'occupied': return <Badge variant="destructive">Occupied</Badge>;
            case 'reserved': return <Badge variant="warning">Reserved</Badge>;
            default: return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'border-t-4 border-t-emerald-500 hover:border-emerald-400';
            case 'occupied': return 'border-t-4 border-t-rose-500 hover:border-rose-400';
            case 'reserved': return 'border-t-4 border-t-amber-500 hover:border-amber-400';
            default: return 'border-t-4 border-t-slate-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Table Layout</h1>
                    <p className="text-muted-foreground">Manage tables and QR codes. Click any table to view or print its QR.</p>
                </div>
                <Button onClick={() => setCreateModalOpen(true)} className="font-bold text-xs h-9 cursor-pointer">
                    <Plus size={14} className="mr-1.5" /> Add New Table
                </Button>
            </div>

            {/* Floor Filter Tabs */}
            {floors.length > 0 && (
                <div className="flex justify-between items-center bg-card p-1.5 rounded-lg border border-border/60 max-w-sm">
                    {floors.map((floor) => (
                        <button
                            key={floor}
                            onClick={() => setSelectedFloor(floor)}
                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                selectedFloor === floor
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {floor}
                        </button>
                    ))}
                </div>
            )}

            {/* Tables Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredTables.map((table) => (
                    <Card
                        key={table.id}
                        onClick={() => handleTableClick(table)}
                        className={`cursor-pointer transition-all hover:scale-[1.03] duration-200 select-none ${getStatusColor(table.status)}`}
                    >
                        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                            <span className="text-xs text-muted-foreground font-semibold">Table</span>
                            {getStatusBadge(table.status)}
                        </CardHeader>
                        <CardContent className="p-4 pt-1 space-y-3">
                            <h3 className="font-black text-3xl tracking-tight font-mono">{table.number}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <User size={14} />
                                <span>{table.seats} Seats</span>
                            </div>
                            {table.qrDataUrl && (
                                <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                                    <QrCode size={12} /> <span>QR Ready</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {filteredTables.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                        No tables on this floor yet. Add a new table above.
                    </div>
                )}
            </div>

            {/* ── Create Table Modal ─────────────────────────────────────── */}
            <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add New Table">
                <form onSubmit={handleCreateTable} className="space-y-4">
                    <Input
                        label="Table Number / Name"
                        placeholder="e.g. 105 or A3"
                        value={newTableNo}
                        onChange={(e) => setNewTableNo(e.target.value)}
                        required
                    />
                    <Input
                        label="Seats Count"
                        type="number"
                        min="1"
                        max="20"
                        value={newTableSeats}
                        onChange={(e) => setNewTableSeats(Number(e.target.value))}
                        required
                    />
                    <Select
                        label="Floor Location"
                        value={newTableFloor}
                        onChange={(e) => setNewTableFloor(e.target.value)}
                    >
                        <option value="1st Floor">1st Floor</option>
                        <option value="2nd Floor">2nd Floor</option>
                        <option value="Outdoor">Outdoor</option>
                    </Select>
                    <Button type="submit" className="w-full font-bold">
                        Create Table &amp; Generate QR
                    </Button>
                </form>
            </Modal>

            {/* ── Table Detail Modal ─────────────────────────────────────── */}
            <Modal
                isOpen={!!activeTableDetail}
                onClose={() => setActiveTableDetail(null)}
                title={`Table ${activeTableDetail?.table?.number}`}
                size="md"
            >
                {activeTableDetail && (
                    <div className="space-y-5 text-sm">
                        {/* Meta */}
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Location &amp; Seats</p>
                                <p className="font-bold">{activeTableDetail.table.floor} &bull; {activeTableDetail.table.seats} Seats</p>
                            </div>
                            <div className="flex gap-1.5">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => handleUpdateStatus(activeTableDetail.table.id, 'available')}
                                    className={`text-xs h-8 ${activeTableDetail.table.status === 'available' ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : ''}`}
                                >Available</Button>
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => handleUpdateStatus(activeTableDetail.table.id, 'reserved')}
                                    className={`text-xs h-8 ${activeTableDetail.table.status === 'reserved' ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' : ''}`}
                                >Reserve</Button>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="border border-border/40 rounded-xl p-4 flex flex-col items-center gap-3 bg-accent/10">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">QR Code</p>
                            {activeTableDetail.table.qrDataUrl ? (
                                <>
                                    <img
                                        src={activeTableDetail.table.qrDataUrl}
                                        alt={`QR for Table ${activeTableDetail.table.number}`}
                                        className="w-36 h-36 rounded-lg border border-border/30"
                                    />
                                    <p className="text-xs text-muted-foreground text-center">
                                        Customer scans this to access the ordering page
                                    </p>
                                    <a
                                        href={`${window.location.origin}/table/${activeTableDetail.table.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary font-medium hover:underline text-center break-all"
                                    >
                                        {`${window.location.origin}/table/${activeTableDetail.table.id}`}
                                    </a>
                                    <div className="flex gap-2 w-full mt-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1 text-xs h-9 gap-1.5 cursor-pointer"
                                            onClick={() => handleDownloadQr(activeTableDetail.table)}
                                        >
                                            <Download size={13} /> Download
                                        </Button>
                                        <Button
                                            className="flex-1 text-xs h-9 gap-1.5 cursor-pointer"
                                            onClick={() => handlePrintQr(activeTableDetail.table)}
                                        >
                                            <Printer size={13} /> Print
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-xs text-muted-foreground text-center py-4">
                                    Generating QR…
                                </div>
                            )}
                        </div>

                        <div className="border-t border-border/40" />

                        {/* Active Order */}
                        {activeTableDetail.order ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Active Order</h4>
                                    <Badge variant="warning" className="animate-pulse">
                                        {activeTableDetail.order.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <div className="p-3 bg-accent/20 rounded-lg border border-border/20 space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="font-bold">{activeTableDetail.order.orderNumber}</span>
                                        <span className="text-muted-foreground">
                                            {new Date(activeTableDetail.order.date).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Customer: {activeTableDetail.order.customerName}</p>
                                    <div className="border-t border-border/20 pt-2 space-y-1">
                                        {activeTableDetail.order.items.map((oi) => (
                                            <div key={oi.id} className="flex justify-between text-xs font-mono">
                                                <span>{oi.name} x{oi.quantity}</span>
                                                <span>${oi.lineTotal.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-border/20 pt-2 flex justify-between font-black text-xs font-mono">
                                        <span>Total</span>
                                        <span>${activeTableDetail.order.total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 text-xs h-9 cursor-pointer"
                                        onClick={() => {
                                            assignTable(activeTableDetail.table);
                                            usePOSStore.getState().loadDraftToCart(activeTableDetail.order);
                                            navigate('/pos');
                                        }}
                                    >Modify Order</Button>
                                    <Button
                                        className="flex-1 text-xs h-9 cursor-pointer font-bold"
                                        onClick={() => {
                                            assignTable(activeTableDetail.table);
                                            usePOSStore.getState().loadDraftToCart(activeTableDetail.order);
                                            navigate('/pos');
                                        }}
                                    >Go to Checkout</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground text-xs py-3">
                                <p>No active order on this table.</p>
                                <Button
                                    className="mt-3 text-xs cursor-pointer"
                                    onClick={() => { assignTable(activeTableDetail.table); navigate('/pos'); }}
                                >Create Order from POS</Button>
                            </div>
                        )}

                        {/* Delete */}
                        <div className="flex justify-end border-t border-border/40 pt-4">
                            <Button
                                variant="ghost"
                                className="text-xs text-destructive hover:bg-destructive/10 cursor-pointer h-9"
                                onClick={() => handleDeleteTableClick(activeTableDetail.table.id)}
                            >Delete Table</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default TableManagement;
