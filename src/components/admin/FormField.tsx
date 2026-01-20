"use client";

import { cn } from "@/lib/utils";

type FormFieldProps = {
    label: string;
    name: string;
    type: 'text' | 'number' | 'textarea' | 'select' | 'file' | 'toggle';
    value: any;
    onChange: (value: any) => void;
    options?: Array<{ value: string; label: string }>;
    error?: string;
    required?: boolean;
    placeholder?: string;
    className?: string;
};

export default function FormField({
    label,
    name,
    type,
    value,
    onChange,
    options = [],
    error,
    required = false,
    placeholder,
    className
}: FormFieldProps) {
    const baseInputClasses = cn(
        "w-full bg-[#F5F5F5] border-2 border-transparent rounded-2xl px-5 transition-all outline-none font-bold text-[#003058] placeholder:text-slate-400 placeholder:font-medium focus:bg-white focus:border-[#C5A065]/20",
        error ? "border-red-500 bg-red-50/50" : ""
    );

    return (
        <div className={cn("space-y-2 group", className)}>
            <label className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-[#C5A065]">
                <span>{label}</span>
                {required && <span className="text-red-500 text-xs">*</span>}
            </label>

            {type === 'textarea' ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className={cn(baseInputClasses, "py-4 resize-none")}
                />
            ) : type === 'select' ? (
                <select
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(baseInputClasses, "h-14 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23003058%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat")}
                >
                    {placeholder && <option value="" disabled>{placeholder}</option>}
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : type === 'toggle' ? (
                <button
                    type="button"
                    onClick={() => onChange(!value)}
                    className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors duration-300 ml-4",
                        value ? "bg-[#C5A065]" : "bg-slate-200"
                    )}
                >
                    <div className={cn(
                        "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                        value ? "translate-x-6" : "translate-x-0"
                    )} />
                </button>
            ) : type === 'file' ? (
                <div className="relative group">
                    <input
                        type="file"
                        onChange={(e) => onChange(e.target.files?.[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn(baseInputClasses, "h-32 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-2 group-hover:border-[#C5A065]/40 transition-all")}>
                        <span className="text-3xl">📁</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Choisir un fichier</span>
                        <span className="text-[10px] text-slate-300">{value?.name || "Aucun fichier sélectionné"}</span>
                    </div>
                </div>
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={cn(baseInputClasses, "h-14")}
                />
            )}

            {error && (
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4 mt-1 italic animate-bounce">
                    {error}
                </p>
            )}
        </div>
    );
}
