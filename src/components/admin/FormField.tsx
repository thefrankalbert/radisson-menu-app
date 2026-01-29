"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type FormFieldProps = {
    label: string;
    name: string;
    type: 'text' | 'number' | 'textarea' | 'select' | 'file' | 'toggle' | 'date';
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
    const { t } = useLanguage();

    const baseInputClasses = cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-destructive focus-visible:ring-destructive" : "focus-visible:border-primary/50",
        "font-sans"
    );

    return (
        <div className={cn("grid w-full items-center gap-1.5", className)}>
            <label
                htmlFor={name}
                className="text-xs font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase tracking-wider text-muted-foreground/80 ml-1"
            >
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </label>

            {type === 'textarea' ? (
                <textarea
                    id={name}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className={cn(baseInputClasses, "h-auto py-2 resize-none")}
                />
            ) : type === 'select' ? (
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger
                        id={name}
                        className={cn(
                            "w-full h-9 text-sm font-medium",
                            error ? "border-destructive focus:ring-destructive" : ""
                        )}
                    >
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : type === 'toggle' ? (
                <button
                    type="button"
                    id={name}
                    onClick={() => onChange(!value)}
                    className={cn(
                        "w-8 h-4 rounded-full p-0.5 transition-all duration-200 ease-in-out relative border border-transparent self-start mt-1",
                        value ? "bg-primary" : "bg-muted border-border"
                    )}
                >
                    <div className={cn(
                        "w-3 h-3 bg-background rounded-full transition-all duration-200 shadow-sm",
                        value ? "translate-x-4" : "translate-x-0"
                    )} />
                </button>
            ) : type === 'file' ? (
                <div className="relative group">
                    <input
                        id={name}
                        type="file"
                        onChange={(e) => onChange(e.target.files?.[0])}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={cn(baseInputClasses, "h-16 border-dashed border-2 bg-muted/20 flex flex-col items-center justify-center space-y-1 group-hover:bg-muted/40 transition-all")}>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('upload_image') || 'Cliquez pour uploader'}</span>
                        {value?.name && <span className="text-[10px] text-foreground font-semibold bg-primary/10 px-2 py-0.5 rounded-sm">{value.name}</span>}
                    </div>
                </div>
            ) : (
                <input
                    id={name}
                    type={type}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={baseInputClasses}
                />
            )}

            {error && (
                <p className="text-xs font-medium text-destructive mt-1">
                    {error}
                </p>
            )}
        </div>
    );
}
