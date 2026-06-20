import React, { useState } from 'react';
import { UserPlus, Key, Archive, Trash2, Users, Shield, User as UserIcon, ArchiveRestore } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { apiService } from '../services/api';

export const UserManagement = () => {
    const queryClient = useQueryClient();

    // Fetch users
    const { data: users = [], isLoading: loadingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: apiService.users.getAll,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: apiService.users.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    const archiveMutation = useMutation({
        mutationFn: apiService.users.archive,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    const deleteMutation = useMutation({
        mutationFn: apiService.users.delete,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    const passwordMutation = useMutation({
        mutationFn: ({ id, newPassword }) => apiService.users.resetPassword(id, newPassword),
    });

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [error, setError] = useState('');

    // Add User form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    const [password, setPassword] = useState('');

    // Change Password form
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');

    // Filter
    const [filterRole, setFilterRole] = useState('ALL');

    const filteredUsers = filterRole === 'ALL'
        ? users
        : users.filter(u => u.role === filterRole);

    const handleOpenCreate = () => {
        setSelectedUser(null);
        setName(''); setEmail(''); setRole('EMPLOYEE'); setPassword('');
        setError('');
        setModalOpen(true);
    };

    const handleOpenChangePassword = (user) => {
        setSelectedUser(user);
        setNewPassword(''); setConfirmPassword('');
        setPwError(''); setPwSuccess('');
        setPasswordModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) { setError('All fields are required.'); return; }
        setError('');
        
        createMutation.mutate({ name, email, password, role }, {
            onSuccess: () => setModalOpen(false),
            onError: (err) => setError(err.response?.data || 'Failed to create user')
        });
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
        if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return; }
        setPwError('');
        
        passwordMutation.mutate({ id: selectedUser.id, newPassword }, {
            onSuccess: () => setPwSuccess(`Password updated successfully for ${selectedUser.name}!`),
            onError: (err) => setPwError(err.response?.data || 'Failed to update password')
        });
    };

    const handleArchive = (user) => {
        archiveMutation.mutate(user.id);
    };

    const handleDelete = (userId, name) => {
        if (confirm(`Delete "${name}"? This cannot be undone.`)) {
            deleteMutation.mutate(userId);
        }
    };

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'ADMIN').length,
        employees: users.filter(u => u.role === 'EMPLOYEE').length,
        archived: users.filter(u => u.archived).length,
    };

    // UI Helpers
    const getRoleBadge = (r) => {
        switch (r) {
            case 'ADMIN': return <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-200">Admin</Badge>;
            case 'CHEF': return <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-200">Chef</Badge>;
            default: return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-200">Employee</Badge>;
        }
    };

    const getStatusBadge = (isArchived) => {
        if (!isArchived) return <Badge variant="success" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Active</Badge>;
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-200">Archived</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Staff & Roles</h1>
                    <p className="text-muted-foreground">Manage employees, chefs, and administrators.</p>
                </div>
                <Button onClick={handleOpenCreate} className="font-bold text-xs h-9 cursor-pointer">
                    <UserPlus size={14} className="mr-1.5" />
                    Add Staff Member
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Users', value: stats.total, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Administrators', value: stats.admins, icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10' },
                    { label: 'Employees', value: stats.employees, icon: UserIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Archived', value: stats.archived, icon: Archive, color: 'text-muted-foreground', bg: 'bg-muted/30' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
                        <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                            <Icon size={16} className={color} />
                        </div>
                        <div>
                            <p className="text-xxs text-muted-foreground font-medium">{label}</p>
                            <p className="text-xl font-black leading-tight">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Role Filter */}
            <div className="flex gap-2 flex-wrap">
                {['ALL', 'ADMIN', 'EMPLOYEE'].map(r => (
                    <button
                        key={r}
                        onClick={() => setFilterRole(r)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${filterRole === r
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent/50'}`}
                    >
                        {r === 'ALL' ? 'All Users' : r === 'ADMIN' ? 'Admins' : 'Employees'}
                    </button>
                ))}
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                                    No users found. Add your first user to get started.
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.map((user) => (
                            <TableRow key={user.id} className={user.status === 'inactive' ? 'opacity-50' : ''}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-sm">{user.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground font-mono">{user.email}</TableCell>
                                <TableCell>
                                    {user.role === 'ADMIN'
                                        ? <Badge variant="destructive" className="text-xxs">Admin</Badge>
                                        : <Badge variant="default" className="text-xxs">Employee</Badge>
                                    }
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.status === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                                        {user.status === 'active' ? 'Active' : 'Archived'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1.5">
                                        <Button
                                            variant="outline" size="icon"
                                            className="h-8 w-8 cursor-pointer text-amber-500 hover:bg-amber-500/10"
                                            title="Change password"
                                            onClick={() => handleOpenChangePassword(user)}
                                        >
                                            <Key size={13} />
                                        </Button>
                                        <Button
                                            variant="outline" size="icon"
                                            className={`h-8 w-8 cursor-pointer ${user.status === 'active' ? 'hover:bg-muted/50' : 'text-emerald-500 hover:bg-emerald-500/10'}`}
                                            title={user.status === 'active' ? 'Archive (deactivate) user' : 'Restore user'}
                                            onClick={() => handleArchive(user)}
                                        >
                                            {user.status === 'active' ? <Archive size={13} /> : <ArchiveRestore size={13} />}
                                        </Button>
                                        <Button
                                            variant="ghost" size="icon"
                                            className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10"
                                            title="Delete permanently"
                                            onClick={() => handleDelete(user.id, user.name)}
                                        >
                                            <Trash2 size={13} />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Add User Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New User">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                            {error}
                        </div>
                    )}
                    <Input
                        label="Full Name"
                        placeholder="e.g. Priya Cashier"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        placeholder="e.g. priya@cafe.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Initial Password"
                        type="password"
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <Select label="System Role" value={role} onChange={(e) => setRole(e.target.value)}>
                        <option value="EMPLOYEE">Employee / Cashier</option>
                        <option value="ADMIN">Admin / Manager</option>
                    </Select>
                    <p className="text-xxs text-muted-foreground">
                        A welcome email with login credentials will be sent automatically.
                    </p>
                    <Button type="submit" className="w-full font-bold cursor-pointer" disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Creating...' : 'Create User & Send Welcome Email'}
                    </Button>
                </form>
            </Modal>

            {/* Change Password Modal */}
            <Modal isOpen={passwordModalOpen} onClose={() => { setPasswordModalOpen(false); setPwSuccess(''); }} title={`Change Password — ${selectedUser?.name}`}>
                {pwSuccess ? (
                    <div className="space-y-4 text-center py-4">
                        <div className="mx-auto w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                            <Key size={28} className="text-emerald-500" />
                        </div>
                        <p className="font-bold text-sm">{pwSuccess}</p>
                        <Button className="w-full font-bold cursor-pointer" onClick={() => { setPasswordModalOpen(false); setPwSuccess(''); }}>
                            Done
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSavePassword} className="space-y-4">
                        {pwError && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                                {pwError}
                            </div>
                        )}
                        <div className="p-3 rounded-lg bg-accent/40 border border-border text-xs text-muted-foreground">
                            Setting new password for <strong className="text-foreground">{selectedUser?.name}</strong> ({selectedUser?.email})
                        </div>
                        <Input
                            label="New Password"
                            type="password"
                            placeholder="Min. 6 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <Button type="submit" className="w-full font-bold cursor-pointer" disabled={passwordMutation.isPending}>
                            {passwordMutation.isPending ? 'Updating...' : 'Update Password'}
                        </Button>
                    </form>
                )}
            </Modal>
        </div>
    );
};

export default UserManagement;
