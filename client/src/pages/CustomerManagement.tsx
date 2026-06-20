import React, { useState, useMemo } from 'react';
import { Search, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const CustomerManagement: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = usePOSStore();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Filter customers list
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setModalOpen(true);
  };

  const handleOpenEdit = (customer: any) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setEmail(customer.email);
    setPhone(customer.phone);
    setModalOpen(true);
  };

  const handleDelete = (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(customerId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, { name, email, phone });
    } else {
      addCustomer({ name, email, phone });
    }

    setModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Customer Database</h1>
          <p className="text-muted-foreground">Manage and track guest listings, contact details, and check histories.</p>
        </div>
        <Button onClick={handleOpenCreate} className="font-bold text-xs h-9 cursor-pointer">
          <UserPlus size={14} className="mr-1.5" />
          Add Customer
        </Button>
      </div>

      {/* Search Filter Card */}
      <Card className="glass border border-border/40">
        <CardContent className="p-4">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customer list table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Full Name</TableHead>
            <TableHead>Email Address</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((cust) => (
              <TableRow key={cust.id}>
                <TableCell className="font-bold text-xs">{cust.name}</TableCell>
                <TableCell className="text-xs font-mono">{cust.email}</TableCell>
                <TableCell className="text-xs font-mono">{cust.phone}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => handleOpenEdit(cust)}
                    >
                      <Edit2 size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(cust.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-xs">
                No customer records match your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Create / Edit Modal Form */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Alice Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. alice@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            placeholder="e.g. +1 555-0100"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <Button type="submit" className="w-full font-bold">
            {editingCustomer ? 'Save Changes' : 'Create Customer'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};
export default CustomerManagement;
