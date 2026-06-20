import React, { useState } from 'react';
import { UserPlus, Key, Edit2, Archive, Trash2 } from 'lucide-react';
import { usePOSStore } from '../store/posStore';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
export const UserManagement = () => {
    const { users, addUser, updateUser, deleteUser } = usePOSStore();
    // Modals state
    const [modalOpen, setModalOpen] = useState(false);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('EMPLOYEE');
    // Password states
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const handleOpenCreate = () => {
        setSelectedUser(null);
        setName('');
        setEmail('');
        setUsername('');
        setRole('EMPLOYEE');
        setModalOpen(true);
    };
    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setName(user.name);
        setEmail(user.email);
        setUsername(user.username);
        setRole(user.role);
        setModalOpen(true);
    };
    const handleOpenChangePassword = (user) => {
        setSelectedUser(user);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordModalOpen(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !email || !username)
            return;
        if (selectedUser) {
            updateUser(selectedUser.id, { name, email, username, role });
        }
        else {
            addUser({ name, email, username, role });
        }
        setModalOpen(false);
    };
    const handleSavePassword = (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        alert(`Password updated successfully for employee: ${selectedUser?.name}`);
        setPasswordModalOpen(false);
    };
    const handleArchive = (user) => {
        const nextStatus = user.status === 'active' ? 'inactive' : 'active';
        updateUser(user.id, { status: nextStatus });
    };
    const handleDelete = (userId) => {
        if (confirm('Are you sure you want to delete this employee?')) {
            deleteUser(userId);
        }
    };
    const getRoleBadge = (role) => {
        switch (role) {
            case 'ADMIN':
                return <Badge variant="destructive">Admin</Badge>;
            case 'EMPLOYEE':
                return <Badge variant="default">Employee</Badge>;
            default:
                return <Badge variant="secondary">{role}</Badge>;
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage employee rosters, assign system roles, and reset credentials.</p>
        </div>
        <Button onClick={handleOpenCreate} className="font-bold text-xs h-9 cursor-pointer">
          <UserPlus size={14} className="mr-1.5"/>
          Add Employee
        </Button>
      </div>

      {/* Users table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Full Name</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Email Address</TableHead>
            <TableHead>System Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (<TableRow key={user.id}>
              <TableCell className="font-bold text-xs">{user.name}</TableCell>
              <TableCell className="text-xs font-mono">{user.username}</TableCell>
              <TableCell className="text-xs font-mono">{user.email}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell>
                <span className={`text-xs font-bold ${user.status === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                  {user.status === 'active' ? 'Active' : 'Archived'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer" title="Edit profile" onClick={() => handleOpenEdit(user)}>
                    <Edit2 size={12}/>
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer text-yellow-500" title="Change password" onClick={() => handleOpenChangePassword(user)}>
                    <Key size={12}/>
                  </Button>
                  <Button variant="outline" size="icon" className={`h-8 w-8 cursor-pointer ${user.status === 'active' ? 'text-muted-foreground' : 'text-emerald-500'}`} title={user.status === 'active' ? 'Archive user' : 'Restore user'} onClick={() => handleArchive(user)}>
                    <Archive size={12}/>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-destructive hover:bg-destructive/10" title="Delete user" onClick={() => handleDelete(user.id)}>
                    <Trash2 size={12}/>
                  </Button>
                </div>
              </TableCell>
            </TableRow>))}
        </TableBody>
      </Table>

      {/* Add / Edit user form */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedUser ? 'Edit Staff Profile' : 'Register New Employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" placeholder="e.g. Robert Chef" value={name} onChange={(e) => setName(e.target.value)} required/>
          <Input label="Username" placeholder="e.g. chefrobert" value={username} onChange={(e) => setUsername(e.target.value)} required/>
          <Input label="Email Address" type="email" placeholder="e.g. robert@pos.com" value={email} onChange={(e) => setEmail(e.target.value)} required/>

          <Select label="System Role" value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">System Administrator</option>
          </Select>

          <Button type="submit" className="w-full font-bold">
            {selectedUser ? 'Save Profile' : 'Register Employee'}
          </Button>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title={`Change Password: ${selectedUser?.name}`}>
        <form onSubmit={handleSavePassword} className="space-y-4">
          <Input label="New Password" type="password" placeholder="Enter at least 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required/>
          <Input label="Confirm New Password" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required/>
          <Button type="submit" className="w-full font-bold">
            Update Password
          </Button>
        </form>
      </Modal>
    </div>);
};
export default UserManagement;
