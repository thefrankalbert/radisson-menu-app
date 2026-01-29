"use client";

import { useState } from "react";
import { Plus, Image as ImageIcon, Calendar, Eye, MoreVertical, Pencil, Trash2, Copy } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface Ad {
    id: string;
    title: string;
    description: string;
    image_url: string | null;
    category: string;
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
    views: number;
}

// Couleurs des badges par catégorie
const CATEGORY_COLORS: Record<string, string> = {
    "Restaurant": "bg-primary/10 text-primary hover:bg-primary/20",
    "Panorama": "bg-accent/20 text-accent-foreground hover:bg-accent/30",
    "Lobby": "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    "Pool": "bg-blue-100 text-blue-700 hover:bg-blue-200",
};

interface AdsClientProps {
    initialAds: Ad[];
}

export default function AdsClient({ initialAds }: AdsClientProps) {
    const [ads, setAds] = useState<Ad[]>(initialAds);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const handleToggleActive = (id: string) => {
        setAds(prev => prev.map(ad =>
            ad.id === id ? { ...ad, is_active: !ad.is_active } : ad
        ));
    };

    const formatDate = (date: string | null) => {
        if (!date) return "Illimité";
        return new Date(date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-primary tracking-tight">
                        Campagnes Publicitaires
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez vos promotions et annonces client
                    </p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shadow-lg">
                            <Plus className="w-4 h-4" />
                            Créer une publicité
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-primary">Nouvelle Campagne</DialogTitle>
                            <DialogDescription>
                                Créez une nouvelle publicité pour vos clients. Elle apparaîtra sur le menu digital.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Titre de la campagne</Label>
                                <Input id="title" placeholder="Ex: Soirée spéciale Saint-Valentin" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input id="description" placeholder="Décrivez votre offre..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="start">Date de début</Label>
                                    <Input id="start" type="date" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="end">Date de fin</Label>
                                    <Input id="end" type="date" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Annuler
                            </Button>
                            <Button onClick={() => setIsCreateDialogOpen(false)}>
                                Créer la campagne
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-black text-primary">{ads.filter(a => a.is_active).length}</div>
                        <p className="text-xs text-muted-foreground font-medium">Campagnes actives</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-black text-accent">{ads.reduce((sum, a) => sum + a.views, 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground font-medium">Vues totales</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="text-2xl font-black text-primary">{ads.length}</div>
                        <p className="text-xs text-muted-foreground font-medium">Total campagnes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Grille de cartes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map((ad) => (
                    <Card
                        key={ad.id}
                        className={`overflow-hidden transition-all duration-200 hover:shadow-lg ${!ad.is_active ? 'opacity-60' : ''
                            }`}
                    >
                        {/* Image placeholder */}
                        <div className="relative h-40 bg-gradient-to-br from-primary/5 to-accent/10">
                            {ad.image_url ? (
                                <img
                                    src={ad.image_url}
                                    alt={ad.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                                        <span className="text-xs text-muted-foreground/50 mt-2 block">
                                            Aucune image
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Badge catégorie - positionné en haut à gauche */}
                            <Badge
                                className={`absolute top-3 left-3 ${CATEGORY_COLORS[ad.category] || 'bg-secondary'}`}
                            >
                                {ad.category}
                            </Badge>

                            {/* Menu contextuel */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-md"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="gap-2">
                                        <Pencil className="w-4 h-4" />
                                        Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="gap-2">
                                        <Copy className="w-4 h-4" />
                                        Dupliquer
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                        Supprimer
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <h3 className="font-bold text-lg text-primary leading-tight">
                                    {ad.title}
                                </h3>
                            </div>
                        </CardHeader>

                        <CardContent className="pb-3">
                            <p className="text-sm text-muted-foreground line-clamp-2">
                                {ad.description}
                            </p>

                            {/* Infos période et vues */}
                            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{formatDate(ad.start_date)} - {formatDate(ad.end_date)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{ad.views.toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="border-t bg-muted/30 py-3">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={ad.is_active}
                                        onCheckedChange={() => handleToggleActive(ad.id)}
                                    />
                                    <span className={`text-sm font-medium ${ad.is_active ? 'text-primary' : 'text-muted-foreground'
                                        }`}>
                                        {ad.is_active ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-xs">
                                    Voir détails
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
