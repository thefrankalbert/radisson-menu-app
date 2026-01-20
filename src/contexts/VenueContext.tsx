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

                // Les tables venues, zones et tables n'existent pas dans cette base de données
                // Initialiser avec des tableaux vides pour éviter les erreurs
                setVenues([]);
                setZones([]);
                setTables([]);

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
