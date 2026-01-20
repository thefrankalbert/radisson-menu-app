"use client";

import { useEffect, useState } from "react";
import {
    Users,
    Plus,
    Shield,
    ShieldCheck,
    User,
    Trash2,
    Edit,
    X,
    Save,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ChefHat,
    CreditCard,
    Coffee,
    AlertTriangle,
    Crown,
    Search,
    UserCheck,
    UserX
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { AdminUser, AdminRole, ROLE_DESCRIPTIONS } from "@/types/admin";

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
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<AdminRole | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterRole, setFilterRole] = useState<AdminRole | "all">("all");

    // Form state
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        full_name: "",
        role: "serveur" as AdminRole
    });

    // Stats
    const superadminCount = users.filter(u => u.role === 'superadmin').length;
    const activeUsers = users.filter(u => u.is_active).length;

    // Load users
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
    const canCreateSuperAdmin = currentUserRole === 'superadmin' && superadminCount < MAX_SUPERADMINS;

    const handleCreateUser = async () => {
        if (!canManageUsers) {
            toast.error('Vous n\'avez pas les droits pour créer des utilisateurs');
            return;
        }

        // Check superadmin limit
        if (formData.role === 'superadmin' && superadminCount >= MAX_SUPERADMINS) {
            toast.error(`Maximum ${MAX_SUPERADMINS} Super Admins autorisés`);
            return;
        }

        // Only superadmins can create superadmins
        if (formData.role === 'superadmin' && currentUserRole !== 'superadmin') {
            toast.error('Seuls les Super Admins peuvent créer d\'autres Super Admins');
            return;
        }

        if (!formData.email || !formData.password) {
            toast.error('Email et mot de passe requis');
            return;
        }

        try {
            // 1. Créer l'utilisateur dans Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: formData.email,
                password: formData.password,
                email_confirm: true
            });

            if (authError) {
                // Si l'admin API n'est pas disponible, utiliser signUp
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password
                });

                if (signUpError) throw signUpError;

                // 2. Créer l'entrée dans admin_users
                const { error: insertError } = await supabase
                    .from('admin_users')
                    .insert({
                        email: formData.email,
                        full_name: formData.full_name,
                        role: formData.role,
                        user_id: signUpData.user?.id
                    });

                if (insertError) throw insertError;
            } else {
                // 2. Créer l'entrée dans admin_users
                const { error: insertError } = await supabase
                    .from('admin_users')
                    .insert({
                        email: formData.email,
                        full_name: formData.full_name,
                        role: formData.role,
                        user_id: authData.user?.id
                    });

                if (insertError) throw insertError;
            }

            toast.success('Utilisateur créé avec succès');
            setShowModal(false);
            resetForm();
            loadUsers();
        } catch (error: any) {
            console.error('Erreur création utilisateur:', error);
            toast.error(error.message || 'Erreur lors de la création');
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;

        // Check superadmin limit when upgrading
        if (formData.role === 'superadmin' && editingUser.role !== 'superadmin' && superadminCount >= MAX_SUPERADMINS) {
            toast.error(`Maximum ${MAX_SUPERADMINS} Super Admins autorisés`);
            return;
        }

        // Only superadmins can upgrade to superadmin
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

        // Can't deactivate the last superadmin
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

        // Can't delete superadmin if we're not superadmin
        if (user.role === 'superadmin' && currentUserRole !== 'superadmin') {
            toast.error('Seuls les Super Admins peuvent supprimer d\'autres Super Admins');
            return;
        }

        // Can't delete the last superadmin
        if (user.role === 'superadmin' && superadminCount <= 1) {
            toast.error('Impossible de supprimer le dernier Super Admin');
            return;
        }

        if (!confirm(`Supprimer l'utilisateur ${user.email} ?`)) return;

        try {
            const { error } = await supabase
                .from('admin_users')
                .delete()
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Utilisateur supprimé');
            loadUsers();
        } catch (error: any) {
            console.error('Erreur suppression:', error);
            toast.error(error.message || 'Erreur lors de la suppression');
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

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === "all" || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <Users className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600 font-medium">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Gestion du Personnel
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {users.length} membre{users.length > 1 ? 's' : ''} • {activeUsers} actif{activeUsers > 1 ? 's' : ''}
                    </p>
                </div>

                {canManageUsers && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nouvel utilisateur</span>
                    </button>
                )}
            </div>

            {/* SuperAdmin Warning */}
            {superadminCount >= MAX_SUPERADMINS && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-800">Limite Super Admins atteinte</p>
                        <p className="text-sm text-amber-700">
                            Vous avez atteint le maximum de {MAX_SUPERADMINS} Super Admins. Pour en créer un nouveau, désactivez ou supprimez un Super Admin existant.
                        </p>
                    </div>
                </div>
            )}

            {/* Role Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(Object.keys(ROLE_CONFIG) as AdminRole[]).map((role) => {
                    const config = ROLE_CONFIG[role];
                    const count = users.filter(u => u.role === role).length;

                    return (
                        <button
                            key={role}
                            onClick={() => setFilterRole(filterRole === role ? "all" : role)}
                            className={`p-4 rounded-xl border transition-all ${
                                filterRole === role
                                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                                    : 'border-gray-100 bg-white hover:border-gray-200'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl ${config.bgColor} ${config.color} flex items-center justify-center mb-2`}>
                                {config.icon}
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{count}</p>
                            <p className="text-xs text-gray-500 truncate">{config.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom ou email..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
            </div>

            {/* Users List */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {filteredUsers.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {filteredUsers.map((user) => {
                            const roleConfig = ROLE_CONFIG[user.role];

                            return (
                                <div
                                    key={user.id}
                                    className={`p-4 hover:bg-gray-50/50 transition-colors ${!user.is_active ? 'opacity-60' : ''}`}
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
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                                            Inactif
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
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            user.is_active
                                                                ? 'text-emerald-600 hover:bg-emerald-50'
                                                                : 'text-gray-400 hover:bg-gray-100'
                                                        }`}
                                                        title={user.is_active ? 'Désactiver' : 'Activer'}
                                                    >
                                                        {user.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
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
                                        <p className="text-xs text-gray-400 mt-2 ml-16">
                                            Dernière connexion: {new Date(user.last_login).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
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
                        <p className="text-gray-400">
                            {searchQuery || filterRole !== "all"
                                ? "Modifiez vos filtres pour voir plus de résultats"
                                : "Créez votre premier utilisateur administrateur"}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-up">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {editingUser ? 'Modifiez les informations ci-dessous' : 'Remplissez les informations du nouvel utilisateur'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingUser(null);
                                    resetForm();
                                }}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-5">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={!!editingUser}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-all"
                                        placeholder="email@exemple.com"
                                    />
                                </div>
                            </div>

                            {/* Password (only for new users) */}
                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mot de passe
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nom complet
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Jean Dupont"
                                    />
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Rôle
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {(Object.keys(ROLE_CONFIG) as AdminRole[]).map((role) => {
                                        const config = ROLE_CONFIG[role];
                                        const isDisabled = role === 'superadmin' &&
                                            (currentUserRole !== 'superadmin' ||
                                            (superadminCount >= MAX_SUPERADMINS && editingUser?.role !== 'superadmin'));

                                        return (
                                            <label
                                                key={role}
                                                className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                                                    formData.role === role
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : isDisabled
                                                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
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
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgColor} ${config.color} mr-3`}>
                                                    {config.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900">{config.label}</p>
                                                    <p className="text-xs text-gray-500">{config.description}</p>
                                                </div>
                                                {formData.role === role && (
                                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingUser(null);
                                    resetForm();
                                }}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                <Save className="w-4 h-4" />
                                <span>{editingUser ? 'Enregistrer' : 'Créer'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Animation */}
            <style jsx>{`
                @keyframes scale-up {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-scale-up {
                    animation: scale-up 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}
