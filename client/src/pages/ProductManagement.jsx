import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { useEffect } from 'react';

export const ProductManagement = () => {
    const queryClient = useQueryClient();

    // Fetch Products
    const { data: products = [], isLoading: loadingProducts } = useQuery({
        queryKey: ['products'],
        queryFn: apiService.products.getAll,
    });

    // Fetch Categories
    const { data: categories = [], isLoading: loadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: apiService.categories.getAll,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: apiService.products.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }) => apiService.products.update(id, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: apiService.products.delete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    });

    // State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // Form States
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [price, setPrice] = useState('');
    const [taxRate, setTaxRate] = useState('');
    const [unit, setUnit] = useState('Pcs');
    const [description, setDescription] = useState('');

    // Filter products list
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Note: Backend object has `category.id`, mock might have had `categoryId`
            const catId = p.category?.id || p.categoryId;
            const matchesCategory = selectedCategoryFilter === 'all' ? true : catId === selectedCategoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, selectedCategoryFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCategoryFilter]);

    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleOpenCreate = () => {
        setEditingProduct(null);
        setName('');
        setCategoryId(categories[0]?.id || '');
        setPrice('');
        setTaxRate('0.08');
        setUnit('Pcs');
        setDescription('');
        setModalOpen(true);
    };

    const handleOpenEdit = (product) => {
        setEditingProduct(product);
        setName(product.name);
        setCategoryId(product.category?.id || product.categoryId);
        setPrice(product.price.toString());
        setTaxRate((product.taxPercent / 100).toString() || '0.08'); // Backend uses taxPercent (e.g. 5.00)
        setUnit(product.unitOfMeasure || product.unit || 'Pcs');
        setDescription(product.description || '');
        setModalOpen(true);
    };

    const handleDelete = (productId) => {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteMutation.mutate(productId);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !categoryId || !price) return;

        const parsedPrice = parseFloat(price);
        const parsedTaxPercent = (parseFloat(taxRate) || 0.08) * 100; // API expects percentage e.g. 8.0

        const payload = {
            name,
            category: { id: categoryId },
            price: parsedPrice,
            taxPercent: parsedTaxPercent,
            unitOfMeasure: unit,
            description,
        };

        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, updates: payload });
        } else {
            createMutation.mutate(payload);
        }
        setModalOpen(false);
    };

    const getCategoryName = (catId) => {
        const cat = categories.find((c) => c.id === catId);
        return cat ? cat.name : 'Unassigned';
    };

    const getCategoryColor = (catId) => {
        return categories.find((c) => c.id === catId)?.color || '#6b7280';
    };

    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Menu Catalog</h1>
          <p className="text-muted-foreground">Add new dishes, beverages, and sides, edit prices, and adjust VAT/tax rates.</p>
        </div>
        <Button onClick={handleOpenCreate} className="font-bold text-xs h-9 cursor-pointer">
          <Plus size={14} className="mr-1.5"/>
          Add Menu Item
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="glass border border-border/40">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <Input placeholder="Search by food item or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9"/>
          </div>

          <div className="flex bg-card p-1 rounded-lg border border-border/60 w-full md:w-auto overflow-x-auto">
            <button onClick={() => setSelectedCategoryFilter('all')} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${selectedCategoryFilter === 'all'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'}`}>
              All Categories
            </button>
            {categories.map((cat) => (<button key={cat.id} onClick={() => setSelectedCategoryFilter(cat.id)} className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${selectedCategoryFilter === cat.id
                ? 'bg-card text-foreground border border-border/40'
                : 'text-muted-foreground hover:text-foreground'}`}>
                {cat.name}
              </button>))}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Food Item Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Unit Price</TableHead>
            <TableHead>Tax Rate</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingProducts || loadingCategories ? (
            <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-xs">Loading...</TableCell>
            </TableRow>
          ) : paginatedProducts.length > 0 ? (paginatedProducts.map((p) => {
            const catId = p.category?.id || p.categoryId;
            const catColor = getCategoryColor(catId);
            return (<TableRow key={p.id}>
                  <TableCell className="font-bold text-xs">
                    <div>
                      <p className="font-bold">{p.name}</p>
                      {p.description && (<p className="text-xxs text-muted-foreground mt-0.5 max-w-[300px] truncate">{p.description}</p>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }}/>
                      {getCategoryName(catId)}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-xs">${p.price.toFixed(2)} / {p.unitOfMeasure || p.unit}</TableCell>
                  <TableCell className="font-mono text-xs">{((p.taxPercent || (p.taxRate * 100))).toFixed(0)}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => handleOpenEdit(p)}>
                        <Edit2 size={12}/>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                        <Trash2 size={12}/>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>);
        })) : (<TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-xs">
                No food items match the search criteria.
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Create / Edit Modal Form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Menu Item' : 'Add New Menu Item'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Food Item Name" placeholder="e.g. Pepperoni Pizza" value={name} onChange={(e) => setName(e.target.value)} required/>

          <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="" disabled>Select a category</option>
            {categories.map((cat) => (<option key={cat.id} value={cat.id}>
                {cat.name}
              </option>))}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Price ($)" type="number" step="0.01" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} required/>

            <Select label="Unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="Pcs">Pcs</option>
              <option value="Portion">Portion</option>
              <option value="Slice">Slice</option>
              <option value="Bottle">Bottle</option>
              <option value="Glass">Glass</option>
              <option value="Plate">Plate</option>
              <option value="Bowl">Bowl</option>
            </Select>
          </div>

          <Select label="Tax Rate (VAT / GST)" value={taxRate} onChange={(e) => setTaxRate(e.target.value)}>
            <option value="0">0% (Tax Free)</option>
            <option value="0.05">5% (Standard Service)</option>
            <option value="0.08">8% (Standard Food GST)</option>
            <option value="0.10">10% (Luxury Tax)</option>
            <option value="0.18">18% (Special/Alcohol Tax)</option>
          </Select>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea className="flex min-h-[80px] w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Provide simple ingredients or comments..." value={description} onChange={(e) => setDescription(e.target.value)}/>
          </div>

          <Button type="submit" className="w-full font-bold" disabled={createMutation.isPending || updateMutation.isPending}>
            {editingProduct ? 'Save Menu Item' : 'Add Menu Item'}
          </Button>
        </form>
      </Modal>
    </div>);
};

export default ProductManagement;
