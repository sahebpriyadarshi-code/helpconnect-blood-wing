/**
 * React Query Hooks for HelpConnect Blood Wing
 * Connects frontend components to backend API
 */

import { useState, useEffect, useCallback } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import * as backend from '../lib/backend';
import type {
  Donor,
  BloodRequest,
  MatchResult,
  User,
  Notification,
  BloodType,
  RequestStatus,
  UrgencyLevel,
  DonorSummary
} from '../lib/backend';

// ============================================================================
// CUSTOM HOOK TYPES
// ============================================================================

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  isLoading: boolean; // Alias
  isFetched?: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface MutationState<T> {
  data: T | null;
  loading: boolean;
  isPending: boolean; // Alias
  error: Error | null;
  mutate: (...args: any[]) => Promise<T | null>;
  mutateAsync: (...args: any[]) => Promise<T | null>; // Alias
  reset: () => void;
}

// ============================================================================
// AUTH HOOKS
// ============================================================================

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      backend.validateToken(token)
        .then(setUser)
        .catch(setError)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await backend.authenticateUser(email, password);
      if (result) {
        localStorage.setItem('auth_token', result.token);
        setUser(result.user);
        return result.user;
      }
      throw new Error('Invalid credentials');
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await backend.logout(token);
      localStorage.removeItem('auth_token');
    }
    setUser(null);
  }, []);

  const register = useCallback(async (email: string, password: string, role: 'donor' | 'recipient') => {
    setLoading(true);
    setError(null);
    try {
      const user = await backend.createUser({ email, password, role });
      // Auto-login after registration
      return await login(email, password);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [login]);

  return { user, loading, isLoading: loading, error, login, logout, register };
};

// ============================================================================
// DONOR HOOKS
// ============================================================================

export const useDonorQuery = (donorId?: string): QueryState<Donor> => {
  const [data, setData] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!donorId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const donor = await backend.getDonorById(donorId);
      setData(donor);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [donorId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, isLoading: loading, error, refetch };
};

export const useDonorByUserIdQuery = (userId?: string): QueryState<Donor> => {
  const [data, setData] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const donor = await backend.getDonorByUserId(userId);
      setData(donor);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, isLoading: loading, isFetched: !loading || !!data, error, refetch };
};

export const useSearchDonorsQuery = (filters: {
  bloodType?: BloodType | BloodType[];
  location?: { lat: number; lng: number; radius: number };
  isAvailable?: boolean;
  city?: string;
} = {}): QueryState<Donor[]> => {
  const [data, setData] = useState<Donor[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const donors = await backend.searchDonors(filters);
      setData(donors);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, isLoading: loading, error, refetch };
};

export const useRegisterDonor = (): MutationState<Donor> => {
  const [data, setData] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (donorData: Parameters<typeof backend.registerDonor>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const donor = await backend.registerDonor(donorData);
      setData(donor);
      return donor;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, isPending: loading, error, mutate, mutateAsync: mutate, reset };
};

export const useUpdateDonor = (): MutationState<Donor> => {
  const [data, setData] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (donorId: string, updates: Partial<Donor>) => {
    setLoading(true);
    setError(null);
    try {
      const donor = await backend.updateDonorProfile(donorId, updates);
      setData(donor);
      return donor;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, isPending: loading, error, mutate, mutateAsync: mutate, reset };
};

// ============================================================================
// BLOOD REQUEST HOOKS
// ============================================================================

export const useBloodRequestsQuery = (filters?: {
  status?: RequestStatus;
  bloodType?: BloodType;
  urgencyLevel?: UrgencyLevel;
  requesterId?: string;
}): QueryState<BloodRequest[]> => {
  const [data, setData] = useState<BloodRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const requests = await backend.getBloodRequests(filters);
      setData(requests);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, isLoading: loading, error, refetch };
};

export const useBloodRequestQuery = (requestId?: string): QueryState<BloodRequest> => {
  const [data, setData] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const request = await backend.getBloodRequestById(requestId);
      setData(request);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, isLoading: loading, error, refetch };
};

export const useCreateBloodRequest = (): MutationState<BloodRequest> => {
  const [data, setData] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (requestData: Parameters<typeof backend.createBloodRequest>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const request = await backend.createBloodRequest(requestData);
      setData(request);
      return request;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, isPending: loading, error, mutate, mutateAsync: mutate, reset };
};

export const useUpdateRequestStatus = (): MutationState<BloodRequest> => {
  const [data, setData] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (
    requestId: string,
    status: RequestStatus,
    donorIds?: string[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      const request = await backend.updateRequestStatus(requestId, status, donorIds);
      setData(request);
      return request;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, isPending: loading, error, mutate, mutateAsync: mutate, reset };
};

export const useRespondToRequest = (): MutationState<void> => {
  const [data, setData] = useState<void | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (
    requestId: string,
    donorId: string,
    response: 'accepted' | 'declined'
  ) => {
    setLoading(true);
    setError(null);
    try {
      await backend.respondToRequest(requestId, donorId, response);
      setData(null);
      return null;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, isPending: loading, error, mutate, mutateAsync: mutate, reset };
};

// ============================================================================
// MATCHING HOOKS
// ============================================================================

export const useMatchingQuery = (requestId?: string): QueryState<MatchResult[]> => {
  const [data, setData] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const matches = await backend.findCompatibleDonors(requestId);
      setData(matches);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, isLoading: loading, error, refetch };
};

export const useTriggerMatching = (): MutationState<void> => {
  const [data, setData] = useState<void | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (requestId: string) => {
    setLoading(true);
    setError(null);
    try {
      await backend.matchDonorsToRequest(requestId);
      setData(null);
      return null;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, isPending: loading, error, mutate, mutateAsync: mutate, reset };
};

// ============================================================================
// NOTIFICATION HOOKS
// ============================================================================

export const useNotificationsQuery = (userId?: string): QueryState<Notification[]> => {
  const [data, setData] = useState<Notification[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const notifications = await backend.getUserNotifications(userId);
      setData(notifications);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  return { data, loading, isLoading: loading, error, refetch };
};

export const useMarkNotificationRead = (): MutationState<void> => {
  const [data, setData] = useState<void | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (userId: string, notificationId: string) => {
    setLoading(true);
    setError(null);
    try {
      await backend.markNotificationAsRead(userId, notificationId);
      setData(null);
      return null;
    } catch (err) {
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, isPending: loading, error, mutate, mutateAsync: mutate, reset };
};

// ============================================================================
// STATISTICS HOOKS
// ============================================================================

export const useStatisticsQuery = (): QueryState<Awaited<ReturnType<typeof backend.getStatistics>>> => {
  const [data, setData] = useState<Awaited<ReturnType<typeof backend.getStatistics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await backend.getStatistics();
      setData(stats);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, isLoading: loading, error, refetch };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

export const useCheckCompatibility = () => {
  return useCallback((donorType: BloodType, recipientType: BloodType) => {
    return backend.checkBloodCompatibility(donorType, recipientType);
  }, []);
};

export const useGetCompatibleTypes = () => {
  return useCallback((recipientType: BloodType) => {
    return backend.getCompatibleBloodTypes(recipientType);
  }, []);
};

export const useCalculateDistance = () => {
  return useCallback((
    loc1: { latitude: number; longitude: number },
    loc2: { latitude: number; longitude: number }
  ) => {
    return backend.calculateDistance(
      { ...loc1, address: '' },
      { ...loc2, address: '' }
    );
  }, []);
};

// ============================================================================
// EXPORTS & COMPATIBILITY ALIASES
// ============================================================================

// Compatibility Aliases
export const useGetAllBloodRequests = () => useBloodRequestsQuery({});
export const useGetAllDonors = () => useSearchDonorsQuery({});
export const useUpdateDonorAvailability = useUpdateDonor;
export const useCreateMatch = () => {
  const mutation = useRespondToRequest();
  return {
    ...mutation,
    mutateAsync: async ({ requestId, donorId }: { requestId: string, donorId: string }) => {
      return mutation.mutate(requestId, donorId, 'accepted');
    }
  };
};
export const useUpdateBloodRequestStatus = useUpdateRequestStatus;
export const useCreateDonorInterest = () => {
  const mutation = useRespondToRequest();
  return {
    ...mutation,
    mutateAsync: async ({ requestId, donorId }: { requestId: string, donorId: string }) => {
      return mutation.mutate(requestId, donorId, 'accepted');
    }
  };
};

export const useGetCallerUserProfile = useDonorByUserIdQuery;
export const useCreateOrUpdateDonor = useRegisterDonor;
export const useFindDonorsNearby = (bloodType: any, location: any) => useSearchDonorsQuery({
  bloodType: bloodType || undefined,
  city: typeof location === 'string' ? location : undefined
});

// Mocks for missing hooks
export const useSaveCallerUserProfile = () => {
  const { identity } = useInternetIdentity();
  const mutation = useRegisterDonor();
  const queryClient = useQueryClient(); // Needs import from @tanstack/react-query

  return {
    ...mutation,
    mutateAsync: async (data: { name: string; role: 'donor' | 'recipient'; contactInfo: string }) => {
      if (!identity) throw new Error("No identity found");

      const result = await mutation.mutateAsync({
        userId: identity.email || identity.getPrincipal().toString(), // Use email as ID if available
        name: data.name,
        bloodType: 'O+' as BloodType, // Default, will be updated later
        location: { latitude: 0, longitude: 0, address: '', city: '' }, // Default
        contactInfo: { email: '', phone: data.contactInfo },
        isAvailable: data.role === 'donor', // Only donors are available by default
        healthStatus: 'eligible',
        registrationDate: new Date(),
        donationCount: 0,
        notificationPreferences: { email: true, sms: true, push: true }
      });


      // Force reload to ensure the new profile is picked up by all components immediately
      window.location.reload();

      return result;
    }
  };
};
export const useCountDonorInterests = (requestId?: string) => ({ data: 0, loading: false, isLoading: false, error: null, refetch: async () => { } });
export const useGetInterestedDonorsForRequest = (requestId?: string) => ({ data: [] as DonorSummary[], loading: false, isLoading: false, error: null, refetch: async () => { } });
export const useConfirmDonorMatch = () => {
  const mutation = useRespondToRequest();
  return {
    ...mutation,
    mutateAsync: async ({ requestId, donorId }: { requestId: string, donorId: string }) => { return null; }
  }
};

export default {
  // Auth
  useAuth,

  // Donors
  useDonorQuery,
  useDonorByUserIdQuery,
  useSearchDonorsQuery,
  useRegisterDonor,
  useUpdateDonor,

  // Blood Requests
  useBloodRequestsQuery,
  useBloodRequestQuery,
  useCreateBloodRequest,
  useUpdateRequestStatus,
  useRespondToRequest,

  // Matching
  useMatchingQuery,
  useTriggerMatching,

  // Notifications
  useNotificationsQuery,
  useMarkNotificationRead,

  // Statistics
  useStatisticsQuery,

  // Utilities
  useCheckCompatibility,
  useGetCompatibleTypes,
  useCalculateDistance,

  // Aliases
  useGetAllBloodRequests,
  useGetAllDonors,
  useUpdateDonorAvailability,
  useCreateMatch,
  useUpdateBloodRequestStatus,
  useCreateDonorInterest,
  useGetCallerUserProfile,
  useCreateOrUpdateDonor,
  useFindDonorsNearby,
  useCountDonorInterests,
  useGetInterestedDonorsForRequest,
  useConfirmDonorMatch
};
