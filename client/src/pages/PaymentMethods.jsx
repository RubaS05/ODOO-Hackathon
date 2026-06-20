import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, CreditCard, DollarSign, QrCode, Plus } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
export const PaymentMethods = () => {
    const { paymentMethods, togglePaymentMethodStatus, addPaymentMethod, updatePaymentMethod } = usePOSStore();
    // States
    const [modalOpen, setModalOpen] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('cash');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name)
            return;
        addPaymentMethod({ name, type, status: true });
        setModalOpen(false);
        setName('');
    };
    const getIcon = (type) => {
        switch (type) {
            case 'cash':
                return <DollarSign className="text-emerald-500" size={18}/>;
            case 'card':
                return <CreditCard className="text-blue-500" size={18}/>;
            case 'upi':
                return <QrCode className="text-purple-500" size={18}/>;
            default:
                return <DollarSign size={18}/>;
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Payment Methods</h1>
          <p className="text-muted-foreground">Configure checking methods (Cash, Card, UPI) and edit active service status.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="font-bold text-xs h-9 cursor-pointer">
          <Plus size={14} className="mr-1.5"/>
          Add Payment Method
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table View (8 cols) */}
        <div className="lg:col-span-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Active Status</TableHead>
                <TableHead className="text-right">Action Toggle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethods.map((pm) => (<TableRow key={pm.id}>
                  <TableCell className="font-bold text-xs">
                    <div className="flex items-center gap-2.5">
                      {getIcon(pm.type)}
                      <span>{pm.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs uppercase font-semibold font-mono text-muted-foreground">
                    {pm.type}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-bold ${pm.status ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                      {pm.status ? 'Active' : 'Disabled'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button onClick={() => togglePaymentMethodStatus(pm.id)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center">
                      {pm.status ? (<ToggleRight size={32} className="text-primary"/>) : (<ToggleLeft size={32}/>)}
                    </button>
                  </TableCell>
                </TableRow>))}
            </TableBody>
          </Table>
        </div>

        {/* UPI QR Preview Side Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="glass border border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">UPI QR Code Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-xxs text-muted-foreground leading-normal">
                This is a mock visualization of the dynamic UPI payment QR code generated on the POS payment page.
              </p>
              
              <div className="mx-auto w-40 h-40 bg-white border border-border p-3 rounded-xl flex items-center justify-center shadow-inner">
                <QrCode size={140} className="text-slate-900"/>
              </div>

              <div className="p-3 bg-accent/20 rounded-lg border border-border/20 text-xxs font-mono space-y-1">
                <p className="font-bold">Merchant VPA: gastropos@ybl</p>
                <p className="text-muted-foreground">Powered by mock payment gateway</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Payment Method">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Method Name" placeholder="e.g. Visa / Mastercard or PhonePe UPI" value={name} onChange={(e) => setName(e.target.value)} required/>

          <Select label="Payment Type" value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="cash">Cash Channel</option>
            <option value="card">Card Terminal</option>
            <option value="upi">UPI / QR Scan</option>
          </Select>

          <Button type="submit" className="w-full font-bold">
            Add Method
          </Button>
        </form>
      </Modal>
    </div>);
};
export default PaymentMethods;
