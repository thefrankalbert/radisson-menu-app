"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Plus,
    Loader2,
    Folder,
    ChevronRight,
    GripVertical,
    Filter,
    Utensils,
    ArrowLeft
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";
import FormField from "@/components/admin/FormField";
import { toast } from "react-hot-toast";
import { ListPageSkeleton } from "@/components/admin/Skeleton";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

const categorySchema = z.object({
    name: z.string().min(1, "Le nom est requis").max(100),
    name_en: z.string().max(100).optional().or(z.literal("")),
    restaurant_id: z.string().min(1, "La carte est requise"),
    display_order: z.number().int().min(0)
});

type CategoryFormData = z.infer<typeof categorySchema>;

const initialFormData: CategoryFormData = {
    name: '',
    name_en: '',
    restaurant_id: '',
    display_order: 0
};

export default function CategoriesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialRestaurantFilter = searchParams.get('restaurant') || 'all';

    const [categories, setCategories] = useState<Category[]>([]);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [saving, setSaving] = useState(false);
    const [filterRestaurant, setFilterRestaurant] = useState<string>(initialRestaurantFilter);

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: initialFormData
    });

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
        reset({
            ...initialFormData,
            restaurant_id: filterRestaurant !== 'all' ? filterRestaurant : '',
            display_order: categories.length
        });
        setShowModal(true);
    };

    // Ouvrir modal pour édition
    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        reset({
            name: category.name || '',
            name_en: category.name_en || '',
            restaurant_id: category.restaurant_id || '',
            display_order: category.display_order || 0
        });
        setShowModal(true);
    };

    // Sauvegarder catégorie
    const onFormSubmit = async (data: CategoryFormData) => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                name_en: data.name_en || null
            };

            if (editingCategory) {
                const { error } = await supabase
                    .from('categories')
                    .update(payload)
                    .eq('id', editingCategory.id);

                if (error) throw error;
                toast.success('Catégorie mise à jour');
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([payload]);

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
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20"
                        disabled={index === 0}
                    >
                        <GripVertical className="w-3.5 h-3.5" />
                    </button>
                );
            }
        },
        {
            key: 'name',
            label: 'Catégorie',
            render: (value: string, row: Category) => (
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center border border-border">
                        <Folder className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-bold text-foreground text-sm tracking-tight">{value}</p>
                        {row.name_en && (
                            <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">{row.name_en}</p>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'restaurant',
            label: 'Carte',
            render: (value: Restaurant | undefined) => (
                <span className="px-2 py-0.5 bg-muted text-foreground border border-border rounded text-[9px] font-black uppercase tracking-widest">
                    {value?.name || 'N/A'}
                </span>
            )
        },
        {
            key: 'items_count',
            label: 'Contenu',
            render: (value: number) => (
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-foreground tabular-nums text-xs">{value || 0}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">plats</span>
                </div>
            )
        },
        {
            key: 'actions',
            label: '',
            sortable: false,
            render: (_: unknown, row: Category) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/items?category=${row.id}`);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all text-[9px] font-bold uppercase tracking-widest"
                    title="Voir les plats"
                >
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Plats</span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                </button>
            )
        }
    ];

    if (loading) {
        return <ListPageSkeleton />;
    }

    // Get current restaurant name for breadcrumb
    const currentRestaurant = filterRestaurant !== 'all' ? restaurants.find(r => r.id === filterRestaurant) : null;

    return (
        <div className="space-y-6 font-sans">
            {/* Breadcrumb when filtered */}
            {currentRestaurant && (
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                    <button
                        onClick={() => router.push('/admin/cards')}
                        className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Cartes
                    </button>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    <span className="text-primary">{currentRestaurant.name}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                    <span className="text-foreground">Catégories</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight uppercase">
                        {currentRestaurant ? `Catégories - ${currentRestaurant.name}` : 'Catégories'}
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium">Structurez votre offre gastronomique.</p>
                </div>
                <button
                    onClick={handleNewCategory}
                    className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold text-xs hover:opacity-90 active:scale-95 transition-all outline outline-1 outline-primary/20"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nouvelle Catégorie</span>
                </button>
            </div>

            {/* Filtre par carte */}
            <div className="flex items-center space-x-4 p-4 bg-card rounded-md border border-border">
                <div className="flex items-center space-x-2">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <Select value={filterRestaurant} onValueChange={setFilterRestaurant}>
                        <SelectTrigger className="h-9 w-[180px] text-xs font-bold">
                            <SelectValue placeholder="Toutes les cartes" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Toutes les cartes</SelectItem>
                            {restaurants.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="ml-auto text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    {categories.length} catégorie{categories.length > 1 ? 's' : ''} au total
                </div>
            </div>

            {/* Tableau ou état vide */}
            {categories.length > 0 ? (
                <div className="bg-card rounded-md border border-border overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={categories}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
            ) : (
                <div className="bg-card rounded-md border border-border p-16 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Folder className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground tracking-tight">Aucune catégorie</h3>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">
                        {filterRestaurant !== 'all'
                            ? 'Cette carte n\'a pas encore de catégorie.'
                            : 'Commencez par créer une catégorie pour organiser vos plats.'}
                    </p>
                    <button
                        onClick={handleNewCategory}
                        className="mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-md font-bold text-xs hover:opacity-90 transition-all"
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
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <FormField
                                    label="Nom (FR)"
                                    type="text"
                                    placeholder="Ex: Entrées"
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
                                    placeholder="Ex: Starters"
                                    error={errors.name_en?.message}
                                    {...field}
                                />
                            )}
                        />
                    </div>

                    <Controller
                        name="restaurant_id"
                        control={control}
                        render={({ field }) => (
                            <FormField
                                label="Carte associée"
                                type="select"
                                required
                                placeholder="Sélectionner une carte"
                                error={errors.restaurant_id?.message}
                                options={restaurants.map(r => ({
                                    value: r.id,
                                    label: r.name
                                }))}
                                {...field}
                            />
                        )}
                    />

                    <Controller
                        name="display_order"
                        control={control}
                        render={({ field }) => (
                            <FormField
                                label="Ordre d'affichage"
                                type="number"
                                placeholder="0"
                                error={errors.display_order?.message}
                                value={field.value}
                                onChange={(v) => field.onChange(Number(v))}
                                name={field.name}
                            />
                        )}
                    />

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
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (editingCategory ? 'Mettre à jour' : 'Créer')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
