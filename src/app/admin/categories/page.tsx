"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Loader2,
    Folder,
    ChevronRight,
    GripVertical,
    Image as ImageIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import FormField from "@/components/admin/FormField";
import { toast } from "react-hot-toast";

type Restaurant = {
    id: string;
    name: string;
    slug: string;
};

type Category = {
    id: string;
    name: string;
    name_en: string | null;
    restaurant_id: string;
    display_order: number;
    created_at: string;
    restaurant?: Restaurant;
    items_count?: number;
};

type CategoryFormData = {
    name: string;
    name_en: string;
    restaurant_id: string;
    display_order: number;
};

const initialFormData: CategoryFormData = {
    name: '',
    name_en: '',
    restaurant_id: '',
    display_order: 0
};

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [filterRestaurant, setFilterRestaurant] = useState<string>('all');

    // Charger les restaurants
    const loadRestaurants = async () => {
        const { data } = await supabase
            .from('restaurants')
            .select('id, name, slug')
            .order('name');
        setRestaurants(data || []);
    };

    // Charger les catégories avec le nombre d'items
    const loadCategories = async () => {
        try {
            let query = supabase
                .from('categories')
                .select(`
                    *,
                    restaurants (id, name, slug),
                    menu_items (id)
                `)
                .order('display_order', { ascending: true });

            if (filterRestaurant !== 'all') {
                query = query.eq('restaurant_id', filterRestaurant);
            }

            const { data, error } = await query;

            if (error) throw error;

            const formattedCategories: Category[] = (data || []).map((cat: any) => ({
                ...cat,
                restaurant: cat.restaurants,
                items_count: cat.menu_items?.length || 0
            }));

            setCategories(formattedCategories);
        } catch (error) {
            console.error('Erreur chargement catégories:', error);
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await loadRestaurants();
            await loadCategories();
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading) {
            loadCategories();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterRestaurant]);

    // Ouvrir modal pour nouvelle catégorie
    const handleNewCategory = () => {
        setEditingCategory(null);
        setFormData({
            ...initialFormData,
            restaurant_id: filterRestaurant !== 'all' ? filterRestaurant : '',
            display_order: categories.length
        });
        setShowModal(true);
    };

    // Ouvrir modal pour édition
    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || '',
            name_en: category.name_en || '',
            restaurant_id: category.restaurant_id || '',
            display_order: category.display_order || 0
        });
        setShowModal(true);
    };

    // Sauvegarder catégorie
    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Le nom est requis');
            return;
        }
        if (!formData.restaurant_id) {
            toast.error('La carte est requise');
            return;
        }

        setSaving(true);
        try {
            const categoryData = {
                name: formData.name,
                name_en: formData.name_en || null,
                restaurant_id: formData.restaurant_id,
                display_order: formData.display_order
            };

            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update(categoryData)
                    .eq('id', editingCategory.id);

                if (error) throw error;
                toast.success('Catégorie mise à jour');
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([categoryData]);

                if (error) throw error;
                toast.success('Catégorie créée');
            }

            setShowModal(false);
            loadCategories();
        } catch (error: any) {
            console.error('Erreur sauvegarde:', error);
            toast.error(error.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    // Supprimer catégorie
    const handleDelete = async (category: Category) => {
        if (category.items_count && category.items_count > 0) {
            toast.error(`Cette catégorie contient ${category.items_count} plat(s). Supprimez-les d'abord.`);
            return;
        }

        if (!confirm(`Supprimer la catégorie "${category.name}" ?`)) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', category.id);

            if (error) throw error;
            toast.success('Catégorie supprimée');
            loadCategories();
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    // Déplacer catégorie (ordre)
    const handleMoveUp = async (category: Category, index: number) => {
        if (index === 0) return;

        const prevCategory = categories[index - 1];
        try {
            await supabase
                .from('categories')
                .update({ display_order: category.display_order - 1 })
                .eq('id', category.id);

            await supabase
                .from('categories')
                .update({ display_order: prevCategory.display_order + 1 })
                .eq('id', prevCategory.id);

            loadCategories();
        } catch (error) {
            toast.error('Erreur lors du déplacement');
        }
    };

    // Colonnes du tableau
    const columns = [
        {
            key: 'display_order',
            label: '#',
            sortable: false,
            render: (value: number, row: Category) => {
                const index = categories.findIndex(c => c.id === row.id);
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleMoveUp(row, index);
                        }}
                        className="p-1 text-slate-300 hover:text-[#003058] transition-colors"
                        disabled={index === 0}
                    >
                        <GripVertical className="w-4 h-4" />
                    </button>
                );
            }
        },
        {
            key: 'name',
            label: 'Nom',
            render: (value: string, row: Category) => (
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#003058]/10 rounded-xl flex items-center justify-center">
                        <Folder className="w-5 h-5 text-[#003058]" />
                    </div>
                    <div>
                        <p className="font-bold text-[#003058]">{value}</p>
                        {row.name_en && (
                            <p className="text-xs text-slate-400">{row.name_en}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'restaurant',
            label: 'Carte',
            render: (value: Restaurant | undefined) => (
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {value?.name || 'N/A'}
                </span>
            )
        },
        {
            key: 'items_count',
            label: 'Plats',
            render: (value: number) => (
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-[#003058]">{value || 0}</span>
                    <span className="text-xs text-slate-400">plats</span>
                </div>
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#003058] tracking-tight">Gestion des Catégories</h1>
                    <p className="text-slate-400 mt-1 font-medium">Organisez vos plats par catégories</p>
                </div>
                <button
                    onClick={handleNewCategory}
                    className="flex items-center space-x-2 bg-[#003058] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 hover:scale-105 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nouvelle Catégorie</span>
                </button>
            </div>

            {/* Filtre par carte */}
            <div className="flex items-center space-x-4 p-4 bg-white rounded-2xl border border-[#F5F5F5]">
                <Folder className="w-5 h-5 text-slate-400" />
                <select
                    value={filterRestaurant}
                    onChange={(e) => setFilterRestaurant(e.target.value)}
                    className="h-10 bg-[#F5F5F5] border-none rounded-xl px-4 text-sm font-bold text-[#003058] flex-1 max-w-xs"
                >
                    <option value="all">Toutes les cartes</option>
                    {restaurants.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>

                <div className="ml-auto text-sm text-slate-400 font-bold">
                    {categories.length} catégorie{categories.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Tableau ou état vide */}
            {categories.length > 0 ? (
                <DataTable
                    columns={columns}
                    data={categories}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ) : (
                <div className="bg-white rounded-[2.5rem] border border-[#F5F5F5] p-12 text-center">
                    <div className="w-20 h-20 bg-[#F5F5F5] rounded-full flex items-center justify-center mx-auto mb-6">
                        <Folder className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-[#003058]">Aucune catégorie</h3>
                    <p className="text-slate-400 mt-2 font-medium">
                        {filterRestaurant !== 'all'
                            ? 'Cette carte n\'a pas encore de catégorie.'
                            : 'Commencez par créer une catégorie pour organiser vos plats.'}
                    </p>
                    <button
                        onClick={handleNewCategory}
                        className="mt-6 bg-[#C5A065] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#b08e5a] transition-colors"
                    >
                        Créer une catégorie
                    </button>
                </div>
            )}

            {/* Modal Ajout/Édition */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                size="md"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label="Nom (FR)"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={(v) => setFormData(prev => ({ ...prev, name: v }))}
                            required
                            placeholder="Ex: Entrées"
                        />
                        <FormField
                            label="Nom (EN)"
                            name="name_en"
                            type="text"
                            value={formData.name_en}
                            onChange={(v) => setFormData(prev => ({ ...prev, name_en: v }))}
                            placeholder="Ex: Starters"
                        />
                    </div>

                    <FormField
                        label="Carte associée"
                        name="restaurant_id"
                        type="select"
                        value={formData.restaurant_id}
                        onChange={(v) => setFormData(prev => ({ ...prev, restaurant_id: v }))}
                        required
                        placeholder="Sélectionner une carte"
                        options={restaurants.map(r => ({
                            value: r.id,
                            label: r.name
                        }))}
                    />

                    <FormField
                        label="Ordre d'affichage"
                        name="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(v) => setFormData(prev => ({ ...prev, display_order: Number(v) }))}
                        placeholder="0"
                    />

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
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingCategory ? 'Mettre à jour' : 'Créer')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
