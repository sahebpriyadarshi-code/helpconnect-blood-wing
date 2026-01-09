import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { BloodRequest, Donor, UserProfile, BloodType, RequestStatus, Checklist, DonorInterest, DonorSummary, DonorContactResponse, PublicBloodRequest } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetAllBloodRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<PublicBloodRequest[]>({
    queryKey: ['bloodRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBloodRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateBloodRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      recipientName: string;
      bloodType: BloodType;
      location: string;
      urgency: string;
      contactInfo: string;
      unitsRequired: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBloodRequest(
        params.id,
        params.recipientName,
        params.bloodType,
        params.location,
        params.urgency,
        params.contactInfo,
        params.unitsRequired
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodRequests'] });
    },
  });
}

export function useUpdateBloodRequestStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { requestId: string; status: RequestStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBloodRequestStatus(params.requestId, params.status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodRequests'] });
    },
  });
}

export function useGetAllDonors() {
  const { actor, isFetching } = useActor();

  return useQuery<Donor[]>({
    queryKey: ['donors'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDonors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useFindDonorsNearby(bloodType: BloodType | null, city: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['donorsNearby', bloodType, city],
    queryFn: async () => {
      if (!actor || !bloodType || !city) return BigInt(0);
      return actor.findDonorsNearby(bloodType, city);
    },
    enabled: !!actor && !isFetching && !!bloodType && !!city,
  });
}

export function useCreateOrUpdateDonor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      bloodType: BloodType;
      location: string;
      contactInfo: string;
      healthChecklist: Checklist;
      availability: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOrUpdateDonor(
        params.id,
        params.name,
        params.bloodType,
        params.location,
        params.contactInfo,
        params.healthChecklist,
        params.availability
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donorsNearby'] });
    },
  });
}

export function useUpdateDonorAvailability() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { donorId: string; available: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateDonorAvailability(params.donorId, params.available);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      queryClient.invalidateQueries({ queryKey: ['donorsNearby'] });
    },
  });
}

export function useCreateMatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { requestId: string; donorId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createMatch(params.requestId, params.donorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['bloodRequests'] });
    },
  });
}

export function useCreateDonorInterest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { requestId: string; donorId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createDonorInterest(params.requestId, params.donorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donorInterests'] });
      queryClient.invalidateQueries({ queryKey: ['bloodRequests'] });
      queryClient.invalidateQueries({ queryKey: ['interestedDonors'] });
    },
  });
}

export function useGetDonorInterestsByRequest(requestId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DonorInterest[]>({
    queryKey: ['donorInterests', requestId],
    queryFn: async () => {
      if (!actor || !requestId) return [];
      return actor.getDonorInterestsByRequest(requestId);
    },
    enabled: !!actor && !isFetching && !!requestId,
  });
}

export function useCountDonorInterests(requestId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['donorInterestsCount', requestId],
    queryFn: async () => {
      if (!actor || !requestId) return BigInt(0);
      return actor.countDonorInterests(requestId);
    },
    enabled: !!actor && !isFetching && !!requestId,
  });
}

export function useGetInterestedDonorsForRequest(requestId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DonorSummary[]>({
    queryKey: ['interestedDonors', requestId],
    queryFn: async () => {
      if (!actor || !requestId) return [];
      return actor.getInterestedDonorsForRequest(requestId);
    },
    enabled: !!actor && !isFetching && !!requestId,
  });
}

export function useConfirmDonorMatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { requestId: string; donorId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.confirmDonorMatch(params.requestId, params.donorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodRequests'] });
      queryClient.invalidateQueries({ queryKey: ['interestedDonors'] });
    },
  
  
  export function useAutoMatchBloodRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.autoMatchBloodRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodRequests'] });
      queryClient.invalidateQueries({ queryKey: ['donorInterests'] });
    },
  });
}

export function useFindBestDonorMatch() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (requestId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.findBestDonorMatch(requestId);
    },
  });
}});
}
