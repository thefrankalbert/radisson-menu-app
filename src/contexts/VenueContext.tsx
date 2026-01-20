"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Venue, Zone, Table } from '@/types/admin';

type VenueContextType = {
    currentVenue: Venue | null;
    setCurrentVenue: (venue: Venue | null) => void;
    venues: Venue[];
    zones: Zone[];
    tables: Table[];
    loading: boolean;
    error: string | null;
    getZonesForVenue: (venueId: string) => Zone[];
    getTablesForZone: (zoneId: string) => Table[];
    getTableByDisplayName: (displayName: string) => Table | undefined;
};

const VenueContext = createContext<VenueContextType | undefined>(undefined);

export function VenueProvider({ children }: { children: ReactNode }) {
    const [currentVenue, setCurrentVenue] = useState<Venue | null>(null);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Charger les données au démarrage
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                // Vérifier que Supabase est configuré
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
                
                if (!supabaseUrl || !supabaseKey) {
                    console.warn('Supabase non configuré, utilisation de données par défaut');
                    setVenues([]);
                    setZones([]);
                    setTables([]);
                    setLoading(false);
                    return;
                }

                // Charger les venues
                const { data: venuesData, error: venuesError } = await supabase
                    .from('venues')
                    .select('*')
                    .eq('is_active', true)
                    .order('display_order');

                if (venuesError) {
                    console.warn('Erreur chargement venues:', venuesError);
                    setVenues([]);
                } else {
                    setVenues(venuesData || []);
                }

                // Charger les zones
                const { data: zonesData, error: zonesError } = await supabase
                    .from('zones')
                    .select('*')
                    .order('display_order');

                if (zonesError) {
                    console.warn('Erreur chargement zones:', zonesError);
                    setZones([]);
                } else {
                    setZones(zonesData || []);
                }

                // Charger les tables
                const { data: tablesData, error: tablesError } = await supabase
                    .from('tables')
                    .select('*')
                    .eq('is_active', true);

                if (tablesError) {
                    console.warn('Erreur chargement tables:', tablesError);
                    setTables([]);
                } else {
                    setTables(tablesData || []);
                }

                // Définir le venue par défaut si URL contient un slug
                if (typeof window !== 'undefined') {
                    const params = new URLSearchParams(window.location.search);
                    const venueSlug = params.get('venue');
                    if (venueSlug && venuesData) {
                        const venue = venuesData.find(v => v.slug === venueSlug);
                        if (venue) {
                            setCurrentVenue(venue);
                        }
                    }
                }

            } catch (err) {
                console.error('Erreur chargement venues:', err);
                // Ne pas bloquer l'application, juste logger l'erreur
                setVenues([]);
                setZones([]);
                setTables([]);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    // Fonctions utilitaires
    const getZonesForVenue = (venueId: string): Zone[] => {
        return zones.filter(z => z.venue_id === venueId);
    };

    const getTablesForZone = (zoneId: string): Table[] => {
        return tables.filter(t => t.zone_id === zoneId);
    };

    const getTableByDisplayName = (displayName: string): Table | undefined => {
        return tables.find(t => t.display_name === displayName);
    };

    return (
        <VenueContext.Provider
            value={{
                currentVenue,
                setCurrentVenue,
                venues,
                zones,
                tables,
                loading,
                error,
                getZonesForVenue,
                getTablesForZone,
                getTableByDisplayName
            }}
        >
            {children}
        </VenueContext.Provider>
    );
}

export function useVenue() {
    const context = useContext(VenueContext);
    if (context === undefined) {
        throw new Error('useVenue must be used within a VenueProvider');
    }
    return context;
}
