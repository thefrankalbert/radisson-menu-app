"use client";

interface Category {
    id: string;
    fr: string;
    en: string;
    icon: string;
    dbTerm: string;
}

interface CategoryGridProps {
    categories: Category[];
    language: 'fr' | 'en';
    onCategoryClick: (dbTerm: string) => void;
}

export default function CategoryGrid({
    categories,
    language,
    onCategoryClick,
}: CategoryGridProps) {
    return (
        <div className="mb-10">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-gray-800 tracking-tight">
                    {language === 'fr' ? "Explorez nos saveurs" : "Explore our flavors"}
                </h2>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {categories.map((cat, idx) => {
                    const label = language === 'en' ? cat.en : cat.fr;
                    // Add line breaks for specific labels
                    const formattedLabel = label === "Pour commencer" ? "Pour\ncommencer" :
                        label === "Burgers Signatures" ? "Burgers\nSignatures" :
                            label === "Saveurs d'Afrique" ? "Saveurs\nd'Afrique" : label;

                    return (
                        <div
                            key={cat.id}
                            className="text-center cursor-pointer group animate-fade-in-up opacity-0 [animation-fill-mode:forwards]"
                            style={{ animationDelay: `${idx * 50}ms` }}
                            onClick={() => onCategoryClick(cat.dbTerm)}
                        >
                            {/* Outer circle container */}
                            <div className="w-[80px] h-[80px] mx-auto rounded-full bg-white/80 p-1 mb-2.5 transition-all duration-150 group-hover:scale-[1.05]">
                                {/* Inner circle with icon */}
                                <div className="w-full h-full rounded-full category-icon-circle flex items-center justify-center border border-gray-100/50">
                                    <span className="text-[28px]">{cat.icon}</span>
                                </div>
                            </div>
                            <p className="text-[11px] font-medium text-gray-600 leading-tight whitespace-pre-line">
                                {formattedLabel}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
