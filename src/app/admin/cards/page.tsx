"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Plus,
    Loader2,
    QrCode,
    Download,
    Building,
    Image as ImageIcon,
    Trash2,
    ExternalLink,
    Settings,
    AlertTriangle,
    Folder,
    Utensils,
    ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import FormField from "@/components/admin/FormField";
import { Restaurant } from "@/types/admin";
import { toast } from "react-hot-toast";
import { ListPageSkeleton } from "@/components/admin/Skeleton";
import { cn } from "@/lib/utils";

const cardSchema = z.object({
    name: z.string().min(1, "Le nom est requis").max(100),
    name_en: z.string().max(100).optional().or(z.literal("")),
    slug: z.string().min(1, "Le slug est requis").regex(/^[a-z0-9-]+$/, "Slug invalide (lettres, chiffres, tirets uniquement)"),
    image_url: z.string().url().optional().or(z.literal("")),
    is_event: z.boolean(),
    is_active: z.boolean()
});

type CardFormData = z.infer<typeof cardSchema>;

const initialFormData: CardFormData = {
    name: '',
    name_en: '',
    slug: '',
    image_url: '',
    is_event: false,
    is_active: true
};

export default function CardsPage() {
    const router = useRouter();
    const [cards, setCards] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [editingCard, setEditingCard] = useState<Restaurant | null>(null);
    const [saving, setSaving] = useState(false);
    const [selectedCardForQR, setSelectedCardForQR] = useState<Restaurant | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<Restaurant | null>(null);
    const [deleting, setDeleting] = useState(false);

    const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CardFormData>({
        resolver: zodResolver(cardSchema),
        defaultValues: initialFormData
    });

    const cardName = watch('name');

    // Charger les cartes
    const loadCards = async () => {
        try {
            const { data, error } = await supabase
                .from('restaurants')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCards(data || []);
        } catch (error) {
            console.error('Erreur chargement cartes:', error);
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCards();
    }, []);

    // Générer le slug depuis le nom
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    // Auto-update slug when name changes for new cards
    useEffect(() => {
        if (!editingCard && cardName) {
            setValue('slug', generateSlug(cardName));
        }
    }, [cardName, editingCard, setValue]);

    // Ouvrir modal pour nouvelle carte
    const handleNewCard = () => {
        setEditingCard(null);
        reset(initialFormData);
        setShowModal(true);
    };

    // Ouvrir modal pour édition
    const handleEdit = (card: Restaurant) => {
        setEditingCard(card);
        reset({
            name: card.name || '',
            name_en: card.name_en || '',
            slug: card.slug || '',
            image_url: card.image_url || '',
            is_event: card.is_event || false,
            is_active: card.is_active !== false
        });
        setShowModal(true);
    };

    // Upload image
    const handleImageUpload = async (file: File) => {
        if (!file) return;
        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `card-${Date.now()}.${fileExt}`;
            const filePath = `cards/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            setValue('image_url', publicUrl);
            toast.success('Image uploadée');
        } catch (error) {
            toast.error('Erreur lors de l\'upload');
        } finally {
            setUploadingImage(false);
        }
    };

    // Sauvegarder carte
    const onFormSubmit = async (data: CardFormData) => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                name_en: data.name_en || null,
                image_url: data.image_url || null
            };

            if (editingCard) {
                const { error } = await supabase
                    .from('restaurants')
                    .update(payload)
                    .eq('id', editingCard.id);
                if (error) throw error;
                toast.success('Carte mise à jour');
            } else {
                const { error } = await supabase
                    .from('restaurants')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Carte créée');
            }

            setShowModal(false);
            loadCards();
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (card: Restaurant) => {
        setCardToDelete(card);
        setShowDeleteConfirm(true);
    };

    const executeDelete = async () => {
        if (!cardToDelete) return;
        setDeleting(true);
        try {
            const { count } = await supabase
                .from('categories')
                .select('id', { count: 'exact', head: true })
                .eq('restaurant_id', cardToDelete.id);

            if (count && count > 0) {
                toast.error(`Cette carte a ${count} catégorie(s) liée(s). Supprimez-les d'abord.`);
                setShowDeleteConfirm(false);
                return;
            }

            const { error } = await supabase
                .from('restaurants')
                .delete()
                .eq('id', cardToDelete.id);

            if (error) throw error;
            toast.success('Carte supprimée');
            loadCards();
        } catch (error) {
            toast.error('Erreur lors du suppression');
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleToggleActive = async (card: Restaurant) => {
        try {
            const { error } = await supabase
                .from('restaurants')
                .update({ is_active: !card.is_active })
                .eq('id', card.id);
            if (error) throw error;
            loadCards();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleGenerateQR = (card: Restaurant) => {
        setSelectedCardForQR(card);
        setShowQRModal(true);
    };

    const downloadQRCode = () => {
        if (!selectedCardForQR) return;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
            `${window.location.origin}/menu/${selectedCardForQR.slug}`
        )}`;

        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `qr-${selectedCardForQR.slug}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = [
        {
            key: 'image_url',
            label: 'Visuel',
            sortable: false,
            render: (value: string) => value ? (
                <img src={value} alt="" className="w-10 h-10 rounded-md object-cover border border-border" />
            ) : (
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border">
                    <Building className="w-4 h-4 text-muted-foreground/50" />
                </div>
            )
        },
        {
            key: 'name',
            label: 'Nom & URL',
            render: (value: string, row: Restaurant) => (
                <div>
                    <p className="font-bold text-foreground text-sm tracking-tight">{value}</p>
                    <div className="flex items-center text-[10px] text-muted-foreground font-medium mt-1">
                        <span className="bg-muted px-1.5 py-0.5 rounded border border-border mr-2 truncate max-w-[120px]">/menu/{row.slug}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'is_event',
            label: 'Type',
            render: (value: boolean) => (
                <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border",
                    value ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-blue-50 text-blue-600 border-blue-100"
                )}>
                    {value ? 'Événement' : 'Permanent'}
                </span>
            )
        },
        {
            key: 'is_active',
            label: 'Statut',
            render: (value: boolean, row: Restaurant) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleActive(row);
                    }}
                    className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                        value !== false ? "bg-primary/5 text-primary border-primary/10" : "bg-muted text-muted-foreground border-border"
                    )}
                >
                    {value !== false ? 'En ligne' : 'Invisible'}
                </button>
            )
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            render: (_: any, row: Restaurant) => (
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/categories?restaurant=${row.id}`);
                        }}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-all flex items-center gap-1"
                        title="Voir les catégories"
                    >
                        <Folder className="w-3.5 h-3.5" />
                        <ChevronRight className="w-3 h-3 opacity-50" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/items?restaurant=${row.id}`);
                        }}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all flex items-center gap-1"
                        title="Voir les plats"
                    >
                        <Utensils className="w-3.5 h-3.5" />
                        <ChevronRight className="w-3 h-3 opacity-50" />
                    </button>
                    <div className="w-px h-4 bg-border mx-1" />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
                        title="Paramètres de la carte"
                    >
                        <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateQR(row);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                        title="QR Code"
                    >
                        <QrCode className="w-3.5 h-3.5" />
                    </button>
                </div>
            )
        }
    ];

    if (loading) {
        return <ListPageSkeleton />;
    }

    return (
        <div className="space-y-6 font-sans">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight uppercase">Cartes & Menus</h1>
                    <p className="text-xs text-muted-foreground font-medium">Configurez vos différents points de vente.</p>
                </div>
                <button
                    onClick={handleNewCard}
                    className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold text-xs hover:opacity-90 active:scale-95 transition-all outline outline-1 outline-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nouvelle Carte</span>
                </button>
            </div>

            {cards.length > 0 ? (
                <div className="bg-card rounded-md border border-border overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={cards}
                        onEdit={(card) => router.push(`/admin/items?restaurant=${card.id}`)}
                        onDelete={confirmDelete}
                    />
                </div>
            ) : (
                <div className="bg-card rounded-md border border-border p-16 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Aucune carte active</h3>
                    <p className="text-muted-foreground mt-1 text-sm font-medium">Créez votre première carte pour commencer à ajouter des catégories et des plats.</p>
                    <button
                        onClick={handleNewCard}
                        className="mt-6 bg-primary text-primary-foreground px-8 py-2 rounded-md font-bold text-xs hover:opacity-90 transition-all"
                    >
                        Créer ma première carte
                    </button>
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCard ? 'Modifier la carte' : 'Nouvelle carte'}
                size="md"
            >
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label="Nom (FR)"
                                    type="text"
                                    placeholder="Ex: Restaurant Le Nile"
                                    required
                                    error={errors.name?.message}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="name_en"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label="Nom (EN)"
                                    type="text"
                                    placeholder="Ex: The Nile Restaurant"
                                    error={errors.name_en?.message}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    <Controller
                        name="slug"
                        control={control}
                        render={({ field }) => (
                            <FormField
                                label="Identifiant URL (Slug)"
                                type="text"
                                placeholder="restaurant-le-nile"
                                required
                                error={errors.slug?.message}
                                {...field}
                                onChange={(v) => field.onChange(generateSlug(v))}
                            />
                        )}
                    />

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Logo / Icône de la carte</label>
                        <div className="flex items-start gap-4">
                            {watch('image_url') ? (
                                <div className="relative group">
                                    <img src={watch('image_url')} alt="" className="w-20 h-20 rounded-md object-cover border border-border transition-all group-hover:opacity-75" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => setValue('image_url', '')}
                                            className="bg-destructive text-destructive-foreground p-1 rounded-full border border-destructive-foreground/20"
                                        >
                                            <Trash2 className="w-3 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-md bg-muted border border-border flex flex-col items-center justify-center group hover:bg-muted/40 transition-all">
                                    <Building className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                    className="hidden"
                                    id="card-image-upload"
                                />
                                <label
                                    htmlFor="card-image-upload"
                                    className="inline-flex items-center px-4 py-2 bg-muted text-foreground rounded-md font-bold text-[10px] uppercase tracking-wider cursor-pointer hover:bg-accent transition-all border border-border shadow-sm"
                                >
                                    {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <ImageIcon className="w-3.5 h-3.5 mr-2 opacity-50" />}
                                    {uploadingImage ? 'Upload...' : 'Choisir une image'}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-muted/30 p-4 rounded-md border border-border">
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Type de carte</label>
                            <Controller
                                name="is_event"
                                control={control}
                                render={({ field }) => (
                                    <FormField
                                        label=""
                                        type="select"
                                        options={[
                                            { value: 'false', label: 'Permanent' },
                                            { value: 'true', label: 'Événement' }
                                        ]}
                                        value={field.value.toString()}
                                        onChange={(v) => field.onChange(v === 'true')}
                                        name={field.name}
                                    />
                                )}
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Statut initial</label>
                            <div className="flex items-center gap-3 pt-1">
                                <Controller
                                    name="is_active"
                                    control={control}
                                    render={({ field }) => (
                                        <FormField
                                            label=""
                                            type="toggle"
                                            {...field}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Actif / Public</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-8 py-2 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-all text-[10px] uppercase tracking-wider disabled:opacity-50 shadow-md"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (editingCard ? 'Mettre à jour' : 'Créer la carte')}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                title="Génération du QR Code"
                size="sm"
            >
                {selectedCardForQR && (
                    <div className="text-center space-y-8 py-4">
                        <div className="bg-white p-8 rounded-md border border-border inline-block shadow-sm">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
                                    `${window.location.origin}/menu/${selectedCardForQR.slug}`
                                )}`}
                                alt="QR Code"
                                className="w-48 h-48"
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="font-bold text-foreground uppercase text-xs tracking-widest">{selectedCardForQR.name}</p>
                            <div className="inline-flex items-center px-3 py-1 bg-muted rounded-md border border-border text-[10px] text-muted-foreground font-mono">
                                /menu/{selectedCardForQR.slug}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 px-4">
                            <button
                                onClick={downloadQRCode}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-md text-[10px] tracking-widest uppercase hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Télécharger le QR Code
                            </button>
                            <button
                                onClick={() => window.open(`${window.location.origin}/menu/${selectedCardForQR.slug}`, '_blank')}
                                className="w-full py-3 bg-muted text-foreground font-bold rounded-md text-[10px] tracking-widest uppercase hover:bg-accent transition-all border border-border flex items-center justify-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Ouvrir le lien
                            </button>
                        </div>

                        <p className="text-[9px] text-muted-foreground uppercase font-semibold tracking-wider opacity-60">
                            Prêt pour l'impression (Format PNG HD)
                        </p>
                    </div>
                )}
            </Modal>

            {/* Modal de suppression */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => !deleting && setShowDeleteConfirm(false)}
                title="Confirmation de suppression"
                size="sm"
            >
                <div className="space-y-6 pt-2">
                    <div className="flex items-center gap-4 p-4 bg-destructive/5 border border-destructive/10 rounded-md">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                        </div>
                        <p className="text-xs font-medium text-foreground leading-relaxed">
                            Êtes-vous sûr de vouloir supprimer la carte <span className="font-bold underline">"{cardToDelete?.name}"</span> ?
                            Cette action est irréversible et supprimera également les accès QR liés.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            disabled={deleting}
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-2.5 bg-muted text-muted-foreground rounded-md text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            disabled={deleting}
                            onClick={executeDelete}
                            className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-md text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Supprimer"}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
