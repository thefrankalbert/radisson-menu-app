"use client";

import { useEffect, useState } from "react";
import {
    Users,
    Plus,
    UserCheck,
    UserX,
    Trash2,
    Edit,
    X,
    Save,
    Mail,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    Shield,
    Coffee,
    CreditCard,
    ChefHat,
    History,
    AlertTriangle,
    Search,
    Crown,
    ShieldCheck,
    Activity
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { ListPageSkeleton } from "@/components/admin/Skeleton";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import { createAdminUserAction, deleteAdminUserAction } from "@/actions/admin-actions";
import { AdminUser, AdminRole } from "@/types/admin";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<AdminRole, {
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    description: string;
    level: number;
}> = {
    superadmin: {
        label: "Super Admin",
        icon: <Crown className="w-4 h-4" />,
        color: "text-purple-700",
        bgColor: "bg-purple-100",
        description: "Accès complet - peut créer d'autres admins (max 2)",
        level: 100
    },
    admin: {
        label: "Administrateur",
        icon: <ShieldCheck className="w-4 h-4" />,
        color: "text-blue-700",
        bgColor: "bg-blue-100",
        description: "Gestion complète sauf création de superadmin",
        level: 80
    },
    caissier: {
        label: "Caissier",
        icon: <CreditCard className="w-4 h-4" />,
        color: "text-emerald-700",
        bgColor: "bg-emerald-100",
        description: "Caisse, paiements, factures, remboursements",
        level: 60
    },
    chef: {
        label: "Chef Cuisine",
        icon: <ChefHat className="w-4 h-4" />,
        color: "text-orange-700",
        bgColor: "bg-orange-100",
        description: "Réception et validation des commandes en cuisine",
        level: 40
    },
    serveur: {
        label: "Serveur",
        icon: <Coffee className="w-4 h-4" />,
        color: "text-gray-700",
        bgColor: "bg-gray-100",
        description: "Prise de commandes et service",
        level: 20
    }
};

const MAX_SUPERADMINS = 2;

export default function UsersPage() {
    const { t } = useLanguage();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<AdminRole | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<AdminRole | "all">("all");
    const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');

    // Form state
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "serveur" as AdminRole
    });

    const superadminCount = users.filter(u => u.role === 'superadmin').length;
    const activeUsers = users.filter(u => u.is_active).length;

    useEffect(() => {
        loadUsers();
        checkCurrentUserRole();
    }, []);

    const loadUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            toast.error('Erreur lors du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const checkCurrentUserRole = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('admin_users')
                    .select('role')
                    .eq('email', user.email)
                    .single();

                if (data) {
                    setCurrentUserRole(data.role as AdminRole);
                }
            }
        } catch (error) {
            console.error('Erreur vérification rôle:', error);
        }
    };

    const canManageUsers = currentUserRole === 'superadmin' || currentUserRole === 'admin';
    const isSuperAdmin = currentUserRole === 'superadmin';

    const handleCreateUser = async () => {
        if (!canManageUsers) {
            toast.error('Vous n\'avez pas les droits pour créer des utilisateurs');
            return;
        }

        if (formData.role === 'superadmin' && superadminCount >= MAX_SUPERADMINS) {
            toast.error(`Maximum ${MAX_SUPERADMINS} Super Admins autorisés`);
            return;
        }

        if (formData.role === 'superadmin' && currentUserRole !== 'superadmin') {
            toast.error('Seuls les Super Admins peuvent créer d\'autres Super Admins');
            return;
        }

        if (!formData.email || !formData.password) {
            toast.error('Email et mot de passe requis');
            return;
        }

        try {
            const result = await createAdminUserAction(formData);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success('Utilisateur créé avec succès');
            setShowModal(false);
            resetForm();
            loadUsers();
        } catch (error: any) {
            console.error('Erreur création utilisateur:', error);
            toast.error('Erreur lors de la création');
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        if (formData.role === 'superadmin' && editingUser.role !== 'superadmin' && superadminCount >= MAX_SUPERADMINS) {
            toast.error(`Maximum ${MAX_SUPERADMINS} Super Admins autorisés`);
            return;
        }
        if (formData.role === 'superadmin' && editingUser.role !== 'superadmin' && currentUserRole !== 'superadmin') {
            toast.error('Seuls les Super Admins peuvent créer d\'autres Super Admins');
            return;
        }

        try {
            const { error } = await supabase
                .from('admin_users')
                .update({
                    full_name: formData.full_name,
                    role: formData.role
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            toast.success('Utilisateur mis à jour');
            setShowModal(false);
            setEditingUser(null);
            resetForm();
            loadUsers();
        } catch (error: any) {
            console.error('Erreur mise à jour:', error);
            toast.error(error.message || 'Erreur lors de la mise à jour');
        }
    };

    const handleToggleActive = async (user: AdminUser) => {
        if (!canManageUsers) return;
        if (user.role === 'superadmin' && user.is_active && superadminCount <= 1) {
            toast.error('Impossible de désactiver le dernier Super Admin');
            return;
        }

        try {
            const { error } = await supabase
                .from('admin_users')
                .update({ is_active: !user.is_active })
                .eq('id', user.id);

            if (error) throw error;
            toast.success(user.is_active ? 'Utilisateur désactivé' : 'Utilisateur activé');
            loadUsers();
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la mise à jour');
        }
    };

    const handleDeleteUser = async (user: AdminUser) => {
        if (!canManageUsers) {
            toast.error('Vous n\'avez pas les droits pour supprimer des utilisateurs');
            return;
        }
        if (user.role === 'superadmin' && currentUserRole !== 'superadmin') {
            toast.error('Seuls les Super Admins peuvent supprimer d\'autres Super Admins');
            return;
        }
        if (user.role === 'superadmin' && superadminCount <= 1) {
            toast.error('Impossible de supprimer le dernier Super Admin');
            return;
        }
        if (!confirm(`Supprimer l'utilisateur ${user.email} ?`)) return;

        try {
            const result = await deleteAdminUserAction(user.id, user.user_id);
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success('Utilisateur supprimé avec succès');
            loadUsers();
        } catch (error: any) {
            console.error('Erreur suppression:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const resetForm = () => {
        setFormData({
            email: "",
            password: "",
            full_name: "",
            role: "serveur"
        });
        setShowPassword(false);
    };

    const openEditModal = (user: AdminUser) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: "",
            full_name: user.full_name || "",
            role: user.role
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingUser(null);
        resetForm();
        setShowModal(true);
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === "all" || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    if (loading) {
        return <ListPageSkeleton />;
    }

    return (
        <div className="space-y-6 pb-10 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">
                        {t('team')}
                    </h1>
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider mt-1">
                        {users.length} membre{users.length > 1 ? 's' : ''} • {activeUsers} actif{activeUsers > 1 ? 's' : ''}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-muted p-1 rounded-md border border-border">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all",
                                activeTab === 'users' ? 'bg-background text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {t('items')}
                        </button>
                        {isSuperAdmin && (
                            <button
                                onClick={() => setActiveTab('history')}
                                className={cn(
                                    "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-sm transition-all flex items-center gap-1.5",
                                    activeTab === 'history' ? 'bg-background text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <History className="w-3 h-3" />
                                {t('full_history')}
                            </button>
                        )}
                    </div>
                </div>

                {canManageUsers && activeTab === 'users' && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold text-xs tracking-tight hover:opacity-90 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t('add_item')}</span>
                    </button>
                )}
            </div>

            {activeTab === 'users' ? (
                <>
                    {/* Role Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {(Object.keys(ROLE_CONFIG) as AdminRole[]).map((role) => {
                            const config = ROLE_CONFIG[role];
                            const count = users.filter(u => u.role === role).length;

                            return (
                                <button
                                    key={role}
                                    onClick={() => setFilterRole(filterRole === role ? "all" : role)}
                                    className={cn(
                                        "p-4 rounded-md border transition-all text-left",
                                        filterRole === role
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-card hover:border-muted-foreground/30'
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-md flex items-center justify-center mb-4 transition-colors",
                                        filterRole === role ? "bg-primary-foreground/20 text-primary-foreground" : config.bgColor + " " + config.color
                                    )}>
                                        {config.icon}
                                    </div>
                                    <p className="text-xl font-bold tabular-nums">{count}</p>
                                    <p className={cn("text-[9px] font-semibold uppercase tracking-wider truncate", filterRole === role ? "opacity-70" : "text-muted-foreground")}>{config.label}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher par nom ou email..."
                            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-md focus:ring-1 focus:ring-ring transition-all text-xs font-semibold text-foreground outline-none"
                        />
                    </div>

                    {/* Users List */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                        {filteredUsers.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => {
                                    const roleConfig = ROLE_CONFIG[user.role];

                                    return (
                                        <div
                                            key={user.id}
                                            className={`p-4 hover:bg-gray-50/50 transition-colors ${!user.is_active ? 'opacity-60 grayscale' : ''}`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl ${roleConfig.bgColor} ${roleConfig.color} flex items-center justify-center`}>
                                                        {roleConfig.icon}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold text-gray-900">
                                                                {user.full_name || 'Sans nom'}
                                                            </h3>
                                                            {!user.is_active && (
                                                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full flex items-center gap-1">
                                                                    <UserX className="w-3 h-3" /> Inactif
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${roleConfig.bgColor} ${roleConfig.color}`}>
                                                        {roleConfig.label}
                                                    </span>

                                                    {canManageUsers && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleToggleActive(user)}
                                                                className={`p-2 rounded-lg transition-colors ${user.is_active
                                                                    ? 'text-gray-400 hover:bg-red-50 hover:text-red-500'
                                                                    : 'text-emerald-500 hover:bg-emerald-50'
                                                                    }`}
                                                                title={user.is_active ? 'Désactiver' : 'Activer'}
                                                            >
                                                                {user.is_active ? <UserCheck className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(user)}
                                                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Modifier"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteUser(user)}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Supprimer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {user.last_login && (
                                                <div className="flex items-center gap-2 mt-2 ml-16 text-xs text-gray-400">
                                                    <Activity className="w-3 h-3" />
                                                    Dernière connexion: {new Date(user.last_login).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                    {searchQuery || filterRole !== "all" ? "Aucun résultat" : "Aucun utilisateur"}
                                </h3>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <History className="w-16 h-16 text-blue-100 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Historique des Audits</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                        Cette fonctionnalité permettra aux Super Admins de voir qui a modifié quoi.
                    </p>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setEditingUser(null);
                        resetForm();
                    }}
                    title={editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!!editingUser}
                                    className="w-full h-10 pl-10 pr-4 bg-background border border-input rounded-md text-xs font-medium focus:ring-1 focus:ring-ring outline-none disabled:opacity-50"
                                    placeholder="email@exemple.com"
                                />
                            </div>
                        </div>

                        {!editingUser && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full h-10 pl-10 pr-10 bg-background border border-input rounded-md text-xs font-medium focus:ring-1 focus:ring-ring outline-none"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Nom complet</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full h-10 pl-10 pr-4 bg-background border border-input rounded-md text-xs font-medium focus:ring-1 focus:ring-ring outline-none"
                                    placeholder="Jean Dupont"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Rôle</label>
                            <div className="grid grid-cols-1 gap-2">
                                {(Object.keys(ROLE_CONFIG) as AdminRole[]).map((role) => {
                                    const config = ROLE_CONFIG[role];
                                    const isDisabled = role === 'superadmin' &&
                                        (currentUserRole !== 'superadmin' ||
                                            (superadminCount >= MAX_SUPERADMINS && editingUser?.role !== 'superadmin'));

                                    return (
                                        <label
                                            key={role}
                                            className={cn(
                                                "flex items-center p-3 border rounded-md cursor-pointer transition-all",
                                                formData.role === role ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent',
                                                isDisabled && 'opacity-30 cursor-not-allowed'
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="role"
                                                value={role}
                                                checked={formData.role === role}
                                                onChange={(e) => !isDisabled && setFormData({ ...formData, role: e.target.value as AdminRole })}
                                                disabled={isDisabled}
                                                className="sr-only"
                                            />
                                            <div className={cn("w-8 h-8 rounded-md flex items-center justify-center mr-3", config.bgColor, config.color)}>
                                                {config.icon}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-foreground">{config.label}</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">{config.description}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingUser(null);
                                    resetForm();
                                }}
                                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90 transition-all text-xs uppercase tracking-wider"
                            >
                                <Save className="w-3.5 h-3.5" />
                                <span>{editingUser ? 'Enregistrer' : 'Créer'}</span>
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
