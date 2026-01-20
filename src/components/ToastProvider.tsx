"use client";

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
                // Durée par défaut
                duration: 4000,

                // Style par défaut
                style: {
                    background: '#003366', // Radisson Blue
                    color: '#fff',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 10px 40px rgba(0, 51, 102, 0.3)',
                    maxWidth: '500px',
                },

                // Styles pour les succès
                success: {
                    duration: 6000,
                    style: {
                        background: '#10b981', // Vert élégant
                        color: '#fff',
                    },
                    iconTheme: {
                        primary: '#fff',
                        secondary: '#10b981',
                    },
                },

                // Styles pour les erreurs
                error: {
                    duration: 5000,
                    style: {
                        background: '#ef4444', // Rouge élégant
                        color: '#fff',
                    },
                    iconTheme: {
                        primary: '#fff',
                        secondary: '#ef4444',
                    },
                },

                // Styles pour les chargements
                loading: {
                    style: {
                        background: '#003366',
                        color: '#D4AF37', // Or Radisson
                    },
                },
            }}
        />
    );
}
