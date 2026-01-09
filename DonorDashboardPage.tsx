import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllBloodRequests, useGetAllDonors, useUpdateDonorAvailability, useCreateMatch, useUpdateBloodRequestStatus, useCreateDonorInterest } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RequestStatus } from '../backend';
import { Droplet, MapPin, Phone, Clock, Heart, AlertCircle, CheckCircle2, Info } from 'lucide-react';
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

const URGENCY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  urgent: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  moderate: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
};

// Blood type donation compatibility rules
const BLOOD_TYPE_COMPATIBILITY: Record<string, string[]> = {
  'O+': ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'], // Universal donor
  'O-': ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'], // Universal donor
  'A+': ['A+', 'AB+', 'A-', 'AB-'],
  'A-': ['A+', 'AB+', 'A-', 'AB-'],
  'B+': ['B+', 'AB+', 'B-', 'AB-'],
  'B-': ['B+', 'AB+', 'B-', 'AB-'],
  'AB+': ['AB+'],
  'AB-': ['AB-', 'AB+'],
};

const canDonate = (donorBlood: string, recipientBlood: string): boolean => {
  return BLOOD_TYPE_COMPATIBILITY[donorBlood]?.includes(recipientBlood) ?? false;
};

const RESPONSE_COOLDOWN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RESPONSE_THRESHOLD = 5; // Show message after 5 responses

export default function DonorDashboardPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: allRequests, isLoading: requestsLoading } = useGetAllBloodRequests();
  const { data: allDonors, isLoading: donorsLoading } = useGetAllDonors();
  const updateAvailabilityMutation = useUpdateDonorAvailability();
  const createMatchMutation = useCreateMatch();
  const updateStatusMutation = useUpdateBloodRequestStatus();

  const [showCooldownMessage, setShowCooldownMessage] = useState(false);

  useEffect(() => {
    // Check response rate on component mount
    const recentResponses = getRecentResponses();
    if (recentResponses.length >= RESPONSE_THRESHOLD) {
      setShowCooldownMessage(true);
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => setShowCooldownMessage(false), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  const getRecentResponses = (): number[] => {
    try {
      const stored = localStorage.getItem('donorResponseTimestamps');
      if (!stored) return [];
      const timestamps: number[] = JSON.parse(stored);
      const now = Date.now();
      // Filter to only recent responses within the time window
      return timestamps.filter(ts => now - ts < RESPONSE_COOLDOWN_WINDOW_MS);
    } catch {
      return [];
    }
  };

  const recordResponseTimestamp = () => {
    try {
      const recentResponses = getRecentResponses();
      recentResponses.push(Date.now());
      localStorage.setItem('donorResponseTimestamps', JSON.stringify(recentResponses));
      
      // Check if we should show the cooldown message
      if (recentResponses.length >= RESPONSE_THRESHOLD) {
        setShowCooldownMessage(true);
        setTimeout(() => setShowCooldownMessage(false), 10000);
      }
    } catch (error) {
      console.error('Failed to record response timestamp:', error);
    }
  };

  if (!identity) {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access the donor dashboard.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const donorId = identity.getPrincipal().toString();
  const currentDonor = allDonors?.find((d) => d.id === donorId);

  const handleAvailabilityToggle = async (available: boolean) => {
    if (!currentDonor) return;

    try {
      await updateAvailabilityMutation.mutateAsync({
        donorId: currentDonor.id,
        available,
      });
      toast.success(`Availability updated to ${available ? 'available' : 'unavailable'}`);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability. Please try again.');
    }
  };

  const handleAccept = async (requestId: string) => {
    if (!currentDonor) return;

    try {
      recordResponseTimestamp();
      
      await createMatchMutation.mutateAsync({
        requestId,
        donorId: currentDonor.id,
      });
      
      await updateStatusMutation.mutateAsync({
        requestId,
        status: RequestStatus.matched,
      });

      navigate({ to: '/outcome', search: { type: 'accept' } });
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request. Please try again.');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      recordResponseTimestamp();
      
      await updateStatusMutation.mutateAsync({
        requestId,
        status: RequestStatus.searching,
      });

      navigate({ to: '/outcome', search: { type: 'reject' } });
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request. Please try again.');
    }
  };

  if (donorsLoading || requestsLoading) {
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

  if (!currentDonor) {
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Donor Profile Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't registered as a donor yet. Register to view blood requests matching your profile.
              </p>
              <Button onClick={() => navigate({ to: '/donor-registration' })}>
                Register as Donor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const bloodTypeLabel = BLOOD_TYPE_LABELS[currentDonor.bloodType.toString()] || currentDonor.bloodType.toString();

  if (request.bloodType.toString() !== currentDonor.bloodType.toString()) return false;  const donorBloodLabel = BLOOD_TYPE_LABELS[currentDonor.bloodType.toString()] || currentDonor.bloodType.toString();
  const recipientBloodLabel = BLOOD_TYPE_LABELS[request.bloodType.toString()] || request.bloodType.toString();
  if (!canDonate(donorBloodLabel, recipientBloodLabel)) return false;const filteredRequests = allRequests?.filter((request) => {
    if (request.status.toString() !== RequestStatus.pending && request.status.toString() !== RequestStatus.searching && request.status.toString() !== RequestStatus.donor_contacted) return false;
    if (request.location.toLowerCase() !== currentDonor.location.toLowerCase()) return false;
    if (request.bloodType.toString() !== currentDonor.bloodType.toString()) return false;
    return true;
  }) || [];

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
            Donor Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your donor profile and view matching blood requests
          </p>
        </div>

        {showCooldownMessage && (
          <Alert className="mb-6 border-blue-500/50 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-blue-700 dark:text-blue-400">
                    Please respond only to requests you can realistically support.
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCooldownMessage(false)}
                  className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 h-auto p-1"
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Donor Profile</CardTitle>
            <CardDescription>
              {currentDonor.name} • {bloodTypeLabel} • {currentDonor.location}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="availability">Availability Status</Label>
                <p className="text-sm text-muted-foreground">
                  {currentDonor.availability ? 'You are currently available to donate' : 'You are currently unavailable'}
                </p>
              </div>
              <Switch
                id="availability"
                checked={currentDonor.availability}
                onCheckedChange={handleAvailabilityToggle}
                disabled={updateAvailabilityMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mb-4">
          <h2 className="text-2xl font-semibold mb-2">
            Available Blood Requests
          </h2>
          <p className="text-muted-foreground">
            Requests matching your blood type ({bloodTypeLabel}) in {currentDonor.location}
          </p>
        </div>

        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Droplet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No compatible requests nearby at the moment</h3>
              <p className="text-muted-foreground mb-6">
                There are currently no blood requests matching your blood type and location.
              </p>
              <Button onClick={() => navigate({ to: '/' })}>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                donorId={currentDonor.id}
                onAccept={handleAccept}
                onReject={handleReject}
                isProcessing={createMatchMutation.isPending || updateStatusMutation.isPending}
                onRecordResponse={recordResponseTimestamp}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  donorId,
  onAccept,
  onReject,
  isProcessing,
  onRecordResponse,
}: {
  request: any;
  donorId: string;
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isProcessing: boolean;
  onRecordResponse: () => void;
}) {
  const [interestRecorded, setInterestRecorded] = useState(false);
  const createInterestMutation = useCreateDonorInterest();

  const bloodTypeLabel = BLOOD_TYPE_LABELS[request.bloodType.toString()] || request.bloodType.toString();
  const urgencyColor = URGENCY_COLORS[request.urgency] || '';

  const handleExpressInterest = async () => {
    try {
      onRecordResponse();
      
      await createInterestMutation.mutateAsync({
        requestId: request.id,
        donorId,
      });
      setInterestRecorded(true);
      toast.success('Your interest has been recorded');
    } catch (error: any) {
      console.error('Error expressing interest:', error);
      if (error.message?.includes('already recorded')) {
        setInterestRecorded(true);
        toast.info('You have already expressed interest in this request');
      } else {
        toast.error('Failed to record interest. Please try again.');
      }
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
              Needs {request.unitsRequired.toString()} unit(s) of blood
            </CardDescription>
          </div>
          <Badge className={urgencyColor}>
            {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <Droplet className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Blood Type:</span>
            <span className="text-destructive font-bold">{bloodTypeLabel}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Urgency:</span>
            <span className="capitalize">{request.urgency}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Location:</span>
            <span>{request.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Contact:</span>
            <span>{request.contactInfo}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 border-t">
          <Button
            onClick={handleExpressInterest}
            disabled={interestRecorded || createInterestMutation.isPending}
            variant="outline"
            className="w-full"
          >
            {interestRecorded ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Interest recorded
              </>
            ) : (
              'I am available to donate'
            )}
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={() => onAccept(request.id)}
              disabled={isProcessing}
              className="flex-1"
            >
              Accept
            </Button>
            <Button
              onClick={() => onReject(request.id)}
              disabled={isProcessing}
              variant="outline"
              className="flex-1"
            >
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
