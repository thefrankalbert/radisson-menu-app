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
};

type DataTableProps<T> = {
    columns: Column<T>[];
    data: T[];
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
};

export default function DataTable<T extends Record<string, any>>({
    columns,
    data,
    onEdit,
    onDelete,
    isLoading = false,
    emptyMessage = "Aucune donnée trouvée",
}: DataTableProps<T>) {
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

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
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#C5A065] transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-11 bg-white border border-[#F5F5F5] rounded-xl pl-11 pr-4 text-sm font-bold text-[#003058] focus:ring-2 focus:ring-[#C5A065]/20 focus:border-[#C5A065]/30 transition-all outline-none"
                    />
                </div>

                <div className="flex items-center space-x-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Afficher</label>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="h-11 bg-white border border-[#F5F5F5] rounded-xl px-3 text-xs font-bold text-[#003058] outline-none"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {/* Table Body */}
            <div className="bg-white rounded-[2rem] border border-[#F5F5F5] overflow-hidden shadow-sm relative min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#F5F5F5]/50 border-b border-[#F5F5F5]">
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => col.sortable !== false && handleSort(col.key)}
                                        className={cn(
                                            "px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 select-none",
                                            col.sortable !== false ? "cursor-pointer hover:text-[#003058] transition-colors" : ""
                                        )}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <span>{col.label}</span>
                                            {sortKey === col.key && (
                                                sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                                {(onEdit || onDelete) && <th className="px-8 py-5"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F5F5]">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
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
                                        className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        {columns.map((col) => (
                                            <td key={col.key} className="px-8 py-6 text-sm font-bold text-[#003058]">
                                                {col.render ? col.render(row[col.key], row) : row[col.key]}
                                            </td>
                                        ))}
                                        {(onEdit || onDelete) && (
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {onEdit && (
                                                        <button
                                                            onClick={() => onEdit(row)}
                                                            className="p-2 text-slate-400 hover:text-[#003058] hover:bg-[#F5F5F5] rounded-lg transition-all"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(row)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length + 1} className="px-8 py-20 text-center">
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
                        <Loader2 className="w-10 h-10 text-[#C5A065] animate-spin" />
                    </div>
                )}
            </div>

            {/* Pagination Bar */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Affichage {Math.min(paginatedData.length, itemsPerPage)} sur {filteredData.length} résultats
                    </p>
                    <div className="flex items-center space-x-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 border border-[#F5F5F5] rounded-xl hover:bg-white disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5 text-[#003058]" />
                        </button>
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={cn(
                                        "w-10 h-10 rounded-xl text-xs font-black transition-all",
                                        currentPage === i + 1
                                            ? "bg-[#003058] text-white shadow-lg shadow-blue-900/20 scale-110"
                                            : "bg-white text-slate-400 border border-[#F5F5F5] hover:border-[#003058]/30"
                                    )}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="p-2 border border-[#F5F5F5] rounded-xl hover:bg-white disabled:opacity-30 transition-all shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5 text-[#003058]" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
