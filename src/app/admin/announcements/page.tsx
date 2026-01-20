"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Loader2,
    Trash2,
    Edit2,
    Image as ImageIcon,
    Megaphone,
    Calendar,
    Check,
    X as CloseX
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import FormField from "@/components/admin/FormField";
import { toast } from "react-hot-toast";

type Announcement = {
    id: string;
    title: string;
    description: string;
    image_url: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
    created_at: string;
};

type AnnouncementFormData = {
    title: string;
    description: string;
    image_url: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
};

const initialFormData: AnnouncementFormData = {
    title: '',
    description: '',
    image_url: '',
    is_active: true,
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
};

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState<AnnouncementFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const loadAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Erreur chargement annonces:', error);
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const handleNew = () => {
        setEditingItem(null);
        setFormData(initialFormData);
        setShowModal(true);
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingItem(announcement);
        setFormData({
            title: announcement.title || '',
            description: announcement.description || '',
            image_url: announcement.image_url || '',
            is_active: announcement.is_active !== false,
            start_date: announcement.start_date ? announcement.start_date.split('T')[0] : '',
            end_date: announcement.end_date ? announcement.end_date.split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleImageUpload = async (file: File) => {
        if (!file) return;
        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `announcement-${Date.now()}.${fileExt}`;
            const filePath = `announcements/${fileName}`;

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
            toast.error('Erreur lors de l\'upload');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title.trim()) {
            toast.error('Le titre est requis');
            return;
        }

        setSaving(true);
        try {
            const data = {
                title: formData.title,
                description: formData.description,
                image_url: formData.image_url || null,
                is_active: formData.is_active,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null
            };

            if (editingItem) {
                const { error } = await supabase
                    .from('announcements')
                    .update(data)
                    .eq('id', editingItem.id);
                if (error) throw error;
                toast.success('Annonce mise à jour');
            } else {
                const { error } = await supabase
                    .from('announcements')
                    .insert([data]);
                if (error) throw error;
                toast.success('Annonce créée');
            }

            setShowModal(false);
            loadAnnouncements();
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (announcement: Announcement) => {
        if (!confirm(`Supprimer l'annonce "${announcement.title}" ?`)) return;

        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', announcement.id);

            if (error) throw error;
            toast.success('Annonce supprimée');
            loadAnnouncements();
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const columns = [
        {
            key: 'image_url',
            label: 'Visuel',
            sortable: false,
            render: (value: string) => value ? (
                <img src={value} alt="" className="w-16 h-10 rounded-lg object-cover" />
            ) : (
                <div className="w-16 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-slate-300" />
                </div>
            )
        },
        {
            key: 'title',
            label: 'Titre & Période',
            render: (value: string, row: Announcement) => (
                <div>
                    <p className="font-bold text-[#003058]">{value}</p>
                    <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                        <Calendar className="w-3 h-3 mr-1" />
                        {row.start_date ? new Date(row.start_date).toLocaleDateString() : 'Immédiat'}
                        {row.end_date ? ` au ${new Date(row.end_date).toLocaleDateString()}` : ' - Illimité'}
                    </div>
                </div>
            )
        },
        {
            key: 'is_active',
            label: 'Statut',
            render: (value: boolean) => (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${value ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                    {value ? 'Diffusé' : 'Brouillon'}
                </span>
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
                <h1 className="text-3xl font-black text-[#003058] tracking-tight">Gestion des Annonces</h1>
                <button
                    onClick={handleNew}
                    className="flex items-center space-x-2 bg-[#C5A065] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-amber-900/20 hover:scale-105 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nouvelle Annonce</span>
                </button>
            </div>

            {announcements.length > 0 ? (
                <DataTable
                    columns={columns}
                    data={announcements}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-[#F5F5F5] p-12 text-center">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Megaphone className="w-10 h-10 text-[#C5A065]" />
                    </div>
                    <h3 className="text-xl font-black text-[#003058]">Prêt à communiquer ?</h3>
                    <p className="text-slate-400 mt-2 font-medium">Diffusez des offres spéciales ou des événements importants à vos clients.</p>
                    <button
                        onClick={handleNew}
                        className="mt-6 bg-[#C5A065] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#b08e5a] transition-colors"
                    >
                        Créer ma première annonce
                    </button>
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingItem ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
                size="md"
            >
                <div className="space-y-6">
                    <FormField
                        label="Titre de l'annonce"
                        name="title"
                        type="text"
                        value={formData.title}
                        onChange={(v) => setFormData(prev => ({ ...prev, title: v }))}
                        required
                        placeholder="Ex: Soirée jazz ce vendredi !"
                    />

                    <FormField
                        label="Description détaillée"
                        name="description"
                        type="textarea"
                        value={formData.description}
                        onChange={(v) => setFormData(prev => ({ ...prev, description: v }))}
                        placeholder="Détails de l'offre ou de l'événement..."
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Date de début"
                            name="start_date"
                            type="text" // On utilisera un input date si possible ou text simple
                            value={formData.start_date}
                            onChange={(v) => setFormData(prev => ({ ...prev, start_date: v }))}
                        />
                        <FormField
                            label="Date de fin"
                            name="end_date"
                            type="text"
                            value={formData.end_date}
                            onChange={(v) => setFormData(prev => ({ ...prev, end_date: v }))}
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">Visuel (Bannière)</label>
                        <div className="flex items-start space-x-4">
                            {formData.image_url ? (
                                <img src={formData.image_url} alt="" className="w-32 h-20 rounded-xl object-cover" />
                            ) : (
                                <div className="w-32 h-20 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                    className="hidden"
                                    id="ann-image-upload"
                                />
                                <label
                                    htmlFor="ann-image-upload"
                                    className="inline-flex items-center px-4 py-2 bg-[#F5F5F5] text-[#003058] rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-200 transition-colors"
                                >
                                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    {uploadingImage ? 'Upload...' : 'Choisir une image'}
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 ml-4">
                        <FormField
                            label=""
                            name="is_active"
                            type="toggle"
                            value={formData.is_active}
                            onChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                        />
                        <span className="text-sm text-slate-500">Activer la diffusion immédiatement</span>
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
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingItem ? 'Mettre à jour' : 'Publier')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
