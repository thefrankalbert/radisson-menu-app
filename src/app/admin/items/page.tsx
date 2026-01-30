"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Plus,
    Loader2,
    Filter,
    Copy,
    Image as ImageIcon,
    Check,
    X,
    Star,
    Trash2,
    Search,
    UploadCloud
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import FormField from "@/components/admin/FormField";
import { MenuItem, Category, Restaurant } from "@/types/admin";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { ListPageSkeleton } from "@/components/admin/Skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const itemSchema = z.object({
    name: z.string().min(1, "Le nom est requis").max(100),
    name_en: z.string().max(100).optional().or(z.literal("")),
    description: z.string().max(1000).optional().or(z.literal("")),
    description_en: z.string().max(1000).optional().or(z.literal("")),
    price: z.number().min(0, "Le prix doit être positif"),
    image_url: z.string().url().optional().or(z.literal("")),
    image_back_url: z.string().url().optional().or(z.literal("")),
    category_id: z.string().min(1, "La catégorie est requise"),
    is_available: z.boolean(),
    is_featured: z.boolean()
});

type ItemFormData = z.infer<typeof itemSchema>;

const initialFormData: ItemFormData = {
    name: '',
    name_en: '',
    description: '',
    description_en: '',
    price: 0,
    image_url: '',
    image_back_url: '',
    category_id: '',
    is_available: true,
    is_featured: false
};

type CategoryWithRestaurant = Category & { restaurant?: Restaurant };

export default function ItemsPage() {
    const { t, language } = useLanguage();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<CategoryWithRestaurant[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialRestaurantFilter = searchParams.get('restaurant') || 'all';
    const initialCategoryFilter = searchParams.get('category') || 'all';
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingBackImage, setUploadingBackImage] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingBack, setIsDraggingBack] = useState(false);

    // Form
    const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ItemFormData>({
        resolver: zodResolver(itemSchema),
        defaultValues: initialFormData
    });

    const imageUrl = watch('image_url');
    const imageBackUrl = watch('image_back_url');

    // Filtres
    const [filterRestaurant, setFilterRestaurant] = useState<string>(initialRestaurantFilter);
    const [filterCategory, setFilterCategory] = useState<string>(initialCategoryFilter);
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
            .order('display_order', { ascending: true });

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
        reset(initialFormData);
        setShowModal(true);
    };

    // Ouvrir modal pour édition
    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        reset({
            name: item.name || '',
            name_en: item.name_en || '',
            description: item.description || '',
            description_en: item.description_en || '',
            price: item.price || 0,
            image_url: item.image_url || '',
            image_back_url: item.image_back_url || '',
            category_id: item.category_id || '',
            is_available: item.is_available !== false,
            is_featured: item.is_featured === true
        });
        setShowModal(true);
    };

    // Upload image principale (Recto)
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

            setValue('image_url', publicUrl);
            toast.success('Image recto uploadée');
        } catch (error) {
            console.error('Erreur upload:', error);
            toast.error('Erreur lors de l\'upload');
        } finally {
            setUploadingImage(false);
        }
    };

    // Upload image verso (détail)
    const handleBackImageUpload = async (file: File) => {
        if (!file) return;

        setUploadingBackImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `item-back-${Date.now()}.${fileExt}`;
            const filePath = `items/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            setValue('image_back_url', publicUrl);
            toast.success('Image verso uploadée');
        } catch (error) {
            console.error('Erreur upload:', error);
            toast.error('Erreur lors de l\'upload');
        } finally {
            setUploadingBackImage(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleImageUpload(file);
    };

    const handleBackDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingBack(true);
    };

    const handleBackDragLeave = () => {
        setIsDraggingBack(false);
    };

    const handleBackDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingBack(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleBackImageUpload(file);
    };

    // Sauvegarder plat
    const onFormSubmit = async (data: ItemFormData) => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                name_en: data.name_en || null,
                description: data.description || null,
                description_en: data.description_en || null,
                image_url: data.image_url || null,
                image_back_url: data.image_back_url || null
            };

            if (editingItem) {
                const { error } = await supabase
                    .from('menu_items')
                    .update(payload)
                    .eq('id', editingItem.id);

                if (error) throw error;
                toast.success('Plat mis à jour');
            } else {
                const { error } = await supabase
                    .from('menu_items')
                    .insert([payload]);

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
            label: 'Visuel',
            sortable: false,
            render: (value: string) => value ? (
                <img src={value} alt="" className="w-10 h-10 rounded-md object-cover border border-border" />
            ) : (
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border">
                    <ImageIcon className="w-4 h-4 text-muted-foreground/30" />
                </div>
            )
        },
        {
            key: 'name',
            label: t('item_name_fr'),
            render: (value: string, row: MenuItem) => (
                <div>
                    <p className="font-bold text-foreground text-sm tracking-tight">
                        {language === 'en' ? (row.name_en || row.name) : row.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">
                        {row.category?.name} <span className="text-muted-foreground/30 mx-1">•</span> {categories.find(c => c.id === row.category_id)?.restaurant?.name}
                    </p>
                </div>
            )
        },
        {
            key: 'price',
            label: 'Tarif (XAF)',
            render: (value: number) => (
                <span className="font-black text-foreground tabular-nums text-xs">
                    {value?.toLocaleString()} <span className="text-[9px] text-muted-foreground ml-0.5">XAF</span>
                </span>
            )
        },
        {
            key: 'is_available',
            label: 'Statut',
            render: (value: boolean, row: MenuItem) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleAvailable(row); }}
                    className={cn(
                        "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                        value ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-muted text-muted-foreground border-border"
                    )}
                >
                    {value ? 'En stock' : 'Épuisé'}
                </button>
            )
        },
        {
            key: 'is_featured',
            label: 'À la une',
            render: (value: boolean, row: MenuItem) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleToggleFeatured(row); }}
                    className={cn(
                        "p-2 rounded-md transition-all",
                        value ? "text-amber-500 bg-amber-50" : "text-muted-foreground/30 hover:text-amber-500 hover:bg-muted"
                    )}
                >
                    <Star className={cn("w-4 h-4", value ? "fill-current" : "")} />
                </button>
            )
        }
    ];

    if (loading) {
        return <ListPageSkeleton />;
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight uppercase">Base de données Produits</h1>
                    <p className="text-xs text-muted-foreground font-medium">Référence complète de votre carte gastronomique.</p>
                </div>
                <button
                    onClick={handleNewItem}
                    className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold text-xs hover:opacity-90 active:scale-95 transition-all outline outline-1 outline-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nouvel Article</span>
                </button>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-md border border-border">
                <div className="flex items-center space-x-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <Select value={filterRestaurant} onValueChange={(value) => { setFilterRestaurant(value); setFilterCategory('all'); }}>
                        <SelectTrigger className="h-9 w-[180px] text-[10px] font-bold uppercase tracking-widest">
                            <SelectValue placeholder="Tous les Menus" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les Menus</SelectItem>
                            {restaurants.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-9 w-[200px] text-[10px] font-bold uppercase tracking-widest">
                        <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes les catégories</SelectItem>
                        {filteredCategories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="ml-auto text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                    {items.length} Références actives
                </div>
            </div>

            {/* Actions en masse - Sticky Bar Style Nova */}
            {selectedItems.length > 0 && (
                <div className="sticky top-2 z-[50] bg-foreground text-background p-3 rounded-md border border-white/10 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary text-primary-foreground w-8 h-8 rounded flex items-center justify-center font-black text-xs">
                            {selectedItems.length}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Sélection groupée active</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleBulkToggleAvailable(true)}
                            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-sm text-[9px] font-black uppercase tracking-widest transition-colors"
                        >
                            En stock
                        </button>
                        <button
                            onClick={() => handleBulkToggleAvailable(false)}
                            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-sm text-[9px] font-black uppercase tracking-widest transition-colors"
                        >
                            Épuisé
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-sm text-[9px] font-black uppercase tracking-widest transition-colors"
                        >
                            Supprimer
                        </button>
                        <button onClick={() => setSelectedItems([])} className="p-2 hover:bg-white/10 rounded-sm">
                            <X className="w-4 h-4 text-white/40" />
                        </button>
                    </div>
                </div>
            )}

            {/* Tableau */}
            <div className="bg-card rounded-md border border-border overflow-hidden">
                <DataTable
                    selectable
                    onSelectionChange={setSelectedItems}
                    columns={columns}
                    data={items}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    emptyMessage="Aucun plat enregistré correspondant aux filtres."
                />
            </div>

            {/* Modal Ajout/Édition */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingItem ? 'Modifier le plat' : 'Nouveau plat'}
                size="lg"
            >
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label={t('item_name_fr')}
                                    type="text"
                                    placeholder="Ex: Poulet Yassa"
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
                                    label={t('item_name_en')}
                                    type="text"
                                    placeholder="Ex: Yassa Chicken"
                                    error={errors.name_en?.message}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label={t('description_fr')}
                                    type="textarea"
                                    placeholder="Description du plat..."
                                    error={errors.description?.message}
                                    {...field}
                                />
                            )}
                        />
                        <Controller
                            name="description_en"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label={t('description_en')}
                                    type="textarea"
                                    placeholder="Dish description..."
                                    error={errors.description_en?.message}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="price"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label={t('price_cfa')}
                                    name={field.name}
                                    type="number"
                                    placeholder="5000"
                                    required
                                    error={errors.price?.message}
                                    value={field.value}
                                    onChange={(v) => field.onChange(Number(v))}
                                />
                            )}
                        />
                        <Controller
                            name="category_id"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label={t('category')}
                                    type="select"
                                    required
                                    placeholder={t('all_categories')}
                                    error={errors.category_id?.message}
                                    options={categories.map(c => ({
                                        value: c.id,
                                        label: `${c.name}${c.restaurant ? ` (${c.restaurant.name})` : ''}`
                                    }))}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Visuels du plat (Recto / Verso)</label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Image Recto (principale) */}
                            <div className="space-y-2">
                                <p className="text-[9px] font-bold text-primary uppercase tracking-widest">Recto (Principal)</p>
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={cn(
                                        "w-full aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center transition-all relative overflow-hidden group",
                                        isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-muted-foreground/30",
                                        imageUrl ? "border-solid" : ""
                                    )}
                                >
                                    {imageUrl ? (
                                        <>
                                            <img src={imageUrl} alt="" className="w-full h-full object-cover transition-all group-hover:opacity-50" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => setValue('image_url', '')}
                                                    className="bg-destructive text-destructive-foreground p-1.5 rounded-full border border-destructive-foreground/20"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <UploadCloud className={cn("w-6 h-6 mx-auto mb-2 transition-colors", isDragging ? "text-primary" : "text-muted-foreground/30")} />
                                            <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60 leading-tight">Glisser-déposer</p>
                                        </div>
                                    )}
                                    {uploadingImage && (
                                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                    className="hidden"
                                    id="item-image-upload"
                                />
                                <label
                                    htmlFor="item-image-upload"
                                    className="w-full inline-flex items-center justify-center px-3 py-1.5 bg-background border border-border text-foreground rounded-md font-bold text-[9px] uppercase tracking-wider cursor-pointer hover:bg-muted transition-all"
                                >
                                    <ImageIcon className="w-3 h-3 mr-1.5 opacity-50" />
                                    Parcourir
                                </label>
                            </div>

                            {/* Image Verso (détail) */}
                            <div className="space-y-2">
                                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Verso (Détail)</p>
                                <div
                                    onDragOver={handleBackDragOver}
                                    onDragLeave={handleBackDragLeave}
                                    onDrop={handleBackDrop}
                                    className={cn(
                                        "w-full aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center transition-all relative overflow-hidden group",
                                        isDraggingBack ? "border-amber-500 bg-amber-500/5" : "border-border bg-muted/30 hover:border-muted-foreground/30",
                                        imageBackUrl ? "border-solid" : ""
                                    )}
                                >
                                    {imageBackUrl ? (
                                        <>
                                            <img src={imageBackUrl} alt="" className="w-full h-full object-cover transition-all group-hover:opacity-50" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => setValue('image_back_url', '')}
                                                    className="bg-destructive text-destructive-foreground p-1.5 rounded-full border border-destructive-foreground/20"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center p-4">
                                            <UploadCloud className={cn("w-6 h-6 mx-auto mb-2 transition-colors", isDraggingBack ? "text-amber-500" : "text-muted-foreground/30")} />
                                            <p className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground/60 leading-tight">Glisser-déposer</p>
                                        </div>
                                    )}
                                    {uploadingBackImage && (
                                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleBackImageUpload(e.target.files[0])}
                                    className="hidden"
                                    id="item-back-image-upload"
                                />
                                <label
                                    htmlFor="item-back-image-upload"
                                    className="w-full inline-flex items-center justify-center px-3 py-1.5 bg-background border border-border text-foreground rounded-md font-bold text-[9px] uppercase tracking-wider cursor-pointer hover:bg-muted transition-all"
                                >
                                    <ImageIcon className="w-3 h-3 mr-1.5 opacity-50" />
                                    Parcourir
                                </label>
                            </div>
                        </div>
                        <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-tighter text-center">
                            Format : Carré (800x800px) • Max 2MB • JPG, PNG, WEBP
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border pt-6">
                        <div className="flex items-center gap-3 ml-1">
                            <Controller
                                name="is_available"
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
                            <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Disponible à la vente</span>
                        </div>

                        <div className="flex items-center gap-3 ml-1">
                            <Controller
                                name="is_featured"
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
                            <span className="text-[11px] text-amber-600 font-bold uppercase tracking-wider">Mettre en avant au menu</span>
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
                            className="flex items-center gap-2 px-8 py-2 bg-primary text-primary-foreground font-bold rounded-md hover:opacity-90 transition-all text-[10px] uppercase tracking-wider disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (editingItem ? 'Mettre à jour' : 'Créer le plat')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
