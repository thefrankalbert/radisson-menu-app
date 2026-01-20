"use client";

import { useEffect, useState } from "react";
import {
    Plus,
    Loader2,
    Filter,
    Copy,
    Image as ImageIcon,
    Check,
    X,
    Star
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import FormField from "@/components/admin/FormField";
import { MenuItem, Category, Restaurant } from "@/types/admin";
import { toast } from "react-hot-toast";

type ItemFormData = {
    name: string;
    name_en: string;
    description: string;
    description_en: string;
    price: number;
    image_url: string;
    category_id: string;
    is_available: boolean;
    is_featured: boolean;
};

const initialFormData: ItemFormData = {
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    price: 0,
    image_url: '',
    category_id: '',
    is_available: true,
    is_featured: false
};

type CategoryWithRestaurant = Category & { restaurant?: Restaurant };

export default function ItemsPage() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<CategoryWithRestaurant[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState<ItemFormData>(initialFormData);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Filtres
    const [filterRestaurant, setFilterRestaurant] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterAvailable, setFilterAvailable] = useState<string>('all');

    // Sélection multiple
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // Charger les restaurants
    const loadRestaurants = async () => {
        const { data } = await supabase
            .from('restaurants')
            .select('*')
            .order('name');
        setRestaurants(data || []);
    };

    // Charger les catégories
    const loadCategories = async () => {
        const { data } = await supabase
            .from('categories')
            .select('*, restaurants(id, name)')
            .order('name');

        const formattedCategories = (data || []).map((cat: any) => ({
            ...cat,
            restaurant: cat.restaurants
        }));
        setCategories(formattedCategories);
    };

    // Charger les plats
    const loadItems = async () => {
        try {
            let query = supabase
                .from('menu_items')
                .select(`
                    *,
                    categories (
                        id,
                        name,
                        restaurant_id
                    )
                `)
                .order('name');

            // Filtres
            if (filterCategory !== 'all') {
                query = query.eq('category_id', filterCategory);
            }

            if (filterAvailable !== 'all') {
                query = query.eq('is_available', filterAvailable === 'available');
            }

            const { data, error } = await query;

            if (error) throw error;

            let filteredData = data || [];

            // Filtre par restaurant (via category)
            if (filterRestaurant !== 'all') {
                filteredData = filteredData.filter((item: any) =>
                    item.categories?.restaurant_id === filterRestaurant
                );
            }

            const formattedItems: MenuItem[] = filteredData.map((item: any) => ({
                ...item,
                category: item.categories
            }));

            setItems(formattedItems);
        } catch (error) {
            console.error('Erreur chargement plats:', error);
            toast.error('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await Promise.all([loadRestaurants(), loadCategories()]);
            await loadItems();
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!loading) {
            loadItems();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterRestaurant, filterCategory, filterAvailable]);

    // Ouvrir modal pour nouveau plat
    const handleNewItem = () => {
        setEditingItem(null);
        setFormData(initialFormData);
        setShowModal(true);
    };

    // Ouvrir modal pour édition
    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name || '',
            name_en: item.name_en || '',
            description: item.description || '',
            description_en: item.description_en || '',
            price: item.price || 0,
            image_url: item.image_url || '',
            category_id: item.category_id || '',
            is_available: item.is_available !== false,
            is_featured: item.is_featured === true
        });
        setShowModal(true);
    };

    // Upload image
    const handleImageUpload = async (file: File) => {
        if (!file) return;

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `item-${Date.now()}.${fileExt}`;
            const filePath = `items/${fileName}`;

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

    // Sauvegarder plat
    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Le nom est requis');
            return;
        }
        if (!formData.category_id) {
            toast.error('La catégorie est requise');
            return;
        }

        setSaving(true);
        try {
            const itemData = {
                name: formData.name,
                name_en: formData.name_en || null,
                description: formData.description || null,
                description_en: formData.description_en || null,
                price: formData.price,
                image_url: formData.image_url || null,
                category_id: formData.category_id,
                is_available: formData.is_available,
                is_featured: formData.is_featured
            };

            if (editingItem) {
                const { error } = await supabase
                    .from('menu_items')
                    .update(itemData)
                    .eq('id', editingItem.id);

                if (error) throw error;
                toast.success('Plat mis à jour');
            } else {
                const { error } = await supabase
                    .from('menu_items')
                    .insert([itemData]);

                if (error) throw error;
                toast.success('Plat créé');
            }

            setShowModal(false);
            loadItems();
        } catch (error: any) {
            console.error('Erreur sauvegarde:', error);
            toast.error(error.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    // Supprimer plat
    const handleDelete = async (item: MenuItem) => {
        if (!confirm(`Supprimer le plat "${item.name}" ?`)) return;

        try {
            const { error } = await supabase
                .from('menu_items')
                .delete()
                .eq('id', item.id);

            if (error) throw error;
            toast.success('Plat supprimé');
            loadItems();
        } catch (error) {
            console.error('Erreur suppression:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    // Toggle disponibilité
    const handleToggleAvailable = async (item: MenuItem) => {
        try {
            const { error } = await supabase
                .from('menu_items')
                .update({ is_available: !item.is_available })
                .eq('id', item.id);

            if (error) throw error;
            loadItems();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    // Toggle mise en avant
    const handleToggleFeatured = async (item: MenuItem) => {
        try {
            const { error } = await supabase
                .from('menu_items')
                .update({ is_featured: !item.is_featured })
                .eq('id', item.id);

            if (error) throw error;
            loadItems();
            toast.success(item.is_featured ? 'Retiré de la une' : 'Mis à la une');
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    // Dupliquer plat
    const handleDuplicate = async (item: MenuItem) => {
        try {
            const { error } = await supabase
                .from('menu_items')
                .insert([{
                    name: `${item.name} (copie)`,
                    name_en: item.name_en ? `${item.name_en} (copy)` : null,
                    description: item.description,
                    description_en: item.description_en,
                    price: item.price,
                    image_url: item.image_url,
                    category_id: item.category_id,
                    is_available: false,
                    is_featured: item.is_featured
                }]);

            if (error) throw error;
            toast.success('Plat dupliqué');
            loadItems();
        } catch (error) {
            toast.error('Erreur lors de la duplication');
        }
    };

    // Actions en masse
    const handleBulkToggleAvailable = async (available: boolean) => {
        if (selectedItems.length === 0) return;

        try {
            const { error } = await supabase
                .from('menu_items')
                .update({ is_available: available })
                .in('id', selectedItems);

            if (error) throw error;
            toast.success(`${selectedItems.length} plat(s) mis à jour`);
            setSelectedItems([]);
            loadItems();
        } catch (error) {
            toast.error('Erreur lors de la mise à jour');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) return;
        if (!confirm(`Supprimer ${selectedItems.length} plat(s) ?`)) return;

        try {
            const { error } = await supabase
                .from('menu_items')
                .delete()
                .in('id', selectedItems);

            if (error) throw error;
            toast.success(`${selectedItems.length} plat(s) supprimé(s)`);
            setSelectedItems([]);
            loadItems();
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        }
    };

    // Catégories filtrées par restaurant sélectionné
    const filteredCategories = filterRestaurant === 'all'
        ? categories
        : categories.filter(c => c.restaurant_id === filterRestaurant);

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
            render: (value: string, row: MenuItem) => (
                <div>
                    <p className="font-bold text-[#003058]">{value}</p>
                    {row.category && (
                        <p className="text-xs text-slate-400">{row.category.name}</p>
                    )}
                </div>
            )
        },
        {
            key: 'price',
            label: 'Prix',
            render: (value: number) => (
                <span className="font-bold text-[#003058]">
                    {value?.toLocaleString()} FCFA
                </span>
            )
        },
        {
            key: 'is_available',
            label: 'Disponible',
            render: (value: boolean, row: MenuItem) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAvailable(row);
                    }}
                    className={`w-10 h-6 rounded-full p-1 transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${value ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                </button>
            )
        },
        {
            key: 'is_featured',
            label: 'À la une',
            render: (value: boolean, row: MenuItem) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFeatured(row);
                    }}
                    className={`p-2 rounded-lg transition-all ${value ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50'
                        }`}
                    title={value ? "Retirer de la une" : "Mettre à la une"}
                >
                    <Star className={`w-5 h-5 ${value ? 'fill-current' : ''}`} />
                </button>
            )
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            render: (_: any, row: MenuItem) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(row);
                    }}
                    className="p-2 text-slate-400 hover:text-[#003058] hover:bg-[#F5F5F5] rounded-lg transition-all"
                    title="Dupliquer"
                >
                    <Copy className="w-4 h-4" />
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-[#003058] tracking-tight">Gestion des Plats</h1>
                <button
                    onClick={handleNewItem}
                    className="flex items-center space-x-2 bg-[#003058] text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-blue-900/20 hover:scale-105 transition-transform"
                >
                    <Plus className="w-5 h-5" />
                    <span>Ajouter un plat</span>
                </button>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-4 p-6 bg-white rounded-2xl border border-[#F5F5F5]">
                <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={filterRestaurant}
                        onChange={(e) => {
                            setFilterRestaurant(e.target.value);
                            setFilterCategory('all');
                        }}
                        className="h-10 bg-[#F5F5F5] border-none rounded-xl px-4 text-sm font-bold text-[#003058]"
                    >
                        <option value="all">Toutes les cartes</option>
                        {restaurants.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                </div>

                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="h-10 bg-[#F5F5F5] border-none rounded-xl px-4 text-sm font-bold text-[#003058]"
                >
                    <option value="all">Toutes les catégories</option>
                    {filteredCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>

                <select
                    value={filterAvailable}
                    onChange={(e) => setFilterAvailable(e.target.value)}
                    className="h-10 bg-[#F5F5F5] border-none rounded-xl px-4 text-sm font-bold text-[#003058]"
                >
                    <option value="all">Tous</option>
                    <option value="available">Disponibles</option>
                    <option value="unavailable">Indisponibles</option>
                </select>

                <div className="ml-auto text-sm text-slate-400 font-bold">
                    {items.length} plat{items.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Actions en masse */}
            {selectedItems.length > 0 && (
                <div className="flex items-center space-x-4 p-4 bg-[#003058] rounded-2xl text-white">
                    <span className="font-bold">{selectedItems.length} sélectionné(s)</span>
                    <button
                        onClick={() => handleBulkToggleAvailable(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors"
                    >
                        <Check className="w-4 h-4" />
                        <span>Disponible</span>
                    </button>
                    <button
                        onClick={() => handleBulkToggleAvailable(false)}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-500 rounded-xl text-sm font-bold hover:bg-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        <span>Indisponible</span>
                    </button>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
                    >
                        <span>Supprimer</span>
                    </button>
                    <button
                        onClick={() => setSelectedItems([])}
                        className="ml-auto text-sm opacity-70 hover:opacity-100"
                    >
                        Annuler
                    </button>
                </div>
            )}

            {/* Tableau */}
            {items.length > 0 ? (
                <DataTable
                    columns={columns}
                    data={items}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ) : (
                <div className="bg-white rounded-3xl border border-[#F5F5F5] p-12 text-center">
                    <ImageIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-[#003058]">Aucun plat trouvé</h3>
                    <p className="text-slate-400 mt-2 font-medium">Ajoutez votre premier plat au menu.</p>
                    <button
                        onClick={handleNewItem}
                        className="mt-6 bg-[#C5A065] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#b08e5a] transition-colors"
                    >
                        Ajouter un plat
                    </button>
                </div>
            )}

            {/* Modal Ajout/Édition */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingItem ? 'Modifier le plat' : 'Nouveau plat'}
                size="lg"
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
                            placeholder="Ex: Poulet Yassa"
                        />
                        <FormField
                            label="Nom (EN)"
                            name="name_en"
                            type="text"
                            value={formData.name_en}
                            onChange={(v) => setFormData(prev => ({ ...prev, name_en: v }))}
                            placeholder="Ex: Yassa Chicken"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label="Description (FR)"
                            name="description"
                            type="textarea"
                            value={formData.description}
                            onChange={(v) => setFormData(prev => ({ ...prev, description: v }))}
                            placeholder="Description du plat..."
                        />
                        <FormField
                            label="Description (EN)"
                            name="description_en"
                            type="textarea"
                            value={formData.description_en}
                            onChange={(v) => setFormData(prev => ({ ...prev, description_en: v }))}
                            placeholder="Dish description..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            label="Prix (FCFA)"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={(v) => setFormData(prev => ({ ...prev, price: Number(v) }))}
                            required
                            placeholder="5000"
                        />
                        <FormField
                            label="Catégorie"
                            name="category_id"
                            type="select"
                            value={formData.category_id}
                            onChange={(v) => setFormData(prev => ({ ...prev, category_id: v }))}
                            required
                            placeholder="Sélectionner une catégorie"
                            options={categories.map(c => ({
                                value: c.id,
                                label: `${c.name}${c.restaurant ? ` (${c.restaurant.name})` : ''}`
                            }))}
                        />
                    </div>

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
                                    id="item-image-upload"
                                />
                                <label
                                    htmlFor="item-image-upload"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                                Disponibilité
                            </label>
                            <div className="flex items-center space-x-3 ml-4">
                                <FormField
                                    label=""
                                    name="is_available"
                                    type="toggle"
                                    value={formData.is_available}
                                    onChange={(v) => setFormData(prev => ({ ...prev, is_available: v }))}
                                />
                                <span className="text-sm text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                    {formData.is_available ? 'Disponible' : 'Indisponible'}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">
                                Mise en avant (FRONT)
                            </label>
                            <div className="flex items-center space-x-3 ml-4">
                                <FormField
                                    label=""
                                    name="is_featured"
                                    type="toggle"
                                    value={formData.is_featured}
                                    onChange={(v) => setFormData(prev => ({ ...prev, is_featured: v }))}
                                />
                                <span className="text-sm text-amber-600 font-black uppercase tracking-widest text-[10px]">
                                    {formData.is_featured ? 'À LA UNE' : 'Standard'}
                                </span>
                            </div>
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
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingItem ? 'Mettre à jour' : 'Créer')}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
