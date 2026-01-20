"use client";

import { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { useVenue } from '@/contexts/VenueContext';
import { Zone, Table } from '@/types/admin';

type TablePickerProps = {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (table: Table) => void;
    venueId?: string;
};

export default function TablePicker({ isOpen, onClose, onSelect, venueId }: TablePickerProps) {
    const { zones, tables, getZonesForVenue, getTablesForZone, currentVenue } = useVenue();

    const effectiveVenueId = venueId || currentVenue?.id;

    // Zones disponibles pour ce venue
    const availableZones = useMemo(() => {
        if (!effectiveVenueId) return zones;
        return getZonesForVenue(effectiveVenueId);
    }, [effectiveVenueId, zones, getZonesForVenue]);

    const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);

    // Tables disponibles pour la zone sélectionnée
    const availableTables = useMemo(() => {
        if (!selectedZone) return [];
        return getTablesForZone(selectedZone.id);
    }, [selectedZone, getTablesForZone]);

    // Initialiser avec la première zone
    useEffect(() => {
        if (availableZones.length > 0 && !selectedZone) {
            setSelectedZone(availableZones[0]);
        }
    }, [availableZones, selectedZone]);

    // Initialiser avec la première table de la zone
    useEffect(() => {
        if (availableTables.length > 0 && !selectedTable) {
            setSelectedTable(availableTables[0]);
        }
    }, [availableTables, selectedTable]);

    // Réinitialiser la table sélectionnée quand on change de zone
    useEffect(() => {
        if (selectedZone && availableTables.length > 0) {
            setSelectedTable(availableTables[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedZone]);

    const handleConfirm = () => {
        if (selectedTable) {
            onSelect(selectedTable);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
            {/* Modal */}
            <div className="bg-white rounded-t-3xl w-full max-w-lg animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <button
                        onClick={onClose}
                        className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold text-gray-900">
                        Sélectionner votre table
                    </h2>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedTable}
                        className="p-2 -mr-2 text-[#003058] hover:text-[#002040] disabled:opacity-50"
                    >
                        <Check className="w-6 h-6" />
                    </button>
                </div>

                {/* Picker Content */}
                <div className="px-6 py-8">
                    <div className="flex gap-4">
                        {/* Zone Picker */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-500 mb-3 text-center">
                                Zone
                            </label>
                            <div className="relative h-48 overflow-hidden">
                                {/* Gradient overlays */}
                                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

                                {/* Selection highlight */}
                                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-12 bg-gray-100 rounded-xl pointer-events-none" />

                                {/* Scrollable list */}
                                <div className="h-full overflow-y-auto scroll-snap-y scrollbar-hide py-[4.5rem]">
                                    {availableZones.map((zone) => (
                                        <button
                                            key={zone.id}
                                            onClick={() => setSelectedZone(zone)}
                                            className={`w-full h-12 flex items-center justify-center scroll-snap-center transition-all ${
                                                selectedZone?.id === zone.id
                                                    ? 'text-[#003058] font-bold text-xl'
                                                    : 'text-gray-400 font-medium text-base'
                                            }`}
                                        >
                                            {zone.prefix}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Table Number Picker */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-500 mb-3 text-center">
                                Numéro
                            </label>
                            <div className="relative h-48 overflow-hidden">
                                {/* Gradient overlays */}
                                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
                                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

                                {/* Selection highlight */}
                                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-12 bg-gray-100 rounded-xl pointer-events-none" />

                                {/* Scrollable list */}
                                <div className="h-full overflow-y-auto scroll-snap-y scrollbar-hide py-[4.5rem]">
                                    {availableTables.map((table) => (
                                        <button
                                            key={table.id}
                                            onClick={() => setSelectedTable(table)}
                                            className={`w-full h-12 flex items-center justify-center scroll-snap-center transition-all ${
                                                selectedTable?.id === table.id
                                                    ? 'text-[#003058] font-bold text-xl'
                                                    : 'text-gray-400 font-medium text-base'
                                            }`}
                                        >
                                            {table.table_number.padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Selected Table Display */}
                    {selectedTable && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500">Table sélectionnée</p>
                            <p className="text-3xl font-black text-[#003058] mt-1">
                                {selectedTable.display_name}
                            </p>
                        </div>
                    )}
                </div>

                {/* Confirm Button */}
                <div className="px-6 pb-8">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedTable}
                        className="w-full py-4 bg-[#003058] text-white font-bold rounded-2xl hover:bg-[#002040] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Confirmer la table {selectedTable?.display_name}
                    </button>
                </div>
            </div>

            {/* Animation styles */}
            <style jsx>{`
                @keyframes slide-up {
                    from {
                        transform: translateY(100%);
                    }
                    to {
                        transform: translateY(0);
                    }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s ease-out;
                }
                .scroll-snap-y {
                    scroll-snap-type: y mandatory;
                }
                .scroll-snap-center {
                    scroll-snap-align: center;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
