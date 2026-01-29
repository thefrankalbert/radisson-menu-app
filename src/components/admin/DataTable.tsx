"use client";

import { useState, useMemo, ReactNode } from "react";
import {
    ChevronDown,
    ChevronUp,
    Search,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

type Column<T> = {
    key: string;
    label: string;
    render?: (value: any, row: T) => ReactNode;
    sortable?: boolean;
    maxWidth?: number; // Max width in pixels for truncation
};

type DataTableProps<T> = {
    columns: Column<T>[];
    data: T[];
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
    selectable?: boolean;
    onSelectionChange?: (selectedIds: string[]) => void;
};

export default function DataTable<T extends Record<string, any>>({
    columns,
    data,
    onEdit,
    onDelete,
    isLoading = false,
    emptyMessage = "Aucune donnée trouvée",
    selectable = false,
    onSelectionChange,
}: DataTableProps<T>) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Filter & Search
    const filteredData = useMemo(() => {
        return data.filter((item) =>
            Object.values(item).some(
                (val) =>
                    val &&
                    val.toString().toLowerCase().includes(search.toLowerCase())
            )
        );
    }, [data, search]);

    // Selection Logic
    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedData.length) {
            const newSelection = selectedIds.filter(id => !paginatedData.some(item => item.id === id));
            setSelectedIds(newSelection);
            onSelectionChange?.(newSelection);
        } else {
            const newIds = Array.from(new Set([...selectedIds, ...paginatedData.map(item => item.id)]));
            setSelectedIds(newIds);
            onSelectionChange?.(newIds);
        }
    };

    const toggleSelect = (id: string) => {
        const newSelection = selectedIds.includes(id)
            ? selectedIds.filter(i => i !== id)
            : [...selectedIds, id];
        setSelectedIds(newSelection);
        onSelectionChange?.(newSelection);
    };

    // Sort
    const sortedData = useMemo(() => {
        if (!sortKey) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortKey];
            const bVal = b[sortKey];

            if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
            if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortKey, sortOrder]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortKey(key);
            setSortOrder("asc");
        }
    };

    return (
        <div className="w-full space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative group w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-9 bg-background border border-input rounded-md pl-9 pr-4 text-xs font-medium text-foreground focus:ring-1 focus:ring-ring focus:border-ring transition-all outline-none"
                    />
                </div>

                <div className="flex items-center space-x-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Afficher</label>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="h-9 bg-background border border-input rounded-md px-2 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {/* Table Body */}
            <div className="bg-card rounded-md border border-border overflow-hidden relative min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/50 border-b border-border">
                                {selectable && (
                                    <th className="px-6 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                            checked={paginatedData.length > 0 && paginatedData.every(item => selectedIds.includes(item.id))}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                )}
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => col.sortable !== false && handleSort(col.key)}
                                        className={cn(
                                            "px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none",
                                            col.sortable !== false ? "cursor-pointer hover:text-foreground transition-colors" : ""
                                        )}
                                    >
                                        <div className="flex items-center space-x-1.5">
                                            <span>{col.label}</span>
                                            {sortKey === col.key && (
                                                sortOrder === "asc" ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                                {(onEdit || onDelete) && <th className="px-6 py-4"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {selectable && <td className="px-6 py-4"><div className="w-3.5 h-3.5 bg-slate-100 rounded"></div></td>}
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-8 py-6">
                                                <div className="h-4 bg-slate-100 rounded-lg w-full"></div>
                                            </td>
                                        ))}
                                        <td className="px-8 py-6"></td>
                                    </tr>
                                ))
                            ) : paginatedData.length > 0 ? (
                                paginatedData.map((row, idx) => (
                                    <tr
                                        key={idx}
                                        className={cn(
                                            "hover:bg-accent/50 transition-colors group",
                                            selectedIds.includes(row.id) ? "bg-primary/5" : ""
                                        )}
                                    >
                                        {selectable && (
                                            <td className="px-6 py-4 w-10">
                                                <input
                                                    type="checkbox"
                                                    className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary/20 transition-all cursor-pointer"
                                                    checked={selectedIds.includes(row.id)}
                                                    onChange={() => toggleSelect(row.id)}
                                                />
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className="px-6 py-4 text-xs font-semibold text-foreground"
                                                style={col.maxWidth ? { maxWidth: col.maxWidth } : undefined}
                                            >
                                                <div className={cn(col.maxWidth ? "truncate" : "")}>
                                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                                </div>
                                            </td>
                                        ))}
                                        {(onEdit || onDelete) && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {onEdit && (
                                                        <button
                                                            onClick={() => onEdit(row)}
                                                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(row)}
                                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + (selectable ? 2 : 1)} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                            <Search className="w-12 h-12 mb-4 opacity-20" />
                                            <p className="font-bold italic">{emptyMessage}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                )}
            </div>

            {/* Pagination Bar */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Affichage {Math.min(paginatedData.length, itemsPerPage)} sur {filteredData.length} résultats
                    </p>
                    <div className="flex items-center space-x-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 border border-border rounded-md hover:bg-accent disabled:opacity-30 transition-all text-foreground"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={cn(
                                        "w-8 h-8 rounded-md text-xs font-bold transition-all",
                                        currentPage === i + 1
                                            ? "bg-primary text-primary-foreground border border-primary"
                                            : "bg-background text-muted-foreground border border-border hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 border border-border rounded-md hover:bg-accent disabled:opacity-30 transition-all text-foreground"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
