import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Real-time subscription helper
export const subscribeToRequests = (
    donorId: string,
    callback: (payload: any) => void
) => {
    const channel = supabase
        .channel('blood_requests_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'blood_requests',
                filter: `donor_id=eq.${donorId}`,
            },
            callback
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};
