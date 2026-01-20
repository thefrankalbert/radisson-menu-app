"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Building,
    Shield,
    Bell,
    Globe,
    Smartphone,
    Save,
    Plus,
    Trash2,
    Mail,
    Camera,
    Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import FormField from "@/components/admin/FormField";
import Modal from "@/components/admin/Modal";
import { toast } from "react-hot-toast";

type AdminUser = {
    id: string;
    email: string;
    role: 'admin' | 'superadmin';
    created_at: string;
};

type EstablishmentSettings = {
    id?: string;
    name: string;
    logo_url: string | null;
    currency: string;
    timezone: string;
};

type NotificationSettings = {
    newOrderSound: boolean;
    browserNotifs: boolean;
    emailSummary: boolean;
};

const SETTINGS_KEY = 'establishment_settings';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('establishment');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const [establishment, setEstablishment] = useState<EstablishmentSettings>({
        name: "Radisson Blu Hotel, N'Djamena",
        logo_url: null,
        currency: "FCFA",
        timezone: "Africa/Ndjamena"
    });

    const [notifs, setNotifs] = useState<NotificationSettings>({
        newOrderSound: true,
        browserNotifs: true,
        emailSummary: false
    });

    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superadmin'>('admin');

    // Load settings from Supabase
    const loadSettings = useCallback(async () => {
        try {
            // Load establishment settings
            const { data: settingsData } = await supabase
                .from('settings')
                .select('*')
                .eq('key', SETTINGS_KEY)
                .single();

            if (settingsData?.value) {
                const parsed = typeof settingsData.value === 'string'
                    ? JSON.parse(settingsData.value)
                    : settingsData.value;
                setEstablishment({
                    id: settingsData.id,
                    name: parsed.name || "Radisson Blu Hotel, N'Djamena",
                    logo_url: parsed.logo_url || null,
                    currency: parsed.currency || "FCFA",
                    timezone: parsed.timezone || "Africa/Ndjamena"
                });
            }

            // Load notification preferences from localStorage
            const storedNotifs = localStorage.getItem('admin_notifications');
            if (storedNotifs) {
                setNotifs(JSON.parse(storedNotifs));
            }

            // Load admin users
            const { data: adminsData } = await supabase
                .from('admin_users')
                .select('*')
                .order('created_at', { ascending: false });

            if (adminsData) {
                setAdmins(adminsData);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Handle logo upload
    const handleLogoUpload = async (file: File) => {
        if (!file) return;
        setUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `hotel-logo-${Date.now()}.${fileExt}`;
            const filePath = `settings/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            setEstablishment(prev => ({ ...prev, logo_url: publicUrl }));
            toast.success('Logo uploadé');
        } catch (error) {
            toast.error("Erreur lors de l'upload du logo");
        } finally {
            setUploadingLogo(false);
        }
    };

    // Save all settings
    const handleSave = async () => {
        setSaving(true);
        try {
            // Save establishment settings to Supabase
            const settingsValue = {
                name: establishment.name,
                logo_url: establishment.logo_url,
                currency: establishment.currency,
                timezone: establishment.timezone
            };

            const { error } = await supabase
                .from('settings')
                .upsert({
                    key: SETTINGS_KEY,
                    value: settingsValue,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'key'
                });

            if (error) throw error;

            // Save notification preferences to localStorage
            localStorage.setItem('admin_notifications', JSON.stringify(notifs));

            toast.success('Paramètres enregistrés');
        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast.error(error.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    // Add new admin
    const handleAddAdmin = async () => {
        if (!newAdminEmail.trim()) {
            toast.error('Email requis');
            return;
        }

        try {
            const { error } = await supabase
                .from('admin_users')
                .insert([{
                    email: newAdminEmail.trim().toLowerCase(),
                    role: newAdminRole,
                    created_at: new Date().toISOString()
                }]);

            if (error) throw error;

            toast.success('Administrateur ajouté');
            setShowAddAdminModal(false);
            setNewAdminEmail('');
            setNewAdminRole('admin');
            loadSettings();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'ajout");
        }
    };

    // Delete admin
    const handleDeleteAdmin = async (admin: AdminUser) => {
        if (!confirm(`Supprimer l'accès de ${admin.email} ?`)) return;

        try {
            const { error } = await supabase
                .from('admin_users')
                .delete()
                .eq('id', admin.id);

            if (error) throw error;

            toast.success('Accès supprimé');
            loadSettings();
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const tabs = [
        { id: 'establishment', label: 'Établissement', icon: Building },
        { id: 'admins', label: 'Administrateurs', icon: Shield },
        { id: 'notifs', label: 'Notifications', icon: Bell },
        { id: 'preferences', label: 'Préférences', icon: Globe },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-[#C5A065] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#003058] tracking-tight">Paramètres</h1>
                    <p className="text-slate-400 mt-2 font-medium">Gérez la configuration globale de votre plateforme.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-[#003058] text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 hover:scale-105 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Tabs Sidebar */}
                <div className="lg:col-span-4 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all ${activeTab === tab.id
                                    ? 'bg-[#003058] text-white shadow-xl shadow-blue-900/20 translate-x-1'
                                    : 'text-slate-400 hover:bg-white hover:text-[#003058] hover:shadow-sm'
                                }`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#C5A065]' : ''}`} />
                            <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-10 border border-[#F5F5F5] shadow-sm">
                    {activeTab === 'establishment' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-xl font-black text-[#003058]">Profil Établissement</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Identité visuelle et informations</p>
                            </div>

                            <div className="flex flex-col items-center space-y-4 pb-8 border-b border-[#F5F5F5]">
                                <div className="relative group">
                                    <div className="w-32 h-32 bg-[#F5F5F5] rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden">
                                        {establishment.logo_url ? (
                                            <img src={establishment.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="w-8 h-8 text-slate-300 group-hover:scale-110 transition-transform" />
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 bg-[#C5A065] text-white p-3 rounded-2xl shadow-lg hover:scale-110 transition-transform cursor-pointer">
                                        {uploadingLogo ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Logo de l&apos;hôtel</p>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <FormField
                                    label="Nom de l'établissement"
                                    name="hotel-name"
                                    type="text"
                                    value={establishment.name}
                                    onChange={(v) => setEstablishment(prev => ({ ...prev, name: v }))}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        label="Devise Principale"
                                        name="currency"
                                        type="select"
                                        value={establishment.currency}
                                        onChange={(v) => setEstablishment(prev => ({ ...prev, currency: v }))}
                                        options={[
                                            { value: 'FCFA', label: 'Franc CFA (FCFA)' },
                                            { value: 'EUR', label: 'Euro (€)' },
                                            { value: 'USD', label: 'US Dollar ($)' }
                                        ]}
                                    />
                                    <FormField
                                        label="Fuseau Horaire"
                                        name="timezone"
                                        type="select"
                                        value={establishment.timezone}
                                        onChange={(v) => setEstablishment(prev => ({ ...prev, timezone: v }))}
                                        options={[
                                            { value: 'Africa/Ndjamena', label: 'Ndjamena (GMT+1)' },
                                            { value: 'Europe/Paris', label: 'Paris (GMT+1)' }
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admins' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-[#003058]">Accès Administrateurs</h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gérez les membres de votre équipe</p>
                                </div>
                                <button
                                    onClick={() => setShowAddAdminModal(true)}
                                    className="bg-[#F5F5F5] text-[#003058] p-3 rounded-2xl hover:bg-slate-200 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {admins.length > 0 ? (
                                    admins.map((admin) => (
                                        <div key={admin.id} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-[#F5F5F5] group">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                    <Shield className={`w-5 h-5 ${admin.role === 'superadmin' ? 'text-[#C5A065]' : 'text-[#003058]'}`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#003058]">{admin.email}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{admin.role}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteAdmin(admin)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        <Shield className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                                        <p className="font-medium">Aucun administrateur configuré</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100/50 flex items-start space-x-4">
                                <Shield className="w-6 h-6 text-[#C5A065] flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-xs font-black text-[#003058] uppercase tracking-wider mb-1">Sécurité</p>
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                        Seuls les Super-Admins peuvent ajouter ou supprimer d&apos;autres administrateurs.
                                        Les changements prennent effet immédiatement.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifs' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-xl font-black text-[#003058]">Préférences de Notification</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Alertes et sons du dashboard</p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <Bell className="w-5 h-5 text-[#003058]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#003058]">Son nouvelle commande</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Alerte sonore en direct</p>
                                        </div>
                                    </div>
                                    <FormField
                                        label="" name="n1" type="toggle"
                                        value={notifs.newOrderSound}
                                        onChange={(v) => setNotifs(prev => ({ ...prev, newOrderSound: v }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <Smartphone className="w-5 h-5 text-[#3B82F6]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#003058]">Notifications Navigateur</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Push si l&apos;onglet est masqué</p>
                                        </div>
                                    </div>
                                    <FormField
                                        label="" name="n2" type="toggle"
                                        value={notifs.browserNotifs}
                                        onChange={(v) => setNotifs(prev => ({ ...prev, browserNotifs: v }))}
                                    />
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                            <Mail className="w-5 h-5 text-[#22C55E]" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#003058]">Rapport Quotidien</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Résumé des ventes par email</p>
                                        </div>
                                    </div>
                                    <FormField
                                        label="" name="n3" type="toggle"
                                        value={notifs.emailSummary}
                                        onChange={(v) => setNotifs(prev => ({ ...prev, emailSummary: v }))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div>
                                <h3 className="text-xl font-black text-[#003058]">Préférences Générales</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Configuration avancée</p>
                            </div>

                            <div className="p-8 bg-slate-50/50 rounded-3xl text-center">
                                <Globe className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium">
                                    Fonctionnalités supplémentaires à venir
                                </p>
                                <p className="text-xs text-slate-300 mt-2">
                                    Langue, thème, intégrations tierces...
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Admin Modal */}
            <Modal
                isOpen={showAddAdminModal}
                onClose={() => setShowAddAdminModal(false)}
                title="Ajouter un administrateur"
                size="sm"
            >
                <div className="space-y-6">
                    <FormField
                        label="Adresse email"
                        name="admin-email"
                        type="text"
                        value={newAdminEmail}
                        onChange={setNewAdminEmail}
                        placeholder="email@exemple.com"
                        required
                    />
                    <FormField
                        label="Rôle"
                        name="admin-role"
                        type="select"
                        value={newAdminRole}
                        onChange={(v) => setNewAdminRole(v as 'admin' | 'superadmin')}
                        options={[
                            { value: 'admin', label: 'Administrateur' },
                            { value: 'superadmin', label: 'Super Administrateur' }
                        ]}
                    />

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={() => setShowAddAdminModal(false)}
                            className="flex-1 h-12 bg-[#F5F5F5] text-[#003058] font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleAddAdmin}
                            className="flex-1 h-12 bg-[#003058] text-white font-bold rounded-xl hover:bg-[#004a80] transition-colors"
                        >
                            Ajouter
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
