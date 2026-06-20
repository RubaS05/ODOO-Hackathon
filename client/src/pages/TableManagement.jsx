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
import { Pagination } from '../components/ui/Pagination';

export const TableManagement = () => {
    const navigate = useNavigate();
    const {
        tables, orders, assignTable, setTableStatus,
        setTables, addTable, deleteTable, setTableQrDataUrl, currentUser
    } = usePOSStore();

    const isAdmin = currentUser?.role === 'ADMIN';

    const [selectedFloor, setSelectedFloor] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [activeTableDetail, setActiveTableDetail] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // New Table Form States
    const [newTableNo, setNewTableNo] = useState('');
    const [newTableSeats, setNewTableSeats] = useState(4);
    const [newTableFloor, setNewTableFloor] = useState('1st Floor');

    const [manageFloorsOpen, setManageFloorsOpen] = useState(false);
    const [newFloorName, setNewFloorName] = useState('');
    const [serverFloors, setServerFloors] = useState([]);

    // Available floors list
    const floors = useMemo(() => {
        if (serverFloors.length > 0) return serverFloors;
        const f = Array.from(new Set(tables.map((t) => t.floor).filter(Boolean)));
        return f.length ? f : ['1st Floor'];
    }, [tables, serverFloors]);

    // Auto-select first floor
    useEffect(() => {
        if (!selectedFloor && floors.length) setSelectedFloor(floors[0]);
    }, [floors, selectedFloor]);

    // Filter tables by floor
    const filteredTables = useMemo(() => {
        return tables.filter((t) => t.floor === selectedFloor);
    }, [tables, selectedFloor]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedFloor]);

    const totalPages = Math.ceil(filteredTables.length / rowsPerPage);
    const paginatedTables = filteredTables.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

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
            const apiFloors = await apiService.floors.getAll();
            setServerFloors(apiFloors.map(f => f.name));

            const mapped = await Promise.all(apiTables.map(async (t) => {
                const qrUrl = t.qrCodeUrl || `${window.location.origin}/table/${t.id}`;
                const dataUrl = await generateQrDataUrl(qrUrl);
                return {
                    ...t,
                    number: t.tableNumber,
                    floor: t.floorName || t.floor?.name || '1st Floor',
                    status: t.status ? t.status.toLowerCase() : (t.active ? 'available' : 'unavailable'),
                    occupiedMembers: t.occupiedMembers || 0,
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

        // Setup real-time WebSocket connection
        const wsUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8082/api').replace('http', 'ws').replace('/api', '') + '/ws/tables';
        let ws;
        let reconnectTimer;

        const connect = () => {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // Either a table was deleted or updated/created
                    if (data.deletedTableId) {
                        setTables(prev => prev.filter(t => t.id !== data.deletedTableId));
                    } else if (data.id) {
                        // Table updated or created
                        setTables(prev => {
                            const exists = prev.find(t => t.id === data.id);
                            if (exists) {
                                return prev.map(t => t.id === data.id ? {
                                    ...t,
                                    number: data.tableNumber,
                                    floor: data.floorName || t.floor,
                                    status: data.status ? data.status.toLowerCase() : 'available',
                                    occupiedMembers: data.occupiedMembers || 0
                                } : t);
                            } else {
                                // For a brand new table, we should ideally generate the QR code too.
                                // Calling loadTables() handles all that cleanly instead of duplicating logic.
                                loadTables();
                                return prev;
                            }
                        });
                        
                        // If the currently open modal is this table, update it
                        setActiveTableDetail(prev => {
                            if (prev && prev.table.id === data.id) {
                                return {
                                    ...prev,
                                    table: {
                                        ...prev.table,
                                        status: data.status ? data.status.toLowerCase() : 'available',
                                        occupiedMembers: data.occupiedMembers || 0
                                    }
                                };
                            }
                            return prev;
                        });
                    }
                } catch (e) {
                    console.error("WS parse error", e);
                }
            };
            ws.onclose = () => {
                reconnectTimer = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            clearTimeout(reconnectTimer);
            if (ws) ws.close();
        };
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
            loadTables(); // Refresh to ensure backend sync
        } catch (error) {
            console.error("Failed to create table", error);
            alert("Error creating table");
        }
    };

    const handleCreateFloor = async (e) => {
        e.preventDefault();
        if (!newFloorName) return;
        try {
            await apiService.floors.create({ name: newFloorName });
            setNewFloorName('');
            loadTables();
        } catch (err) {
            console.error("Failed to create floor", err);
            alert("Error creating floor");
        }
    };

    const handleDeleteFloor = async (floorName) => {
        if (!confirm(`Are you sure you want to delete ${floorName}? This will fail if tables exist on this floor.`)) return;
        try {
            const apiFloors = await apiService.floors.getAll();
            const f = apiFloors.find(fl => fl.name === floorName);
            if (f) {
                await apiService.floors.delete(f.id);
                loadTables();
            }
        } catch (err) {
            console.error("Failed to delete floor", err);
            alert("Cannot delete floor. Make sure it has no tables.");
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
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Table Layout</h1>
                        <p className="text-muted-foreground">Manage tables and view status.</p>
                    </div>
                    {/* Dashboard Banner */}
                    <div className="hidden sm:flex items-center gap-3 bg-card px-4 py-2 rounded-lg border border-border shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Occupied</span>
                            <span className="font-mono font-black text-lg text-rose-500 leading-none">
                                {tables.reduce((sum, t) => sum + (Number(t.occupiedMembers) || 0), 0)}
                            </span>
                        </div>
                        <div className="w-px h-8 bg-border"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Seats</span>
                            <span className="font-mono font-black text-lg text-emerald-500 leading-none">
                                {tables.reduce((sum, t) => sum + (Number(t.seats) || 0), 0)}
                            </span>
                        </div>
                    </div>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button onClick={() => setManageFloorsOpen(true)} variant="outline" className="font-bold text-xs h-9 cursor-pointer">
                            Manage Floors
                        </Button>
                        <Button onClick={() => setCreateModalOpen(true)} className="font-bold text-xs h-9 cursor-pointer">
                            <Plus size={14} className="mr-1.5" /> Add New Table
                        </Button>
                    </div>
                )}
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
                {paginatedTables.map((table) => (
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
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <User size={14} />
                                    <span>{table.seats} Seats</span>
                                </div>
                                <div className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                    {table.occupiedMembers}/{table.seats}
                                </div>
                            </div>
                            {table.qrDataUrl && (
                                <div className="flex items-center gap-1 text-xs text-primary font-semibold">
                                    <QrCode size={12} /> <span>QR Ready</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {paginatedTables.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                        No tables on this floor yet. Add a new table above.
                    </div>
                )}
            </div>
            
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

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
                        {floors.map(f => (
                            <option key={f} value={f}>{f}</option>
                        ))}
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
                        <div className="flex justify-between items-center bg-card p-3 rounded-xl border border-border/50 shadow-sm">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Live Tracking</p>
                                <div className="flex items-center gap-3">
                                    <Select 
                                        className="h-8 text-xs font-bold" 
                                        value={activeTableDetail.table.status.toUpperCase()} 
                                        onChange={(e) => {
                                            const status = e.target.value;
                                            const occupied = status === 'AVAILABLE' ? 0 : (Number(activeTableDetail.table.occupiedMembers) || 0);
                                            setActiveTableDetail(prev => ({...prev, hasUnsavedChanges: true, table: {...prev.table, status: status.toLowerCase(), occupiedMembers: occupied}}));
                                        }}
                                    >
                                        <option value="AVAILABLE">Available</option>
                                        <option value="OCCUPIED">Occupied</option>
                                        <option value="RESERVED">Reserved</option>
                                    </Select>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-muted-foreground">Members:</span>
                                        <div className="flex items-center">
                                            <button 
                                                onClick={() => {
                                                    const currentMem = Number(activeTableDetail.table.occupiedMembers) || 0;
                                                    const newMem = Math.max(0, currentMem - 1);
                                                    setActiveTableDetail(prev => ({...prev, hasUnsavedChanges: true, table: {...prev.table, occupiedMembers: newMem}}));
                                                }}
                                                className="w-6 h-6 rounded bg-accent flex items-center justify-center font-bold text-lg hover:bg-primary hover:text-white transition-colors"
                                            >-</button>
                                            <span className="w-8 text-center font-mono font-bold">{Number(activeTableDetail.table.occupiedMembers) || 0}</span>
                                            <button 
                                                onClick={() => {
                                                    const currentMem = Number(activeTableDetail.table.occupiedMembers) || 0;
                                                    const newMem = Math.min(activeTableDetail.table.seats, currentMem + 1);
                                                    setActiveTableDetail(prev => ({...prev, hasUnsavedChanges: true, table: {...prev.table, occupiedMembers: newMem}}));
                                                }}
                                                className="w-6 h-6 rounded bg-accent flex items-center justify-center font-bold text-lg hover:bg-primary hover:text-white transition-colors"
                                            >+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col justify-between items-end h-full">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Location</p>
                                    <p className="font-bold">{activeTableDetail.table.floor}</p>
                                </div>
                                <Button 
                                    size="sm"
                                    className="mt-2 h-8 text-xs font-bold bg-primary text-white"
                                    onClick={() => {
                                        const { id, status, occupiedMembers } = activeTableDetail.table;
                                        apiService.tables.update(id, { 
                                            status: status.toUpperCase(), 
                                            occupiedMembers: Number(occupiedMembers) || 0 
                                        }).then(() => {
                                            loadTables();
                                            setActiveTableDetail(prev => ({...prev, hasUnsavedChanges: false}));
                                        });
                                    }}
                                >
                                    {activeTableDetail.hasUnsavedChanges ? 'Save Updates' : 'Force Update'}
                                </Button>
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

                        {/* Delete (Admin Only) */}
                        {isAdmin && (
                            <div className="flex justify-end border-t border-border/40 pt-4">
                                <Button
                                    variant="ghost"
                                    className="text-xs text-destructive hover:bg-destructive/10 cursor-pointer h-9"
                                    onClick={() => handleDeleteTableClick(activeTableDetail.table.id)}
                                >Delete Table</Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── Floor Management Modal (Admin Only) ────────────────────── */}
            <Modal isOpen={manageFloorsOpen} onClose={() => setManageFloorsOpen(false)} title="Manage Floors" size="sm">
                <div className="space-y-4">
                    <form onSubmit={handleCreateFloor} className="flex gap-2">
                        <Input 
                            value={newFloorName} 
                            onChange={(e) => setNewFloorName(e.target.value)} 
                            placeholder="New Floor Name..." 
                            required 
                        />
                        <Button type="submit" className="shrink-0 font-bold">Add</Button>
                    </form>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {serverFloors.map(floor => (
                            <div key={floor} className="flex justify-between items-center p-2 rounded-lg border border-border bg-card">
                                <span className="font-bold text-sm">{floor}</span>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteFloor(floor)} className="h-7 px-2 text-destructive hover:bg-destructive/10">
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TableManagement;
