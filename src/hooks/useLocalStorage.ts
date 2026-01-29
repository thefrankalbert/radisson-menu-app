"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Type-safe localStorage hook with SSR support
 * @param key - localStorage key
 * @param initialValue - default value if key doesn't exist
 * @param validator - optional validation function for parsed data
 */
export function useLocalStorage<T>(
    key: string,
    initialValue: T,
    validator?: (value: unknown) => value is T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
    // Initialize with a function to avoid SSR issues
    const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            if (!item) return initialValue;

            const parsed = JSON.parse(item);

            // If validator provided, use it
            if (validator) {
                return validator(parsed) ? parsed : initialValue;
            }

            return parsed as T;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Update localStorage when state changes
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            if (storedValue === null || storedValue === undefined) {
                window.localStorage.removeItem(key);
            } else {
                window.localStorage.setItem(key, JSON.stringify(storedValue));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    // Setter function that handles both direct values and updater functions
    const setValue = useCallback((value: T | ((prev: T) => T)) => {
        setStoredValue((prev) => {
            const nextValue = value instanceof Function ? value(prev) : value;
            return nextValue;
        });
    }, []);

    // Remove function to clear the key
    const removeValue = useCallback(() => {
        setStoredValue(initialValue);
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(key);
        }
    }, [key, initialValue]);

    return [storedValue, setValue, removeValue];
}

/**
 * Simple localStorage getter with validation (non-reactive)
 */
export function getLocalStorageItem<T>(
    key: string,
    defaultValue: T,
    validator?: (value: unknown) => value is T
): T {
    if (typeof window === "undefined") return defaultValue;

    try {
        const item = window.localStorage.getItem(key);
        if (!item) return defaultValue;

        const parsed = JSON.parse(item);
        if (validator) {
            return validator(parsed) ? parsed : defaultValue;
        }
        return parsed as T;
    } catch {
        return defaultValue;
    }
}

/**
 * Simple localStorage setter (non-reactive)
 */
export function setLocalStorageItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
        if (value === null || value === undefined) {
            window.localStorage.removeItem(key);
        } else {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
    } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
    }
}

/**
 * Remove localStorage item
 */
export function removeLocalStorageItem(key: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
}
