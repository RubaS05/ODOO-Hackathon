import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ClipboardCheck, Lock, Check } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';

export const TableManagement: React.FC = () => {
  const navigate = useNavigate();
  const { tables, orders, assignTable, setTableStatus, addTable, deleteTable } = usePOSStore();
  const [selectedFloor, setSelectedFloor] = useState('1st Floor');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTableDetail, setActiveTableDetail] = useState<any | null>(null);

  // New Table Form States
  const [newTableNo, setNewTableNo] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [newTableFloor, setNewTableFloor] = useState('1st Floor');

  // Available floors list
  const floors = useMemo(() => {
    return Array.from(new Set(tables.map((t) => t.floor)));
  }, [tables]);

  // Filter tables by floor
  const filteredTables = useMemo(() => {
    return tables.filter((t) => t.floor === selectedFloor);
  }, [tables, selectedFloor]);

  const handleTableClick = (table: any) => {
    if (table.status === 'occupied') {
      // Find the associated active order
      const associatedOrder = orders.find((o) => o.id === table.currentOrderId || (o.tableId === table.id && o.status !== 'completed'));
      setActiveTableDetail({ table, order: associatedOrder });
    } else {
      // Available or Reserved -> Link table to cart and navigate to checkout
      assignTable(table);
      navigate('/');
    }
  };

  const handleUpdateStatus = (tableId: string, status: 'available' | 'occupied' | 'reserved') => {
    setTableStatus(tableId, status, status === 'available' ? undefined : activeTableDetail?.table?.currentOrderId);
    if (activeTableDetail) {
      setActiveTableDetail({
        ...activeTableDetail,
        table: { ...activeTableDetail.table, status }
      });
    }
  };

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNo) return;
    addTable({
      number: newTableNo,
      seats: Number(newTableSeats),
      floor: newTableFloor,
    });
    setNewTableNo('');
    setCreateModalOpen(false);
  };

  const handleDeleteTableClick = (tableId: string) => {
    if (confirm('Are you sure you want to delete this table?')) {
      deleteTable(tableId);
      setActiveTableDetail(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'occupied':
        return <Badge variant="destructive">Occupied</Badge>;
      case 'reserved':
        return <Badge variant="warning">Reserved</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'border-t-4 border-t-emerald-500 hover:border-emerald-400';
      case 'occupied':
        return 'border-t-4 border-t-rose-500 hover:border-rose-400';
      case 'reserved':
        return 'border-t-4 border-t-amber-500 hover:border-amber-400';
      default:
        return 'border-t-4 border-t-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Table Layout</h1>
          <p className="text-muted-foreground">Select a table to start an order, reservation, or view active orders.</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)} className="font-bold text-xs h-9 cursor-pointer">
          Add New Table
        </Button>
      </div>

      {/* Floor Filter Tabs */}
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

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredTables.map((table) => (
          <Card
            key={table.id}
            onClick={() => handleTableClick(table)}
            className={`cursor-pointer transition-all hover:scale-[1.03] duration-200 select-none ${getStatusColor(
              table.status
            )}`}
          >
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs text-muted-foreground font-semibold">Table</span>
              {getStatusBadge(table.status)}
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-4">
              <h3 className="font-black text-3xl tracking-tight font-mono">{table.number}</h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User size={14} />
                <span>{table.seats} Seats</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Table Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Table"
      >
        <form onSubmit={handleCreateTable} className="space-y-4">
          <Input
            label="Table Number"
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
            Create Table
          </Button>
        </form>
      </Modal>

      {/* Table Detail Modal (for Occupied tables) */}
      <Modal
        isOpen={!!activeTableDetail}
        onClose={() => setActiveTableDetail(null)}
        title={`Table ${activeTableDetail?.table?.number} Details`}
        size="md"
      >
        {activeTableDetail && (
          <div className="space-y-5 text-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xxs text-muted-foreground uppercase font-semibold">Location & Seats</p>
                <p className="font-bold">{activeTableDetail.table.floor} | {activeTableDetail.table.seats} Seats</p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(activeTableDetail.table.id, 'available')}
                  className={`text-xxs h-8 ${activeTableDetail.table.status === 'available' ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/30' : ''}`}
                >
                  Available
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(activeTableDetail.table.id, 'reserved')}
                  className={`text-xxs h-8 ${activeTableDetail.table.status === 'reserved' ? 'bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 border-amber-500/30' : ''}`}
                >
                  Reserve
                </Button>
              </div>
            </div>

            <div className="border-t border-border/40 my-3" />

            {activeTableDetail.order ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Active Order Detail</h4>
                  <Badge variant="warning" className="animate-pulse">{activeTableDetail.order.status.toUpperCase()}</Badge>
                </div>
                <div className="p-3 bg-accent/20 rounded-lg border border-border/20 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold">{activeTableDetail.order.orderNumber}</span>
                    <span className="text-muted-foreground">{new Date(activeTableDetail.order.date).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Customer: {activeTableDetail.order.customerName}</p>
                  
                  {/* Order items list */}
                  <div className="border-t border-border/20 pt-2 space-y-1">
                    {activeTableDetail.order.items.map((oi: any) => (
                      <div key={oi.id} className="flex justify-between text-xxs font-mono">
                        <span>{oi.name} x{oi.quantity}</span>
                        <span>${oi.lineTotal.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border/20 pt-2 flex justify-between font-black text-xs font-mono">
                    <span>Total Bill</span>
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
                      navigate('/');
                    }}
                  >
                    Modify Order
                  </Button>
                  <Button
                    className="flex-1 text-xs h-9 cursor-pointer font-bold"
                    onClick={() => {
                      assignTable(activeTableDetail.table);
                      usePOSStore.getState().loadDraftToCart(activeTableDetail.order);
                      navigate('/');
                    }}
                  >
                    Go to Checkout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground text-xs">
                No active order found. Table status seems occupied but has no orders.
                <Button
                  className="mt-3 text-xs w-full cursor-pointer"
                  onClick={() => {
                    assignTable(activeTableDetail.table);
                    navigate('/');
                  }}
                >
                  Create Order
                </Button>
              </div>
            )}

            <div className="border-t border-border/40 pt-4 flex justify-end">
              <Button
                variant="ghost"
                className="text-xs text-destructive hover:bg-destructive/10 cursor-pointer h-9"
                onClick={() => handleDeleteTableClick(activeTableDetail.table.id)}
              >
                Delete Table
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default TableManagement;
