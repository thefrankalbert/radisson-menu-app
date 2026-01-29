"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
    Loader2,
    Volume2,
    Music,
    Upload,
    Palette,
    Moon,
    Sun,
    Layout,
    Check
} from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import FormField from "@/components/admin/FormField";
import Modal from "@/components/admin/Modal";
import { toast } from "react-hot-toast";
import { updateEstablishmentSettingsAction } from "@/actions/admin-actions";
import LanguageSwitch from "@/components/admin/LanguageSwitch";
import { cn } from "@/lib/utils";
import { SettingsSkeleton } from "@/components/admin/Skeleton";
import { useLanguage } from "@/context/LanguageContext";

type AdminUser = { id: string; email: string; role: 'admin' | 'superadmin'; created_at: string; };
type EstablishmentSettings = { id?: string; name: string; logo_url: string | null; currency: string; timezone: string; };
type NotificationSettings = { newOrderSound: boolean; browserNotifs: boolean; emailSummary: boolean; selectedSoundUrl?: string; };
type Sound = { id: string; name: string; url: string; is_system: boolean; };

const SETTINGS_KEY = 'establishment_settings';
const DESIGN_KEY = 'design_settings';

const COLOR_OPTIONS = [
    { name: 'Radisson Blue', value: '#003058', class: 'bg-[#003058]' },
    { name: 'Gold Premium', value: '#C5A065', class: 'bg-[#C5A065]' },
    { name: 'Emerald', value: '#10B981', class: 'bg-[#10B981]' },
    { name: 'Royal Purple', value: '#8B5CF6', class: 'bg-[#8B5CF6]' },
    { name: 'Slate', value: '#475569', class: 'bg-[#475569]' },
    { name: 'Orange', value: '#F97316', class: 'bg-[#F97316]' },
];

export default function SettingsPage() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('establishment');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { theme, setTheme } = useTheme();
    const [establishment, setEstablishment] = useState<EstablishmentSettings>({
        name: "Radisson Blu Hotel, N'Djamena",
        logo_url: null, currency: "FCFA", timezone: "Africa/Ndjamena"
    });

    const [notifs, setNotifs] = useState<NotificationSettings>({
        newOrderSound: true, browserNotifs: true, emailSummary: false, selectedSoundUrl: '/sounds/notification.mp3'
    });

    const [design, setDesign] = useState({
        theme: 'light',
        primaryColor: '#003058'
    });

    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [showAddAdminModal, setShowAddAdminModal] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminRole, setNewAdminRole] = useState<'admin' | 'superadmin'>('admin');

    const [sounds, setSounds] = useState<Sound[]>([]);
    const [uploadingSound, setUploadingSound] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const loadData = useCallback(async () => {
        try {
            const [settingsRes, adminsRes, soundsRes, designRes] = await Promise.all([
                supabase.from('settings').select('*').eq('key', SETTINGS_KEY).single(),
                supabase.from('admin_users').select('*').order('created_at', { ascending: false }),
                supabase.from('notification_sounds').select('*').order('name'),
                supabase.from('settings').select('*').eq('key', DESIGN_KEY).single()
            ]);

            if (settingsRes.data?.value) {
                const parsed = settingsRes.data.value;
                setEstablishment({
                    id: settingsRes.data.id,
                    name: parsed.name || "Radisson Blu",
                    logo_url: parsed.logo_url || null,
                    currency: parsed.currency || "FCFA",
                    timezone: parsed.timezone || "Africa/Ndjamena"
                });
            }

            if (designRes.data?.value) {
                setDesign(designRes.data.value);
            } else {
                // Fallback to local storage or defaults
                const localDesign = localStorage.getItem('admin_design_settings');
                if (localDesign) setDesign(JSON.parse(localDesign));
            }

            const storedNotifs = localStorage.getItem('admin_notifications');
            if (storedNotifs) setNotifs(JSON.parse(storedNotifs));
            if (adminsRes.data) setAdmins(adminsRes.data);
            if (soundsRes.data) setSounds(soundsRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                updateEstablishmentSettingsAction({
                    name: establishment.name,
                    logo_url: establishment.logo_url,
                    currency: establishment.currency,
                    timezone: establishment.timezone
                }),
                supabase.from('settings').upsert({
                    key: DESIGN_KEY,
                    value: design
                })
            ]);

            localStorage.setItem('admin_notif_settings', JSON.stringify({
                enabled: notifs.newOrderSound,
                soundUrl: notifs.selectedSoundUrl
            }));
            localStorage.setItem('admin_design_settings', JSON.stringify(design));

            // Broadcast changes to AdminClientShell
            window.dispatchEvent(new Event('storage'));

            toast.success('Paramètres enregistrés');
        } catch (e: any) {
            toast.error(e.message || 'Erreur');
        } finally {
            setSaving(false);
        }
    };

    const playSound = (url: string) => {
        if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play().catch(e => console.error("Audio blocked", e));
        } else {
            audioRef.current = new Audio(url);
            audioRef.current.play().catch(e => console.error("Audio blocked", e));
        }
    };

    const handleSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.includes('audio')) { toast.error('Format audio requis'); return; }

        setUploadingSound(true);
        try {
            const filename = `${Date.now()}-${file.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(`sounds/${filename}`, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`sounds/${filename}`);
            const { error: dbError } = await supabase.from('notification_sounds').insert([{
                name: file.name.replace(/\.[^/.]+$/, ""),
                url: publicUrl,
                is_system: false
            }]);

            if (dbError) throw dbError;
            toast.success('Son ajouté avec succès');
            loadData();
        } catch (e: any) {
            toast.error(e.message || "Erreur lors de l'upload");
        } finally {
            setUploadingSound(false);
        }
    };

    const handleAddAdmin = async () => {
        if (!newAdminEmail.trim()) { toast.error('Email requis'); return; }
        try {
            const { error } = await supabase.from('admin_users').insert([{
                email: newAdminEmail.trim().toLowerCase(), role: newAdminRole
            }]);
            if (error) throw error;
            toast.success('Admin ajouté');
            setShowAddAdminModal(false);
            setNewAdminEmail('');
            loadData();
        } catch (e: any) { toast.error(e.message); }
    };

    const handleDeleteAdmin = async (admin: AdminUser) => {
        if (!confirm(`Supprimer ${admin.email} ?`)) return;
        try {
            const { error } = await supabase.from('admin_users').delete().eq('id', admin.id);
            if (error) throw error;
            toast.success('Supprimé');
            loadData();
        } catch (e) { toast.error('Erreur'); }
    };

    const tabs = [
        { id: 'establishment', label: t('establishment'), icon: Building },
        { id: 'design', label: t('theme_design'), icon: Palette },
        { id: 'admins', label: t('team'), icon: Shield },
        { id: 'notifs', label: t('notifications'), icon: Bell },
        { id: 'preferences', label: t('system'), icon: Globe },
    ];

    if (loading) return <SettingsSkeleton />;

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20 font-sans">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">{t('sys_settings')}</h1>
                    <p className="text-muted-foreground text-xs font-medium mt-1">Configuration centrale</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="h-10 px-6 bg-primary text-primary-foreground rounded-md font-semibold text-xs tracking-tight hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{t('save')}</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3 space-y-1">
                    {tabs.map(t_item => (
                        <button key={t_item.id} onClick={() => setActiveTab(t_item.id)} className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all font-semibold text-xs tracking-tight border",
                            activeTab === t_item.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-transparent hover:text-foreground hover:bg-accent"
                        )}>
                            <t_item.icon className="w-4 h-4" />
                            <span>{t_item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="lg:col-span-9 bg-card rounded-md border border-border p-6 md:p-8 min-h-[500px]">
                    {activeTab === 'design' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <Layout className="w-4 h-4" /> {t('display_mode')}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={cn(
                                            "p-6 rounded-md border flex flex-col items-center gap-3 transition-all",
                                            theme === 'light' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                                        )}
                                    >
                                        <Sun className={cn("w-5 h-5", theme === 'light' ? "text-amber-500" : "text-muted-foreground")} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('light_mode')}</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={cn(
                                            "p-6 rounded-md border flex flex-col items-center gap-3 transition-all",
                                            theme === 'dark' ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                                        )}
                                    >
                                        <Moon className={cn("w-5 h-5", theme === 'dark' ? "text-indigo-400" : "text-muted-foreground")} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{t('dark_mode')}</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-border">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <Palette className="w-4 h-4" /> {t('primary_color')}
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                    {COLOR_OPTIONS.map(color => (
                                        <button
                                            key={color.value}
                                            onClick={() => setDesign(p => ({ ...p, primaryColor: color.value }))}
                                            className={cn(
                                                "p-0.5 rounded-md transition-all relative group",
                                                design.primaryColor === color.value ? "ring-2 ring-primary ring-offset-2 ring-offset-background grayscale-0" : "grayscale-[0.5] hover:grayscale-0 hover:scale-105"
                                            )}
                                        >
                                            <div className={cn("aspect-square rounded-sm", color.class)} />
                                            {design.primaryColor === color.value && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifs' && (
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <Volume2 className="w-4 h-4" /> {t('sound_alerts')}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-md border border-border">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">{t('enable_sounds')}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">Activer les alertes sonores pour les nouvelles commandes</p>
                                        </div>
                                        <button
                                            onClick={() => setNotifs(prev => ({ ...prev, newOrderSound: !prev.newOrderSound }))}
                                            className={cn(
                                                "w-9 h-5 rounded-full p-1 transition-all duration-200",
                                                notifs.newOrderSound ? "bg-primary" : "bg-muted border border-border"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-3 h-3 bg-white rounded-full transition-all duration-200 border border-gray-200",
                                                notifs.newOrderSound ? "translate-x-4" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    {/* Sons pré-installés */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { id: 'standard', name: 'Standard (Modern)', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_7314a51e60.mp3' },
                                            { id: 'elegant', name: 'Elegant Hotel Chime', url: 'https://cdn.pixabay.com/audio/2022/10/30/audio_5a1762c2ee.mp3' },
                                            { id: 'success', name: 'Luxury Alert', url: '/sounds/success.mp3' }
                                        ].map(s => (
                                            <div key={s.id} className={cn(
                                                "p-3 rounded-md border transition-all flex items-center justify-between cursor-pointer",
                                                notifs.selectedSoundUrl === s.url ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                                            )} onClick={() => { setNotifs(p => ({ ...p, selectedSoundUrl: s.url })); playSound(s.url); }}>
                                                <div className="flex items-center gap-2">
                                                    <Music className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="text-[10px] font-bold uppercase tracking-tight">{s.name}</span>
                                                </div>
                                                <button onClick={(e) => { e.stopPropagation(); playSound(s.url); }} className="hover:text-primary transition-colors"><Volume2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                    </div>

                                    {sounds.map(s => (
                                        <div key={s.id} className={cn(
                                            "flex items-center justify-between p-3 rounded-md border transition-all cursor-pointer",
                                            notifs.selectedSoundUrl === s.url ? "border-primary bg-primary/5" : "border-border bg-card hover:border-muted-foreground/30"
                                        )} onClick={() => { setNotifs(prev => ({ ...prev, selectedSoundUrl: s.url })); playSound(s.url); }}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", notifs.selectedSoundUrl === s.url ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                                                    <Music className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-foreground">{s.name}</p>
                                                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">{s.is_system ? 'Système' : 'Personnalisé'}</p>
                                                </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); playSound(s.url); }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><Volume2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}

                                    <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-border rounded-md hover:border-muted-foreground/30 cursor-pointer transition-all group">
                                        <input type="file" className="hidden" accept="audio/*" onChange={handleSoundUpload} disabled={uploadingSound} />
                                        {uploadingSound ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : <Upload className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />}
                                        <div className="text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground">Charger une sonnerie</p>
                                            <p className="text-[9px] text-muted-foreground opacity-60 mt-0.5 uppercase">MP3 ou WAV</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-border">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" /> Notifications App
                                </h3>
                                <div className="space-y-2">
                                    {[
                                        { l: 'Alertes visuelles navigateur', k: 'browserNotifs' }
                                    ].map(it => (
                                        <div key={it.k} className="flex justify-between items-center p-4 bg-muted/10 rounded-md border border-border">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">{it.l}</p>
                                            <button onClick={() => setNotifs(prev => ({ ...prev, [it.k]: !(prev as any)[it.k] }))} className={cn(
                                                "w-9 h-5 rounded-full p-1 transition-all duration-200",
                                                (notifs as any)[it.k] ? "bg-primary" : "bg-muted border border-border"
                                            )}>
                                                <div className={cn("w-3 h-3 bg-white rounded-full transition-all duration-200 border border-gray-200", (notifs as any)[it.k] ? "translate-x-4" : "translate-x-0")} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'establishment' && (
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Identité Visuelle</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <FormField label="Nom Commercial" name="n" type="text" value={establishment.name} onChange={v => setEstablishment(p => ({ ...p, name: v }))} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField label="Devise" name="c" type="select" value={establishment.currency} onChange={v => setEstablishment(p => ({ ...p, currency: v }))} options={[{ value: 'FCFA', label: 'Franc CFA (FCFA)' }, { value: 'EUR', label: 'Euro (€)' }]} />
                                    <FormField label="Fuseau Horaire" name="t" type="select" value={establishment.timezone} onChange={v => setEstablishment(p => ({ ...p, timezone: v }))} options={[{ value: 'Africa/Ndjamena', label: 'Ndjamena (GMT+1)' }]} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admins' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Equipe de gestion</h3>
                                <button onClick={() => setShowAddAdminModal(true)} className="p-1.5 bg-muted text-foreground rounded-md hover:bg-accent transition-all border border-border"><Plus className="w-4 h-4" /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {admins.map(a => (
                                    <div key={a.id} className="p-3 bg-card rounded-md border border-border flex justify-between items-center group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded bg-muted flex items-center justify-center text-[9px] font-bold">{a.email.substring(0, 2).toUpperCase()}</div>
                                            <div>
                                                <p className="text-[10px] font-bold text-foreground truncate max-w-[120px]">{a.email}</p>
                                                <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">{a.role}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteAdmin(a)} className="text-muted-foreground hover:text-destructive transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Langues et Affichage</h3>
                            <div className="p-4 bg-muted/20 rounded-md border border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">Langue du Dashboard</p>
                                </div>
                                <LanguageSwitch />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={showAddAdminModal} onClose={() => setShowAddAdminModal(false)} title="Ajout Admin" size="sm">
                <div className="space-y-4">
                    <FormField label="Email" name="e" type="text" value={newAdminEmail} onChange={setNewAdminEmail} />
                    <FormField label="Rôle" name="r" type="select" value={newAdminRole} onChange={v => setNewAdminRole(v as any)} options={[{ value: 'admin', label: 'Admin' }, { value: 'superadmin', label: 'Super Admin' }]} />
                    <button onClick={handleAddAdmin} className="w-full py-3 bg-primary text-primary-foreground rounded-md text-[10px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all">Ajouter</button>
                </div>
            </Modal>
        </div>
    );
}
