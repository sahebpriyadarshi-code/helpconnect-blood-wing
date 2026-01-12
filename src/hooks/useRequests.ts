
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Types
export interface BloodRequest {
    id: string;
    donor_id: string;
    recipient_name: string;
    recipient_phone: string;
    blood_type: string;
    units_needed: number;
    urgency: 'critical' | 'high' | 'medium' | 'low';
    hospital_name: string;
    hospital_address: string;
    reason: string;
    state?: string;
    status: 'pending' | 'searching' | 'matched' | 'fulfilled' | 'cancelled' | 'discarded';
    created_at: string;
    updated_at: string;
}

// Query Keys
export const REQUEST_KEYS = {
    all: ['blood-requests'] as const,
    byDonor: (donorId: string) => [...REQUEST_KEYS.all, 'donor', donorId] as const,
    byId: (id: string) => [...REQUEST_KEYS.all, 'detail', id] as const,
    pending: () => [...REQUEST_KEYS.all, 'pending'] as const,
};

// Fetch all requests for a donor (authenticated user)
export const useGetDonorRequests = () => {
    return useQuery({
        queryKey: REQUEST_KEYS.byDonor('me'), // Use constant key for "my" requests
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return []; // Or throw error, but empty list is safer for UI

            const { data, error } = await supabase
                .from('blood_requests')
                .select('*')
                .eq('donor_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as BloodRequest[];
        },
        // Enable always, logic inside handles auth check
        enabled: true,
        staleTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
    });
};

// Fetch single request by ID
export const useGetRequestById = (requestId: string) => {
    return useQuery({
        queryKey: REQUEST_KEYS.byId(requestId),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('blood_requests')
                .select('*')
                .eq('id', requestId)
                .single();

            if (error) throw error;
            return data as BloodRequest;
        },
        enabled: !!requestId,
    });
};

// Create new blood request
export const useCreateBloodRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (requestData: Omit<BloodRequest, 'id' | 'created_at' | 'updated_at' | 'status' | 'donor_id'>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('blood_requests')
                .insert({
                    ...requestData,
                    donor_id: user.id,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (error) throw error;
            return data as BloodRequest;
        },
        onSuccess: (newRequest) => {
            // Invalidate all request queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.all });
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.all });
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.byDonor('me') });

            // Optimistically update the cache
            queryClient.setQueryData(
                REQUEST_KEYS.byDonor('me'),
                (old: BloodRequest[] = []) => [newRequest, ...old]
            );

            toast.success('Blood request created successfully!', {
                description: 'Your request is now being processed.',
            });
        },
        onError: (error: any) => {
            console.error('Error creating blood request:', error);
            toast.error('Failed to create blood request', {
                description: error.message || 'Please try again later.',
            });
        },
    });
};

// Update request status
export const useUpdateRequestStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            requestId,
            status
        }: {
            requestId: string;
            status: BloodRequest['status']
        }) => {
            const { data, error } = await supabase
                .from('blood_requests')
                .update({
                    status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', requestId)
                .select()
                .single();

            if (error) throw error;
            return data as BloodRequest;
        },
        onSuccess: (updatedRequest) => {
            // Invalidate and refetch
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.all });
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.byDonor(updatedRequest.donor_id) });
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.byId(updatedRequest.id) });

            toast.success('Request status updated successfully!');
        },
        onError: (error: any) => {
            console.error('Error updating request status:', error);
            toast.error('Failed to update request status', {
                description: error.message || 'Please try again later.',
            });
        },
    });
};

// Cancel request
export const useCancelRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (requestId: string) => {
            const { data, error } = await supabase
                .from('blood_requests')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', requestId)
                .select()
                .single();

            if (error) throw error;
            return data as BloodRequest;
        },
        onSuccess: (cancelledRequest) => {
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.all });
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.byDonor(cancelledRequest.donor_id) });

            toast.success('Request cancelled successfully');
        },
        onError: (error: any) => {
            console.error('Error cancelling request:', error);
            toast.error('Failed to cancel request', {
                description: error.message,
            });
        },
    });
};

// Discard request (New functionality)
export const useDiscardRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (requestId: string) => {
            const { data, error } = await supabase
                .from('blood_requests')
                .update({
                    status: 'discarded',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', requestId)
                .select()
                .single();

            if (error) throw error;
            return data as BloodRequest;
        },
        onSuccess: (discardedRequest) => {
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.all });
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.byDonor(discardedRequest.donor_id) });

            toast.success('Request discarded successfully');
        },
        onError: (error: any) => {
            console.error('Error discarding request:', error);
            toast.error('Failed to discard request', {
                description: error.message,
            });
        },
    });
};

// Manual refresh function
export const useRefreshRequests = (donorId: string) => {
    const queryClient = useQueryClient();

    return () => {
        // Invalidate all request-related queries
        queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.all });
        queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.byDonor(donorId) });

        // Force refetch
        queryClient.refetchQueries({ queryKey: REQUEST_KEYS.byDonor(donorId) });

        toast.success('Refreshed successfully!');
    };
};

// ==========================================
// NEW HOOKS FOR DONOR DASHBOARD
// ==========================================

// Fetch all open requests (status: pending or searching)
// This excludes the user's OWN requests
// Fetch all open requests (status: pending or searching)
// This excludes the user's OWN requests
export const useGetAllOpenRequests = () => {
    return useQuery({
        queryKey: [...REQUEST_KEYS.all, 'open', 'for_me'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();

            let query = supabase
                .from('blood_requests')
                .select('*')
                .in('status', ['pending', 'searching'])
                .order('created_at', { ascending: false });

            // If user logged in, exclude own
            if (user) {
                query = query.neq('donor_id', user.id);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as BloodRequest[];
        },
        enabled: true,
    });
};

// Check if donor has already responded to a request
export const useGetDonorResponse = (requestId: string, donorId: string) => {
    return useQuery({
        queryKey: ['request_response', requestId, donorId],
        queryFn: async () => {
            if (!donorId || !requestId) return null;
            const { data, error } = await supabase
                .from('request_responses')
                .select('*')
                .eq('request_id', requestId)
                .eq('donor_id', donorId)
                .maybeSingle(); // Use maybeSingle to avoid error if not found

            if (error) throw error;
            return data;
        },
        enabled: !!requestId && !!donorId,
    });
};

// NEW: Fetch all responses by the current donor (for filtering dashboard)
// NEW: Fetch all responses by the current donor (for filtering dashboard)
export const useGetMyResponses = () => {
    return useQuery({
        queryKey: ['my_responses', 'me'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from('request_responses')
                .select('*')
                .eq('donor_id', user.id);

            if (error) throw error;
            return data;
        },
        enabled: true,
    });
};

// Respond to a request (Accept / Express Interest)
export const useRespondToRequest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            requestId,
            status
        }: {
            requestId: string;
            status: 'accepted' | 'interested' | 'declined'
        }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('request_responses')
                .insert({
                    request_id: requestId,
                    donor_id: user.id,
                    status,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: REQUEST_KEYS.all });
            // Invalidate the specific response query so the UI updates immediately
            queryClient.invalidateQueries({ queryKey: ['request_response', variables.requestId] });

            toast.success(variables.status === 'accepted' ? 'Request accepted!' : 'Response recorded!');
        },
        onError: (error: any) => {
            console.error('Error responding to request:', error);
            toast.error('Failed to record response', {
                description: error.message || 'Please try again.',
            });
        },
    });
};
