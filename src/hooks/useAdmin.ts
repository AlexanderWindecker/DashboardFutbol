'use client';

import { useState, useEffect } from 'react';

const ADMIN_STORAGE_KEY = 'fb_admin_key';
const DEFAULT_PIN = '1986'; // Puedes cambiarlo luego desde la configuración

export function useAdmin() {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const key = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (key === DEFAULT_PIN) {
            setIsAdmin(true);
        }
    }, []);

    const login = (pin: string) => {
        if (pin === DEFAULT_PIN) {
            localStorage.setItem(ADMIN_STORAGE_KEY, pin);
            setIsAdmin(true);
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
        setIsAdmin(false);
    };

    return { isAdmin, login, logout };
}
