"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TableWheelPickerProps {
    tables: string[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export default function TableWheelPicker({ tables, value, onChange, label = "Table" }: TableWheelPickerProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemHeight = 50; // Hauteur de chaque élément
    const visibleItems = 5; // Nombre d'éléments visibles
    const centerOffset = Math.floor(visibleItems / 2) * itemHeight;

    // Trouver l'index initial basé sur la valeur
    useEffect(() => {
        const index = tables.findIndex(t => t === value);
        if (index !== -1) {
            setSelectedIndex(index);
        }
    }, [value, tables]);

    // Mettre à jour la valeur quand l'index change
    useEffect(() => {
        if (tables[selectedIndex]) {
            onChange(tables[selectedIndex]);
        }
    }, [selectedIndex, tables, onChange]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 1 : -1;
        const newIndex = Math.max(0, Math.min(tables.length - 1, selectedIndex + delta));
        setSelectedIndex(newIndex);
    };

    const handleItemClick = (index: number) => {
        setSelectedIndex(index);
    };

    const scrollToIndex = (index: number) => {
        if (containerRef.current) {
            const scrollTop = index * itemHeight - centerOffset;
            containerRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        scrollToIndex(selectedIndex);
    }, [selectedIndex]);

    return (
        <div className="w-full">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                {label}
            </label>
            <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Overlay avec lignes de sélection */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    {/* Ligne du haut */}
                    <div className="absolute top-[100px] left-0 right-0 h-[1px] bg-gray-300" />
                    {/* Zone de sélection centrale */}
                    <div className="absolute top-[100px] left-0 right-0 h-[50px] bg-blue-50/30 border-y-2 border-blue-400/50" />
                    {/* Ligne du bas */}
                    <div className="absolute top-[150px] left-0 right-0 h-[1px] bg-gray-300" />
                </div>

                {/* Conteneur scrollable */}
                <div
                    ref={containerRef}
                    onWheel={handleWheel}
                    className="overflow-hidden h-[250px] relative"
                >
                    {/* Padding top pour centrer */}
                    <div style={{ height: `${centerOffset}px` }} />

                    {/* Liste des tables */}
                    {tables.map((table, index) => {
                        const distance = Math.abs(index - selectedIndex);
                        const isSelected = index === selectedIndex;
                        const scale = isSelected ? 1 : 1 - distance * 0.1;
                        const opacity = isSelected ? 1 : 0.5 - distance * 0.2;

                        return (
                            <div
                                key={table}
                                onClick={() => handleItemClick(index)}
                                className="flex items-center justify-center cursor-pointer transition-all duration-200"
                                style={{
                                    height: `${itemHeight}px`,
                                    transform: `scale(${Math.max(0.7, scale)})`,
                                    opacity: Math.max(0.3, opacity),
                                    scrollSnapAlign: 'center',
                                }}
                            >
                                <span
                                    className={`font-mono font-bold text-center transition-all ${
                                        isSelected
                                            ? 'text-[#002C5F] text-xl'
                                            : 'text-gray-400 text-base'
                                    }`}
                                >
                                    {table}
                                </span>
                            </div>
                        );
                    })}

                    {/* Padding bottom pour centrer */}
                    <div style={{ height: `${centerOffset}px` }} />
                </div>

                {/* Boutons de navigation (optionnels) */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
                    <button
                        type="button"
                        onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
                        className="p-1 rounded bg-white/80 hover:bg-white border border-gray-200 shadow-sm"
                        disabled={selectedIndex === 0}
                    >
                        <ChevronUp size={16} className={selectedIndex === 0 ? 'text-gray-300' : 'text-gray-600'} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedIndex(Math.min(tables.length - 1, selectedIndex + 1))}
                        className="p-1 rounded bg-white/80 hover:bg-white border border-gray-200 shadow-sm"
                        disabled={selectedIndex === tables.length - 1}
                    >
                        <ChevronDown size={16} className={selectedIndex === tables.length - 1 ? 'text-gray-300' : 'text-gray-600'} />
                    </button>
                </div>
            </div>
        </div>
    );
}
