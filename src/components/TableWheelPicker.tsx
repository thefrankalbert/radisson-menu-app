"use client";

import { useState, useEffect, useRef } from "react";

interface TableWheelPickerProps {
    tables: string[];
    value: string;
    onChange: (value: string) => void;
    label?: string;
}

export default function TableWheelPicker({ tables, value, onChange, label = "Table" }: TableWheelPickerProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemHeight = 44; // Hauteur de chaque élément (style iOS)
    const visibleItems = 5; // Nombre d'éléments visibles
    const centerOffset = Math.floor(visibleItems / 2) * itemHeight;
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [scrollOffset, setScrollOffset] = useState(0);

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

    // Gestion du touch pour mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY;
        const deltaIndex = Math.round(deltaY / itemHeight);
        const newIndex = Math.max(0, Math.min(tables.length - 1, selectedIndex + deltaIndex));
        if (newIndex !== selectedIndex) {
            setSelectedIndex(newIndex);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
    };

    return (
        <div className="w-full">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                {label}
            </label>
            <div className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ minHeight: '220px' }}>
                {/* Zone de sélection centrale (style iOS) */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    <div 
                        className="absolute left-0 right-0 rounded-lg"
                        style={{
                            top: `${centerOffset}px`,
                            height: `${itemHeight}px`,
                            backgroundColor: 'rgba(0, 44, 95, 0.08)',
                            borderTop: '1px solid rgba(0, 44, 95, 0.15)',
                            borderBottom: '1px solid rgba(0, 44, 95, 0.15)',
                        }}
                    />
                </div>

                {/* Conteneur scrollable */}
                <div
                    ref={containerRef}
                    onWheel={handleWheel}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="overflow-y-scroll scrollbar-hide relative"
                    style={{ height: '220px', scrollSnapType: 'y mandatory' }}
                >
                    {/* Padding top pour centrer */}
                    <div style={{ height: `${centerOffset}px` }} />

                    {/* Liste des tables */}
                    {tables.map((table, index) => {
                        const distance = Math.abs(index - selectedIndex);
                        const isSelected = index === selectedIndex;
                        
                        // Calcul de l'opacité et de la taille selon la distance (style iOS)
                        let opacity = 1;
                        let fontSize = 21; // Taille de base iOS
                        let fontWeight = '600';
                        
                        if (distance === 0) {
                            // Élément sélectionné
                            opacity = 1;
                            fontSize = 21;
                            fontWeight = '600';
                        } else if (distance === 1) {
                            // Éléments adjacents
                            opacity = 0.4;
                            fontSize = 17;
                            fontWeight = '400';
                        } else {
                            // Éléments éloignés
                            opacity = 0.2;
                            fontSize = 15;
                            fontWeight = '400';
                        }

                        return (
                            <div
                                key={table}
                                onClick={() => handleItemClick(index)}
                                className="flex items-center justify-center cursor-pointer transition-all duration-150 select-none"
                                style={{
                                    height: `${itemHeight}px`,
                                    opacity: opacity,
                                    scrollSnapAlign: 'center',
                                }}
                            >
                                <span
                                    className={`font-sans text-center transition-all ${
                                        isSelected ? 'text-[#002C5F]' : 'text-gray-500'
                                    }`}
                                    style={{
                                        fontSize: `${fontSize}px`,
                                        fontWeight: fontWeight,
                                    }}
                                >
                                    {table}
                                </span>
                            </div>
                        );
                    })}

                    {/* Padding bottom pour centrer */}
                    <div style={{ height: `${centerOffset}px` }} />
                </div>
            </div>
        </div>
    );
}
