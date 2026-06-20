import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';

const PREMIUM_COLORS = [
    '#ec4899', '#f97316', '#eab308', '#a855f7', '#06b6d4', '#10b981',
    '#3b82f6', '#ef4444', '#6366f1', '#14b8a6', '#84cc16', '#f43f5e',
];

export const CategoryManagement = () => {
    const queryClient = useQueryClient();

    // Fetch categories from Backend
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: apiService.categories.getAll,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: apiService.categories.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => apiService.categories.update(id, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: apiService.categories.delete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    });

    // State
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const totalPages = Math.ceil(categories.length / rowsPerPage);
    const paginatedCategories = categories.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Form States
    const [name, setName] = useState('');
    const [color, setColor] = useState('#3b82f6');

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setName('');
        setColor(PREMIUM_COLORS[0]);
        setModalOpen(true);
    };

    const handleOpenEdit = (category) => {
        setEditingCategory(category);
        setName(category.name);
        setColor(category.color);
        setModalOpen(true);
    };

    const handleDelete = (categoryId) => {
        if (confirm('Are you sure you want to delete this category? All products under this category will also be deleted.')) {
            deleteMutation.mutate(categoryId);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name) return;

        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, updates: { name, color, kitchenDisplay: true } });
        } else {
            createMutation.mutate({ name, color, kitchenDisplay: true });
        }
        setModalOpen(false);
        setName('');
    };

    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Classify food menu items and customize their POS interface colors.</p>
        </div>
        <Button onClick={handleOpenCreate} className="font-bold text-xs h-9 cursor-pointer">
          <Plus size={14} className="mr-1.5"/>
          Add Category
        </Button>
      </div>

      {/* Categories Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category Name</TableHead>
            <TableHead>Color Theme Tag</TableHead>
            <TableHead>HEX Code</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-xs">Loading categories...</TableCell>
            </TableRow>
          ) : paginatedCategories.length > 0 ? (paginatedCategories.map((cat) => (<TableRow key={cat.id}>
                <TableCell className="font-bold text-xs">{cat.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: cat.color }}/>
                    <span className="text-xs font-semibold">Preview Dot</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{cat.color.toUpperCase()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => handleOpenEdit(cat)}>
                      <Edit2 size={12}/>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cat.id)}>
                      <Trash2 size={12}/>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>))) : (<TableRow>
              <TableCell colSpan={4} className="text-center py-12 text-muted-foreground text-xs">
                No categories found. Create one to classify your products.
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Create / Edit Modal Form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Create Category'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Category Name" placeholder="e.g. Soups, Italian" value={name} onChange={(e) => setName(e.target.value)} required/>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Theme Color</label>
            <div className="grid grid-cols-6 gap-2 p-3 bg-accent/20 rounded-lg border border-border/20">
              {PREMIUM_COLORS.map((hex) => (<button key={hex} type="button" onClick={() => setColor(hex)} className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer mx-auto ${color === hex ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: hex }}/>))}
            </div>
            
            {/* Custom Hex input */}
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded border border-border" style={{ backgroundColor: color }}/>
              <Input placeholder="#000000" value={color} onChange={(e) => setColor(e.target.value)} className="font-mono text-xs h-10"/>
            </div>
          </div>

          <Button type="submit" className="w-full font-bold">
            {editingCategory ? 'Save Category' : 'Create Category'}
          </Button>
        </form>
      </Modal>
    </div>);
};

export default CategoryManagement;
