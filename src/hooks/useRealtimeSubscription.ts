import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { REQUEST_KEYS, BloodRequest } from './useRequests';
import { toast } from 'sonner';

interface RealtimeProps {
    userId?: string;
    userBloodType?: string;
    enabled?: boolean;
}

export const useRealtimeSubscription = ({ userId, userBloodType, enabled = true }: RealtimeProps) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!enabled || !supabase) return;

        // Channel for Blood Requests
        const channel = supabase
            .channel('db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'blood_requests',
                },
                (payload) => {
                    const newRequest = payload.new as BloodRequest;

                    // Invalidate all requests query to show new item
                    queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.all });

                    // Auto-Matching Notification
                    // If the new request is NOT from me, and matches my blood type
                    if (
                        userId &&
                        userBloodType &&
                        newRequest.donor_id !== userId &&
                        isCompatible(userBloodType, newRequest.blood_type)
                    ) {
                        toast.info('New Blood Request Match!', {
                            description: `${newRequest.recipient_name} needs ${newRequest.blood_type} blood near you.`,
                            action: {
                                label: 'View',
                                onClick: () => window.location.href = '/dashboard' // Adjust route as needed
                            }
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'blood_requests',
                },
                (payload) => {
                    // Invalidate queries to update status in UI
                    queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.all });

                    const updatedRequest = payload.new as BloodRequest;
                    // If this is MY request that got updated
                    if (userId && updatedRequest.donor_id === userId) {
                        queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.byDonor(userId) });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'request_responses',
                },
                (payload) => {
                    // Someone responded to a request
                    // We can't easily filter by "my request" here without joining, 
                    // so we invalidate the specific query for responses causing a refetch.
                    // Also invalidate my requests to potentially show "Responses: X" count if we had that.

                    // For now, just generic invalidation for safety
                    queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.all });
                    if (userId) {
                        queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.byDonor(userId) });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [enabled, userId, userBloodType, queryClient]);
};

// Helper for compatibility (duplicate logic, ideally shared)
// Helper for compatibility (Strict matching as requested)
const isCompatible = (donorType: string, recipientType: string): boolean => {
    const dt = donorType.replace('_', '').replace('positive', '+').replace('negative', '-');
    const rt = recipientType.replace('_', '').replace('positive', '+').replace('negative', '-');

    return dt === rt;
};
