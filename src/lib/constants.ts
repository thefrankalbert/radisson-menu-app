/**
 * Radisson Blu Design System Constants
 * Centralized design tokens for consistent styling
 */

// Brand Colors
export const COLORS = {
    // Primary Radisson Palette
    radisson: {
        blue: '#003058',
        blueHover: '#00428C',
        blueDark: '#002040',
        gold: '#C5A065',
        goldHover: '#b08e5a',
        goldLight: '#D4B87A',
    },
    // UI Colors
    ui: {
        white: '#FFFFFF',
        background: '#F5F5F5',
        border: '#F5F5F5',
        borderDark: '#E5E5E5',
    },
    // Status Colors
    status: {
        success: '#22C55E',
        warning: '#EAB308',
        error: '#EF4444',
        info: '#3B82F6',
    },
    // Text Colors
    text: {
        primary: '#111827',
        secondary: '#6B7280',
        muted: '#9CA3AF',
        inverse: '#FFFFFF',
    },
    // Dark Mode (KDS)
    dark: {
        background: '#000000',
        surface: '#18181B',
        border: '#27272A',
        text: '#FAFAFA',
        textMuted: '#71717A',
    },
} as const;

// Spacing Scale (in Tailwind units / pixels)
export const SPACING = {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem',   // 48px
} as const;

// Border Radius
export const RADIUS = {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '2.5rem', // 40px
    full: '9999px',
} as const;

// Typography
export const TYPOGRAPHY = {
    fontFamily: {
        sans: 'var(--font-inter), system-ui, sans-serif',
        mono: 'ui-monospace, monospace',
    },
    fontSize: {
        xs: '0.625rem',  // 10px
        sm: '0.75rem',   // 12px
        base: '0.875rem', // 14px
        lg: '1rem',      // 16px
        xl: '1.25rem',   // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '2rem',   // 32px
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        black: '900',
    },
    letterSpacing: {
        tight: '-0.025em',
        normal: '0',
        wide: '0.05em',
        wider: '0.1em',
        widest: '0.15em',
    },
} as const;

// Z-Index Scale
export const Z_INDEX = {
    dropdown: 50,
    sticky: 100,
    modal: 200,
    toast: 300,
} as const;

// Animation Durations
export const ANIMATION = {
    fast: 150,
    normal: 300,
    slow: 500,
} as const;

// Framer Motion Presets
export const MOTION = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
    },
    spring: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
    },
} as const;

// Order Status Configuration
export const ORDER_STATUS = {
    pending: {
        label: 'En attente',
        labelEn: 'Pending',
        color: 'amber',
        bgClass: 'bg-amber-100/50',
        textClass: 'text-amber-700',
    },
    preparing: {
        label: 'En préparation',
        labelEn: 'Preparing',
        color: 'blue',
        bgClass: 'bg-blue-100/50',
        textClass: 'text-blue-700',
    },
    ready: {
        label: 'Prêt',
        labelEn: 'Ready',
        color: 'emerald',
        bgClass: 'bg-emerald-100/50',
        textClass: 'text-emerald-700',
    },
    delivered: {
        label: 'Servi',
        labelEn: 'Delivered',
        color: 'gray',
        bgClass: 'bg-gray-100/50',
        textClass: 'text-gray-600',
    },
    cancelled: {
        label: 'Annulé',
        labelEn: 'Cancelled',
        color: 'red',
        bgClass: 'bg-red-100/50',
        textClass: 'text-red-600',
    },
} as const;

// Currency
export const CURRENCY = {
    code: 'XAF',
    symbol: 'FCFA',
    locale: 'fr-FR',
} as const;

// App Configuration
export const APP_CONFIG = {
    name: 'Blu Table',
    hotel: 'Radisson Blu N\'Djamena',
    maxTableNumberLength: 10,
    orderHistoryKey: 'order_history',
    cartKey: 'cart',
    cartRestaurantKey: 'cart_restaurant_id',
    lastMenuKey: 'radisson_last_menu',
} as const;
