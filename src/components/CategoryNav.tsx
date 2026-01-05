"use client";

import React from "react";

interface Category {
    id: string;
    name: string;
}

interface CategoryNavProps {
    categories: Category[];
}

export default function CategoryNav({ categories }: CategoryNavProps) {
    const [activeCategory, setActiveCategory] = React.useState<string>("");
    const navRef = React.useRef<HTMLDivElement>(null);
    const buttonRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

    // Sync horizontal scroll when active category changes
    React.useEffect(() => {
        if (activeCategory && buttonRefs.current.has(activeCategory)) {
            const activeButton = buttonRefs.current.get(activeCategory);
            if (activeButton && navRef.current) {
                activeButton.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    }, [activeCategory]);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id.replace("cat-", "");
                        setActiveCategory(id);
                    }
                });
            },
            {
                rootMargin: "-20% 0px -60% 0px",
                threshold: 0.1
            }
        );

        categories.forEach((category) => {
            const element = document.getElementById(`cat-${category.id}`);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [categories]);

    const scrollToCategory = (id: string) => {
        setActiveCategory(id);
        const element = document.getElementById(`cat-${id}`);
        if (element) {
            const offset = 130;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

    return (
        <div ref={navRef} className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm overflow-x-auto no-scrollbar py-3 transition-all duration-300">
            <div className="max-w-3xl lg:max-w-5xl mx-auto px-6 flex gap-2 md:gap-4 min-w-max">
                {categories.map((category) => {
                    const isActive = activeCategory === category.id;
                    return (
                        <button
                            key={category.id}
                            ref={(el) => {
                                if (el) {
                                    buttonRefs.current.set(category.id, el);
                                } else {
                                    buttonRefs.current.delete(category.id);
                                }
                            }}
                            onClick={() => scrollToCategory(category.id)}
                            className={`
                                whitespace-nowrap px-4 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-soft border active:scale-95
                                ${isActive
                                    ? "bg-radisson-blue text-radisson-gold border-radisson-blue scale-105"
                                    : "bg-white text-gray-400 border-gray-100 hover:border-radisson-gold hover:text-radisson-blue"
                                }
                            `}
                        >
                            {category.name}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
