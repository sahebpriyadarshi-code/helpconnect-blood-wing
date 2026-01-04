import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllBloodRequests, useUpdateBloodRequestStatus, useFindDonorsNearby, useCountDonorInterests, useGetInterestedDonorsForRequest, useConfirmDonorMatch } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Clock, Droplet, MapPin, Phone, RefreshCw, CheckCircle2, Search, Users, UserCheck, Info } from 'lucide-react';
import { PublicBloodRequest, RequestStatus, DonorSummary } from '../backend';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BLOOD_TYPE_LABELS: Record<string, string> = {
  O_positive: 'O+',
  O_negative: 'O-',
  A_positive: 'A+',
  A_negative: 'A-',
  B_positive: 'B+',
  B_negative: 'B-',
  AB_positive: 'AB+',
  AB_negative: 'AB-',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  searching: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  donor_contacted: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  matched: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  fulfilled: 'bg-green-600/10 text-green-800 dark:text-green-300 border-green-600/20',
  expired: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  searching: 'Searching',
  donor_contacted: 'Donor Contacted',
  matched: 'Matched',
  fulfilled: 'Fulfilled',
  expired: 'Expired',
};

const INACTIVE_MATCH_THRESHOLD_MS = 12 * 60 * 60 * 1000; // 12 hours

export default function StatusTrackingPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: allRequests, isLoading, refetch } = useGetAllBloodRequests();
  const updateStatusMutation = useUpdateBloodRequestStatus();

  const [fulfillRequestId, setFulfillRequestId] = useState<string | null>(null);
  const [userRequestIds, setUserRequestIds] = useState<string[]>([]);

  useEffect(() => {
    // Load user's request IDs from localStorage
    if (identity) {
      const principalId = identity.getPrincipal().toString();
      try {
        const stored = localStorage.getItem(`userRequests_${principalId}`);
        if (stored) {
          setUserRequestIds(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load user request IDs:', error);
      }
    }
  }, [identity]);

  const handleRefresh = () => {
    refetch();
  };

  const handleStatusUpdate = async (requestId: string, status: RequestStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ requestId, status });
      toast.success('Request status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status. Please try again.');
    }
  };

  const handleFulfillConfirm = async () => {
    if (!fulfillRequestId) return;

    try {
      await updateStatusMutation.mutateAsync({
        requestId: fulfillRequestId,
        status: RequestStatus.fulfilled,
      });
      toast.success('Request marked as fulfilled');
      setFulfillRequestId(null);
    } catch (error) {
      console.error('Error fulfilling request:', error);
      toast.error('Failed to mark request as fulfilled. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const userRequests = identity && allRequests
    ? allRequests.filter((req) => userRequestIds.includes(req.id))
    : [];

  const sortedRequests = [...userRequests].sort((a, b) => 
    Number(b.timeCreated - a.timeCreated)
  );

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
              My Blood Requests
            </h1>
            <p className="text-lg text-muted-foreground">
              Track your blood requests and their status
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {!identity && (
          <Card className="mb-6">
            <CardContent className="py-6">
              <p className="text-muted-foreground text-center">
                Please log in to view your blood requests.
              </p>
            </CardContent>
          </Card>
        )}

        {identity && sortedRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Droplet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Blood Requests</h3>
              <p className="text-muted-foreground mb-6">
                You haven't created any blood requests yet.
              </p>
              <Button onClick={() => navigate({ to: '/request-blood' })}>
                Create Blood Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onStatusUpdate={handleStatusUpdate}
                onFulfillRequest={setFulfillRequestId}
                isUpdating={updateStatusMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!fulfillRequestId} onOpenChange={(open) => !open && setFulfillRequestId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Fulfillment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this blood request as fulfilled? This action confirms that the blood donation has been completed successfully.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFulfillConfirm}>
              Confirm Fulfillment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RequestCard({
  request,
  onStatusUpdate,
  onFulfillRequest,
  isUpdating,
}: {
  request: PublicBloodRequest;
  onStatusUpdate: (requestId: string, status: RequestStatus) => void;
  onFulfillRequest: (requestId: string) => void;
  isUpdating: boolean;
}) {
  const { data: nearbyDonorsCount } = useFindDonorsNearby(request.bloodType, request.location);
  const { data: interestCount } = useCountDonorInterests(request.id);
  const { data: interestedDonors } = useGetInterestedDonorsForRequest(request.id);
  const confirmMatchMutation = useConfirmDonorMatch();
  
  const [selectedDonorContact, setSelectedDonorContact] = useState<{ donorSummary: DonorSummary; contactInfo: string } | null>(null);
  
  const statusLabel = STATUS_LABELS[request.status.toString()] || request.status.toString();
  const bloodTypeLabel = BLOOD_TYPE_LABELS[request.bloodType.toString()] || request.bloodType.toString();
  const statusColor = STATUS_COLORS[request.status.toString()] || '';

  const createdDate = new Date(Number(request.timeCreated) / 1000000);

  // Check if matched but inactive
  const isMatchedButInactive = () => {
    if (request.status.toString() !== 'matched') return false;
    
    try {
      const matchedTimestamp = getMatchedTimestamp(request.id);
      if (!matchedTimestamp) return false;
      
      const now = Date.now();
      return now - matchedTimestamp > INACTIVE_MATCH_THRESHOLD_MS;
    } catch {
      return false;
    }
  };

  const getMatchedTimestamp = (requestId: string): number | null => {
    try {
      const stored = localStorage.getItem(`matchedTimestamp_${requestId}`);
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  };

  const recordMatchedTimestamp = (requestId: string) => {
    try {
      localStorage.setItem(`matchedTimestamp_${requestId}`, Date.now().toString());
    } catch (error) {
      console.error('Failed to record matched timestamp:', error);
    }
  };

  const getStatusTimeline = () => {
    const currentStatus = request.status.toString();
    const statuses = ['pending', 'searching', 'donor_contacted', 'matched', 'fulfilled'];
    const currentIndex = statuses.indexOf(currentStatus);

    return statuses.map((status, index) => ({
      label: STATUS_LABELS[status],
      active: index <= currentIndex,
      current: status === currentStatus,
    }));
  };

  const timeline = getStatusTimeline();
  const hasPotentialDonors = nearbyDonorsCount && Number(nearbyDonorsCount) > 0;
  const showDonorIndicator = (request.status.toString() === 'pending' || request.status.toString() === 'searching') && hasPotentialDonors;
  const donorInterestCount = interestCount ? Number(interestCount) : 0;
  const showDonorResponse = donorInterestCount > 0;
  const showInterestedDonorsList = (request.status.toString() === 'donor_contacted' || request.status.toString() === 'matched') && interestedDonors && interestedDonors.length > 0;
  const showInactiveWarning = isMatchedButInactive();

  const handleContactDonor = async (donorId: string) => {
    try {
      const response = await confirmMatchMutation.mutateAsync({
        requestId: request.id,
        donorId,
      });
      setSelectedDonorContact(response);
      recordMatchedTimestamp(request.id);
      toast.success('Donor contact information revealed');
    } catch (error) {
      console.error('Error contacting donor:', error);
      toast.error('Failed to contact donor. Please try again.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-destructive" />
              {request.recipientName}
            </CardTitle>
            <CardDescription>
              Created: {createdDate.toLocaleString()}
            </CardDescription>
          </div>
          <Badge className={statusColor}>
            {statusLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Droplet className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Blood Type:</span>
            <span className="text-destructive font-bold">{bloodTypeLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Units:</span>
            <span>{request.unitsRequired.toString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">City:</span>
            <span>{request.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Urgency:</span>
            <span className="capitalize">{request.urgency}</span>
          </div>
        </div>

        {showInactiveWarning && (
          <Alert className="border-blue-500/50 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-700 dark:text-blue-400">
              This request may still require follow-up.
            </AlertDescription>
          </Alert>
        )}

        {(request.status.toString() === 'pending' || request.status.toString() === 'searching' || request.status.toString() === 'donor_contacted') && (
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-500/5 p-3 rounded-md">
              <Search className="h-4 w-4" />
              <span>Searching for compatible donors nearby</span>
            </div>
            {showDonorIndicator && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-500/5 p-3 rounded-md">
                <CheckCircle2 className="h-4 w-4" />
                <span>Potential donors found</span>
              </div>
            )}
            {showDonorResponse && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400 bg-purple-500/5 p-3 rounded-md">
                  <Users className="h-4 w-4" />
                  <span>Donors have responded ({donorInterestCount} {donorInterestCount === 1 ? 'donor' : 'donors'})</span>
                </div>
                <p className="text-xs text-muted-foreground px-3">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  A donor response does not guarantee availability until you confirm directly.
                </p>
              </div>
            )}
          </div>
        )}

        {showInterestedDonorsList && (
          <div className="pt-2 border-t space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Interested Donors</h3>
            </div>
            <div className="space-y-2">
              {interestedDonors.map((donor) => {
                const donorBloodType = BLOOD_TYPE_LABELS[donor.bloodType.toString()] || donor.bloodType.toString();
                const isSelected = selectedDonorContact?.donorSummary.donorId === donor.donorId;
                
                return (
                  <div key={donor.donorId} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{donor.firstName}</span>
                          <Badge variant="outline" className="text-xs">
                            {donorBloodType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{donor.location}</span>
                        </div>
                      </div>
                      {request.status.toString() === 'donor_contacted' && !isSelected && (
                        <Button
                          onClick={() => handleContactDonor(donor.donorId)}
                          disabled={confirmMatchMutation.isPending}
                          size="sm"
                        >
                          Contact this donor
                        </Button>
                      )}
                    </div>
                    
                    {isSelected && (
                      <Alert className="bg-green-500/5 border-green-500/20">
                        <AlertCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
                        <AlertDescription className="text-sm space-y-2">
                          <div className="font-medium text-green-700 dark:text-green-400">
                            Contact Information:
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <span>{selectedDonorContact.contactInfo}</span>
                          </div>
                          <div className="text-xs text-muted-foreground pt-1 border-t border-green-500/20">
                            Contact does not guarantee successful donation. Please confirm availability directly.
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Request Timeline</p>
          <div className="flex items-center justify-between">
            {timeline.map((step, index) => (
              <div key={step.label} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      step.active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-background text-muted-foreground'
                    } ${step.current ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    {step.active && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <p className={`mt-2 text-xs text-center ${step.current ? 'font-bold text-primary' : step.active ? 'font-medium' : 'text-muted-foreground'}`}>
                    {step.label}
                  </p>
                </div>
                {index < timeline.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      step.active ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {request.status.toString() === RequestStatus.pending && (
          <div className="pt-2 border-t">
            <Button
              onClick={() => onStatusUpdate(request.id, RequestStatus.searching)}
              disabled={isUpdating}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Mark as Searching
            </Button>
          </div>
        )}

        {request.status.toString() === RequestStatus.matched && (
          <div className="pt-2 border-t">
            <Button
              onClick={() => onFulfillRequest(request.id)}
              disabled={isUpdating}
              size="sm"
              className="w-full"
            >
              Mark as Fulfilled
            </Button>
          </div>
        )}

        {(request.status.toString() === RequestStatus.pending || request.status.toString() === RequestStatus.searching || request.status.toString() === RequestStatus.donor_contacted) && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Waiting for donor response. Contact the hospital directly for urgent needs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
