"use client";

import { useState, useEffect } from "react";
import {
    X,
    Banknote,
    CreditCard,
    QrCode,
    Clock,
    Printer,
    Check,
    Calculator,
    ArrowLeftRight
} from "lucide-react";
import { toast } from "react-hot-toast";

type CartItem = {
    id: string;
    name: string;
    price: number;
    quantity: number;
};

type PaymentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    orderNumber: number;
    total: number;
    items: CartItem[];
    onPaymentComplete: () => void;
};

type PaymentMethod = "cash" | "card" | "mobile" | "due";

// Taux de change simulés (à remplacer par une API réelle)
const EXCHANGE_RATES = {
    XAF: 1,
    EUR: 655.957,
    USD: 600,
    GBP: 780
};

export default function PaymentModal({
    isOpen,
    onClose,
    orderNumber,
    total,
    items,
    onPaymentComplete
}: PaymentModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
    const [paymentType, setPaymentType] = useState<"full" | "split">("full");
    const [inputAmount, setInputAmount] = useState("");
    const [amountPaid, setAmountPaid] = useState(0);
    const [showCalculator, setShowCalculator] = useState(false);
    const [showConverter, setShowConverter] = useState(false);
    const [converterAmount, setConverterAmount] = useState("");
    const [converterFrom, setConverterFrom] = useState<keyof typeof EXCHANGE_RATES>("EUR");
    const [converterTo, setConverterTo] = useState<keyof typeof EXCHANGE_RATES>("XAF");

    // Reset on open and handle Scroll Lock
    useEffect(() => {
        if (isOpen) {
            setInputAmount("");
            setAmountPaid(0);
            setPaymentMethod("cash");
            setPaymentType("full");
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    const dueAmount = Math.max(0, total - amountPaid);
    const change = amountPaid > total ? amountPaid - total : 0;

    const handleNumberClick = (num: string) => {
        if (num === "x") {
            setInputAmount(prev => prev.slice(0, -1));
        } else if (num === ".") {
            if (!inputAmount.includes(".")) {
                setInputAmount(prev => prev + num);
            }
        } else {
            setInputAmount(prev => prev + num);
        }
    };

    const handleQuickAmount = (amount: number) => {
        setInputAmount(amount.toString());
    };

    const applyAmount = () => {
        const amount = parseFloat(inputAmount) || 0;
        setAmountPaid(prev => prev + amount);
        setInputAmount("");
    };

    const completePayment = () => {
        if (dueAmount > 0 && paymentMethod !== "due") {
            toast.error("Le montant payé est insuffisant");
            return;
        }

        toast.success(`Paiement de ${total.toLocaleString()} FCFA confirmé !`);
        onPaymentComplete();
        onClose();
    };

    // Currency converter
    const convertCurrency = () => {
        const amount = parseFloat(converterAmount) || 0;
        const fromRate = EXCHANGE_RATES[converterFrom];
        const toRate = EXCHANGE_RATES[converterTo];
        const result = (amount * fromRate) / toRate;
        return result.toFixed(2);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                            <Banknote className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Encaissement</h2>
                            <p className="text-xs text-gray-500">Commande #{orderNumber}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-orange-500">{total.toLocaleString()} <span className="text-sm">FCFA</span></p>
                    </div>
                </div>

                {/* Payment Type Toggle */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setPaymentType("full")}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${paymentType === "full"
                                    ? "bg-orange-500 text-white shadow"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Paiement complet
                        </button>
                        <button
                            onClick={() => setPaymentType("split")}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${paymentType === "split"
                                    ? "bg-orange-500 text-white shadow"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                        >
                            Partager l'addition
                        </button>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="p-4 border-b border-gray-100">
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { id: "cash", icon: Banknote, label: "Espèces" },
                            { id: "card", icon: CreditCard, label: "Carte" },
                            { id: "mobile", icon: QrCode, label: "Mobile" },
                            { id: "due", icon: Clock, label: "À crédit" }
                        ].map(method => (
                            <button
                                key={method.id}
                                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${paymentMethod === method.id
                                        ? "bg-[#003058] text-white border-[#003058]"
                                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                    }`}
                            >
                                <method.icon className="w-5 h-5" />
                                <span className="text-[10px] font-medium">{method.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Amount Input */}
                <div className="p-4 border-b border-gray-100">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <input
                            type="text"
                            value={inputAmount}
                            readOnly
                            placeholder="0"
                            className="w-full text-3xl font-black text-center bg-transparent outline-none text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Montant reçu</p>
                    </div>

                    {/* Quick amounts */}
                    <div className="flex gap-2 mt-3">
                        {[5000, 10000, 25000, total].map(amount => (
                            <button
                                key={amount}
                                onClick={() => handleQuickAmount(amount)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                            >
                                {amount === total ? "Exact" : `${(amount / 1000).toFixed(0)}k`}
                            </button>
                        ))}
                    </div>

                    {/* Calculator */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "x"].map(key => (
                            <button
                                key={key}
                                onClick={() => handleNumberClick(key)}
                                className={`py-3 rounded-xl text-lg font-bold transition-all ${key === "x"
                                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                    }`}
                            >
                                {key === "x" ? "⌫" : key}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total à payer</span>
                        <span className="font-bold text-gray-900">{total.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Montant reçu</span>
                        <span className="font-bold text-gray-900">{(amountPaid + (parseFloat(inputAmount) || 0)).toLocaleString()} FCFA</span>
                    </div>
                    {change > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Monnaie à rendre</span>
                            <span className="font-bold text-emerald-600">{change.toLocaleString()} FCFA</span>
                        </div>
                    )}
                    {dueAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-red-500 font-medium">Reste à payer</span>
                            <span className="font-bold text-red-500">{dueAmount.toLocaleString()} FCFA</span>
                        </div>
                    )}
                </div>

                {/* Tools */}
                <div className="px-4 py-2 border-t border-gray-100 flex gap-2">
                    <button
                        onClick={() => setShowConverter(!showConverter)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200"
                    >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        Convertisseur
                    </button>
                    <button
                        onClick={() => setShowCalculator(!showCalculator)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200"
                    >
                        <Calculator className="w-3.5 h-3.5" />
                        Calculatrice
                    </button>
                </div>

                {/* Currency Converter */}
                {showConverter && (
                    <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                        <p className="text-xs font-bold text-blue-800 mb-2">Convertisseur de devises</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={converterAmount}
                                onChange={(e) => setConverterAmount(e.target.value)}
                                placeholder="Montant"
                                className="flex-1 px-3 py-2 rounded-lg border border-blue-200 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <select
                                value={converterFrom}
                                onChange={(e) => setConverterFrom(e.target.value as keyof typeof EXCHANGE_RATES)}
                                className="px-2 py-2 rounded-lg border border-blue-200 text-sm outline-none bg-white"
                            >
                                {Object.keys(EXCHANGE_RATES).map(cur => (
                                    <option key={cur} value={cur}>{cur}</option>
                                ))}
                            </select>
                            <span className="text-gray-400">→</span>
                            <select
                                value={converterTo}
                                onChange={(e) => setConverterTo(e.target.value as keyof typeof EXCHANGE_RATES)}
                                className="px-2 py-2 rounded-lg border border-blue-200 text-sm outline-none bg-white"
                            >
                                {Object.keys(EXCHANGE_RATES).map(cur => (
                                    <option key={cur} value={cur}>{cur}</option>
                                ))}
                            </select>
                        </div>
                        {converterAmount && (
                            <p className="text-sm font-bold text-blue-800 mt-2 text-center">
                                {converterAmount} {converterFrom} = {convertCurrency()} {converterTo}
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="p-4 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={completePayment}
                        disabled={dueAmount > 0 && paymentMethod !== "due"}
                        className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Check className="w-4 h-4" />
                        Valider
                    </button>
                </div>
            </div>

            {/* Animation */}
            <style jsx>{`
                @keyframes scale-up {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                .animate-scale-up {
                    animation: scale-up 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}
