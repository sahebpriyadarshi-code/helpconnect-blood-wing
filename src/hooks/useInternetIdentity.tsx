import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Mock Identity interface to match usage
interface Identity {
    getPrincipal: () => { toString: () => string };
    email?: string;
}

interface InternetIdentityContextType {
    identity: Identity | null;
    login: () => Promise<void>;
    logout: () => void;
    isLoggingIn: boolean;
}

const InternetIdentityContext = createContext<InternetIdentityContextType>({
    identity: null,
    login: async () => { },
    logout: () => { },
    isLoggingIn: false,
});

export const useInternetIdentity = () => useContext(InternetIdentityContext);

export const InternetIdentityProvider = ({ children }: { children: React.ReactNode }) => {
    const [identity, setIdentity] = useState<Identity | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(true); // Start true to check session

    useEffect(() => {
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setIdentity({
                    getPrincipal: () => ({ toString: () => session.user.id }),
                    email: session.user.email
                });
            }
            setIsLoggingIn(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setIdentity({
                    getPrincipal: () => ({ toString: () => session.user.id }),
                    email: session.user.email
                });
            } else {
                setIdentity(null);
            }
            setIsLoggingIn(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async () => {
        // Redirect to login page
        window.location.href = '/login';
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setIdentity(null);
    };

    return (
        <InternetIdentityContext.Provider value={{ identity, login, logout, isLoggingIn }}>
            {children}
        </InternetIdentityContext.Provider>
    );
};
