"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Loader2,
    Trash2,
    Image as ImageIcon,
    Megaphone,
    Link as LinkIcon,
    ArrowUpDown,
    Eye,
    EyeOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import Image from "next/image";

type Ad = {
    id: string;
    image_url: string;
    link: string | null;
    sort_order: number;
    active: boolean;
    created_at: string;
};

type AdFormData = {
    image_url: string;
    link: string;
    sort_order: number;
    active: boolean;
};

const initialFormData: AdFormData = {
    image_url: '',
    link: '',
    sort_order: 1,
    active: true
};

export default function AnnouncementsPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<AdFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const loadAds = async () => {
        try {
            const { data, error } = await supabase
                .from('ads')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setAds(data || []);
        } catch (error) {
            console.error('Erreur chargement ads:', error);
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAds();
    }, []);

    const handleNew = () => {
        setFormData(initialFormData);
        setSelectedFile(null);
        setPreviewUrl(null);
        setShowModal(true);
    };

    const handleFileSelect = (file: File) => {
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!selectedFile && !formData.image_url) {
            toast.error('Une image est requise');
            return;
        }

        setSaving(true);
        try {
            let imageUrl = formData.image_url;

            // Upload image if new file selected
            if (selectedFile) {
                setUploadingImage(true);
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `ad-banner-${Date.now()}.${fileExt}`;
                const filePath = `ad-banners/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, selectedFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
                setUploadingImage(false);
            }

            // Insert new ad
            const { error } = await supabase
                .from('ads')
                .insert([{
                    image_url: imageUrl,
                    link: formData.link || null,
                    sort_order: formData.sort_order,
                    active: formData.active
                }]);

            if (error) throw error;

            toast.success('Bannière créée avec succès');
            setShowModal(false);
            setSelectedFile(null);
            setPreviewUrl(null);
            loadAds();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
            setUploadingImage(false);
        }
    };

    const handleDelete = async (ad: Ad) => {
        if (!confirm('Supprimer cette bannière publicitaire ?')) return;

        try {
            const { error } = await supabase
                .from('ads')
                .delete()
                .eq('id', ad.id);

            if (error) throw error;
            toast.success('Bannière supprimée');
            loadAds();
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleToggleActive = async (ad: Ad) => {
        try {
            const { error } = await supabase
                .from('ads')
                .update({ active: !ad.active })
                .eq('id', ad.id);

            if (error) throw error;
            toast.success(ad.active ? 'Bannière désactivée' : 'Bannière activée');
            loadAds();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

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
                    className="flex items-center space-x-2 bg-[#C5A065] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:scale-105 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nouvelle Annonce</span>
                </button>
            </div>

            {ads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map((ad) => (
                        <div
                            key={ad.id}
                            className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-md ${!ad.active ? 'opacity-60' : ''}`}
                        >
                            {/* Image */}
                            <div className="relative h-40 bg-gray-100">
                                {ad.image_url ? (
                                    <Image
                                        src={ad.image_url}
                                        alt="Bannière"
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-12 h-12 text-gray-300" />
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ad.active
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-400 text-white'
                                    }`}>
                                    {ad.active ? 'Actif' : 'Inactif'}
                                </div>

                                {/* Priority Badge */}
                                <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-sm font-bold text-[#003058]">
                                    {ad.sort_order}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                {ad.link && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                        <LinkIcon className="w-3 h-3" />
                                        <span className="truncate">{ad.link}</span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleActive(ad)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors ${ad.active
                                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                            }`}
                                    >
                                        {ad.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        {ad.active ? 'Désactiver' : 'Activer'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ad)}
                                        className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="text-xl font-black text-[#003058]">Ajouter une publicité</h2>
                            <p className="text-sm text-gray-400 mt-1">Cette bannière apparaîtra sur le slider de la page d'accueil</p>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Image de la bannière *
                                </label>
                                <p className="text-xs text-gray-400 mb-3">Format recommandé : Paysage (16:9 ou 3:1)</p>

                                <div className="relative">
                                    {previewUrl ? (
                                        <div className="relative h-40 rounded-2xl overflow-hidden bg-gray-100">
                                            <Image
                                                src={previewUrl}
                                                alt="Prévisualisation"
                                                fill
                                                className="object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedFile(null);
                                                    setPreviewUrl(null);
                                                }}
                                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-[#C5A065] transition-colors bg-gray-50">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                                className="hidden"
                                            />
                                            <ImageIcon className="w-10 h-10 text-gray-300 mb-2" />
                                            <span className="text-sm font-medium text-gray-500">Cliquer pour uploader</span>
                                            <span className="text-xs text-gray-400 mt-1">JPEG, PNG ou WebP</span>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Link */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Lien de redirection (optionnel)
                                </label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="url"
                                        value={formData.link}
                                        onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                                        placeholder="https://exemple.com/promo"
                                        className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A065] text-sm"
                                    />
                                </div>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    Priorité d'affichage
                                </label>
                                <div className="relative">
                                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="number"
                                        min={1}
                                        max={99}
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 1 }))}
                                        className="w-full h-12 pl-11 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C5A065] text-sm"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Plus le nombre est petit, plus la bannière apparaît en premier</p>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-medium text-[#003058]">Activer immédiatement</p>
                                    <p className="text-xs text-gray-400">La bannière sera visible sur le slider</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${formData.active ? 'bg-emerald-500' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.active ? 'left-7' : 'left-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedFile(null);
                                    setPreviewUrl(null);
                                }}
                                className="flex-1 h-12 bg-gray-100 text-[#003058] font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || uploadingImage || (!selectedFile && !formData.image_url)}
                                className="flex-1 h-12 bg-[#003058] text-white font-bold rounded-xl hover:bg-[#004a80] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {saving || uploadingImage ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'Publier'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
