"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSwitch() {
    const { language, setLanguage } = useLanguage();
    const isEN = language === 'en';

    return (
        <div className="flex bg-[#F5F5F5] rounded-lg p-1">
            <button
                onClick={() => setLanguage('fr')}
                className={`px-3 py-1.5 rounded text-[10px] font-black tracking-tight transition-all ${!isEN ? 'bg-gray-900 text-white' : 'text-slate-400'}`}
            >
                FR
            </button>
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded text-[10px] font-black tracking-tight transition-all ${isEN ? 'bg-gray-900 text-white' : 'text-slate-400'}`}
            >
                EN
            </button>
        </div>
    );
}
