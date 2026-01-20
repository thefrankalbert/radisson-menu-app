"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Loader2,
    QrCode,
    Download,
    Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import FormField from "@/components/admin/FormField";
import { Restaurant } from "@/types/admin";
import { toast } from "react-hot-toast";

type CardFormData = {
    name: string;
    name_en: string;
    slug: string;
    image_url: string;
    is_event: boolean;
    is_active: boolean;
};

const initialFormData: CardFormData = {
    name: '',
    name_en: '',
    slug: '',
    image_url: '',
    is_event: false,
    is_active: true
};

export default function CardsPage() {
    const [cards, setCards] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);
    const [editingCard, setEditingCard] = useState<Restaurant | null>(null);
    const [formData, setFormData] = useState<CardFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [selectedCardForQR, setSelectedCardForQR] = useState<Restaurant | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

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

    // Ouvrir modal pour nouvelle carte
    const handleNewCard = () => {
        setEditingCard(null);
        setFormData(initialFormData);
        setShowModal(true);
    };

    // Ouvrir modal pour édition
    const handleEdit = (card: Restaurant) => {
        setEditingCard(card);
        setFormData({
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

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
            toast.success('Image uploadée');
        } catch (error) {
            console.error('Erreur upload:', error);
            toast.error('Erreur lors de l\'upload');
        } finally {
            setUploadingImage(false);
        }
    };

    // Sauvegarder carte
    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Le nom est requis');
            return;
        }

        setSaving(true);
        try {
            const cardData = {
                name: formData.name,
                name_en: formData.name_en || null,
                slug: formData.slug || generateSlug(formData.name),
                image_url: formData.image_url || null,
                is_event: formData.is_event,
                is_active: formData.is_active
            };

            if (editingCard) {
                const { error } = await supabase
                    .from('restaurants')
                    .update(cardData)
                    .eq('id', editingCard.id);

                if (error) throw error;
                toast.success('Carte mise à jour');
            } else {
                const { error } = await supabase
                    .from('restaurants')
                    .insert([cardData]);

                if (error) throw error;
                toast.success('Carte créée');
            }

            setShowModal(false);
            loadCards();
        } catch (error: any) {
            console.error('Erreur sauvegarde:', error);
            toast.error(error.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    // Supprimer carte
    const handleDelete = async (card: Restaurant) => {
        if (!confirm(`Supprimer la carte "${card.name}" ?`)) return;

        try {
            const { count } = await supabase
                .from('categories')
                .select('id', { count: 'exact', head: true })
                .eq('restaurant_id', card.id);

            if (count && count > 0) {
                toast.error(`Cette carte a ${count} catégorie(s) liée(s). Supprimez-les d'abord.`);
                return;
            }

            const { error } = await supabase
                .from('restaurants')
                .delete()
                .eq('id', card.id);

            if (error) throw error;
            toast.success('Carte supprimée');
            loadCards();
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    // Toggle actif/inactif
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

    // Générer QR Code
    const handleGenerateQR = (card: Restaurant) => {
        setSelectedCardForQR(card);
        setShowQRModal(true);
    };

    // Télécharger QR Code
    const downloadQRCode = () => {
        if (!selectedCardForQR) return;

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
            `${window.location.origin}/menu/${selectedCardForQR.slug}`
        )}`;

        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `qr-${selectedCardForQR.slug}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Colonnes du tableau
    const columns = [
        {
            key: 'image_url',
            label: 'Image',
            sortable: false,
            render: (value: string) => value ? (
                <img src={value} alt="" className="w-12 h-12 rounded-xl object-cover" />
            ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-slate-300" />
                </div>
            )
        },
        {
            key: 'name',
            label: 'Nom',
            render: (value: string, row: Restaurant) => (
                <div>
                    <p className="font-bold text-[#003058]">{value}</p>
                    <p className="text-xs text-slate-400">/{row.slug}</p>
                </div>
            )
        },
        {
            key: 'is_event',
            label: 'Type',
            render: (value: boolean) => (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    value ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                }`}>
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
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${
                        value !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    {value !== false ? 'Actif' : 'Inactif'}
                </button>
            )
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            render: (_: any, row: Restaurant) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateQR(row);
                    }}
                    className="p-2 text-slate-400 hover:text-[#003058] hover:bg-[#F5F5F5] rounded-lg transition-all"
                    title="Générer QR Code"
                >
                    <QrCode className="w-4 h-4" />
                </button>
            )
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-12 h-12 text-[#C5A065] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-[#003058] tracking-tight">Gestion des Cartes & Menus</h1>
                <button
                    onClick={handleNewCard}
                    className="flex items-center space-x-2 bg-[#003058] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 hover:scale-105 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nouvelle Carte</span>
                </button>
            </div>

            {cards.length > 0 ? (
                <DataTable
                    columns={columns}
                    data={cards}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-[#F5F5F5] p-12 text-center">
                    <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">📇</span>
                    </div>
                    <h3 className="text-xl font-black text-[#003058]">Aucune carte active</h3>
                    <p className="text-slate-400 mt-2 font-medium">Commencez par créer une carte pour vos restaurants ou événements.</p>
                    <button
                        onClick={handleNewCard}
                        className="mt-6 bg-[#C5A065] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#b08e5a] transition-colors"
                    >
                        Créer ma première carte
                    </button>
                </div>
            )}

            {/* Modal Ajout/Édition */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCard ? 'Modifier la carte' : 'Nouvelle carte'}
                size="md"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label="Nom (FR)"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={(v) => {
                                setFormData(prev => ({
                                    ...prev,
                                    name: v,
                                    slug: prev.slug || generateSlug(v)
                                }));
                            }}
                            required
                            placeholder="Ex: Restaurant Le Nile"
                        />
                        <FormField
                            label="Nom (EN)"
                            name="name_en"
                            type="text"
                            value={formData.name_en}
                            onChange={(v) => setFormData(prev => ({ ...prev, name_en: v }))}
                            placeholder="Ex: The Nile Restaurant"
                        />
                    </div>

                    <FormField
                        label="Slug (URL)"
                        name="slug"
                        type="text"
                        value={formData.slug}
                        onChange={(v) => setFormData(prev => ({ ...prev, slug: generateSlug(v) }))}
                        placeholder="restaurant-le-nile"
                    />

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                            Image
                        </label>
                        <div className="flex items-start space-x-4">
                            {formData.image_url ? (
                                <img
                                    src={formData.image_url}
                                    alt=""
                                    className="w-24 h-24 rounded-2xl object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-[#F5F5F5] flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-slate-300" />
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
                                    className="inline-flex items-center px-4 py-2 bg-[#F5F5F5] text-[#003058] rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-200 transition-colors"
                                >
                                    {uploadingImage ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    {uploadingImage ? 'Upload...' : 'Choisir une image'}
                                </label>
                                <p className="text-xs text-slate-400 mt-2">JPG, PNG. Max 2MB</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Type"
                            name="is_event"
                            type="select"
                            value={formData.is_event ? 'event' : 'permanent'}
                            onChange={(v) => setFormData(prev => ({ ...prev, is_event: v === 'event' }))}
                            options={[
                                { value: 'permanent', label: 'Permanent' },
                                { value: 'event', label: 'Événement' }
                            ]}
                        />
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                                Statut
                            </label>
                            <FormField
                                label=""
                                name="is_active"
                                type="toggle"
                                value={formData.is_active}
                                onChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                            />
                            <span className="text-sm text-slate-500 ml-4">
                                {formData.is_active ? 'Actif' : 'Inactif'}
                            </span>
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={() => setShowModal(false)}
                            className="flex-1 h-12 bg-[#F5F5F5] text-[#003058] font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 h-12 bg-[#003058] text-white font-bold rounded-xl hover:bg-[#004a80] transition-colors disabled:opacity-50 flex items-center justify-center"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingCard ? 'Mettre à jour' : 'Créer')}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal QR Code */}
            <Modal
                isOpen={showQRModal}
                onClose={() => setShowQRModal(false)}
                title="QR Code"
                size="sm"
            >
                {selectedCardForQR && (
                    <div className="text-center space-y-6">
                        <div className="bg-white p-4 rounded-2xl inline-block shadow-lg">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                    `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${selectedCardForQR.slug}`
                                )}`}
                                alt="QR Code"
                                className="w-48 h-48"
                            />
                        </div>

                        <div>
                            <p className="font-bold text-[#003058]">{selectedCardForQR.name}</p>
                            <p className="text-xs text-slate-400 mt-1">
                                /menu/{selectedCardForQR.slug}
                            </p>
                        </div>

                        <button
                            onClick={downloadQRCode}
                            className="w-full h-12 bg-[#C5A065] text-white font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-[#b08e5a] transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            <span>Télécharger PNG</span>
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
}
