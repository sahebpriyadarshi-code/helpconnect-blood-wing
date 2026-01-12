import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllOpenRequests, useRespondToRequest, useGetDonorResponse, useGetMyResponses, BloodRequest } from '../hooks/useRequests';
import { useGetMyDonorProfile, useUpdateDonorProfile } from '../hooks/useDonors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Droplet, MapPin, Phone, Clock, Heart, AlertCircle, CheckCircle2, Info, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

const BLOOD_TYPE_LABELS: Record<string, string> = {
  'O+': 'O+', 'O-': 'O-',
  'A+': 'A+', 'A-': 'A-',
  'B+': 'B+', 'B-': 'B-',
  'AB+': 'AB+', 'AB-': 'AB-',
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

// Local compatibility checker
// Checks if donor (donorBlood) can donate TO recipient (recipientBlood) -> recipient must be in donor's compatible list?
// Wait, standard chart:
// O- can donate to everyone. 
// O+ can donate to O+, A+, B+, AB+
// The key-value above seems to be [Recipient, DonorsWhoCanDonateToRecipient] or [Donor, RecipientsTheyCanReceiveFrom]?
// Actually, let's stick to a simple function.
// "Can Donor X donate to Recipient Y?"
// Strict matching as requested by user
const canDonate = (donorType: string, recipientType: string): boolean => {
  // Normalizing
  const dt = donorType.replace('_', '').replace('positive', '+').replace('negative', '-');
  const rt = recipientType.replace('_', '').replace('positive', '+').replace('negative', '-');

  // User requested exact matching (e.g. O+ only sees O+)
  return dt === rt;
};

const RESPONSE_COOLDOWN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RESPONSE_THRESHOLD = 5; // Show message after 5 responses

const URGENCY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
};

export default function DonorDashboardPage() {
  const navigate = useNavigate();
  const { identity, isLoggingIn } = useInternetIdentity();
  const userId = identity?.getPrincipal().toString() || '';

  // Use new Supabase hooks
  const { data: allRequests, isLoading: requestsLoading } = useGetAllOpenRequests();
  // NEW: Fetch current donor profile from Supabase
  const { data: currentDonor, isLoading: profileLoading } = useGetMyDonorProfile();
  const updateProfileMutation = useUpdateDonorProfile();

  // Fetch my responses to filter out declined requests
  const { data: myResponses } = useGetMyResponses();

  // ENABLE REALTIME UPDATES & AUTO-MATCHING
  useRealtimeSubscription({
    userId,
    userBloodType: currentDonor?.blood_type,
    enabled: !!userId,
  });

  const [showCooldownMessage, setShowCooldownMessage] = useState(false);

  // Helper to toggle availability
  const handleAvailabilityToggle = async (checked: boolean) => {
    if (!currentDonor || !userId) return;
    try {
      await updateProfileMutation.mutateAsync({
        user_id: userId,
        is_available: checked
      });
      toast.success(`Availability updated to ${checked ? 'Available' : 'Unavailable'}`);
    } catch (e) {
      // Error handling in hook
    }
  };

  // Filter logic
  const filteredRequests = allRequests?.filter(req => {
    // 1. Filter out declined requests
    if (myResponses) {
      const hasDeclined = myResponses.some(res => res.request_id === req.id && res.status === 'declined');
      if (hasDeclined) return false;
    }

    if (!currentDonor) return true; // If no profile, show all (or could hide all)

    // Filter by blood type compatibility
    if (currentDonor.blood_type && req.blood_type) {
      const isCompat = canDonate(currentDonor.blood_type, req.blood_type);
      if (!isCompat) return false;
    }

    // Filter by State (Case Insensitive)
    if (currentDonor.state && req.state) {
      if (currentDonor.state.trim().toLowerCase() !== req.state.trim().toLowerCase()) {
        return false;
      }
    }

    return true;
  }) || [];

  const isAvailable = currentDonor?.is_available ?? false; // Use donor profile availability

  if (isLoggingIn || profileLoading) { // Updated condition
    return (
      <div className="container py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

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

  // Placeholder for stats, assuming they will be fetched or calculated elsewhere
  const stats = {
    totalDonations: 0, // This would come from a hook or calculation
  };

  // StatCard component (moved here for scope)
  const StatCard = ({ title, value, label, icon }: { title: string; value: number | string; label: string; icon: React.ReactNode }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );


  return (
    <div className="container py-8 relative">
      {/* Background Graffiti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 dark:opacity-5 -z-10">
        <Droplet className="absolute top-0 right-[5%] w-32 h-32 text-rose-600 rotate-12" />
        <Activity className="absolute top-40 left-[2%] w-24 h-24 text-rose-600 -rotate-12" />
        <Heart className="absolute bottom-20 right-[10%] w-40 h-40 text-rose-600 rotate-6" />
        <div className="absolute top-20 left-[15%] text-9xl font-black text-rose-600 opacity-20 select-none hidden lg:block">O+</div>
      </div>

      <div className="flex flex-col gap-8 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            Donor <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-rose-600">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            View matching blood requests and manage your availability
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Donations"
            value={stats?.totalDonations || 0}
            label="Lives impacted"
            icon={<Heart className="h-5 w-5 text-rose-500" />}
          />
          <StatCard
            title="Open Requests"
            value={filteredRequests.length}
            label="Requests nearby"
            icon={<Droplet className="h-5 w-5 text-blue-500" />}
          />
        </div>

        {/* Donor Profile Card */}
        <div className="rounded-xl border border-rose-100 bg-white/60 dark:bg-card/60 backdrop-blur-md shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Your Donor Profile</h2>
              <p className="text-muted-foreground">
                {currentDonor ? (
                  <>
                    {currentDonor.name} • <span className="text-destructive font-black">{currentDonor.blood_type}</span> • {currentDonor.location_city}, {currentDonor.state}
                  </>
                ) : (
                  "Please set up your profile to start donating"
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="availability" className="text-sm text-muted-foreground">
                  {currentDonor?.is_available ? 'Available' : 'Unavailable'}
                </Label>
                <Switch
                  id="availability"
                  checked={currentDonor?.is_available || false}
                  onCheckedChange={handleAvailabilityToggle}
                  disabled={!currentDonor}
                />
              </div>
            </div>
          </div>

          {!currentDonor && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => document.querySelector<HTMLButtonElement>('[data-state="closed"] > svg.lucide-settings')?.parentElement?.click()}>
                Set up Profile
              </Button>
            </div>
          )}
        </div>

        <div className="mb-2">
          <h2 className="text-2xl font-bold tracking-tight">Available Blood Requests</h2>
          <p className="text-muted-foreground">
            {currentDonor
              ? `Requests matching your blood type (${currentDonor.blood_type}) in your area`
              : 'All open blood requests (sign in to filter)'}
          </p>
        </div>

        {requestsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="bg-white/50 border-rose-100 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Droplet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No active requests</h3>
              <p className="text-muted-foreground">
                {currentDonor
                  ? "Great news! No compatible blood requests found at the moment."
                  : "There are currently no pending blood requests."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  layout
                >
                  <RequestCard
                    request={request}
                    donorId={userId}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  donorId,
}: {
  request: BloodRequest;
  donorId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const respondMutation = useRespondToRequest();
  const { data: existingResponse } = useGetDonorResponse(request.id, donorId);

  const bloodTypeLabel = BLOOD_TYPE_LABELS[request.blood_type] || request.blood_type;
  const urgencyLevel = request.urgency || 'medium';
  const urgencyColor = URGENCY_COLORS[urgencyLevel] || URGENCY_COLORS.medium;

  const handleResponse = async (status: 'accepted' | 'interested' | 'declined') => {
    // Prevent duplicate actions locally to avoid "Duplicate Key" error
    if (existingResponse) {
      toast.error(`You have already responded: ${existingResponse.status}`);
      return;
    }

    try {
      await respondMutation.mutateAsync({
        requestId: request.id,
        status,
      });

      console.log('Response recorded successfully');

      // Email Notification (Handled by Database Webhook -> Edge Function)
      if (status === 'accepted') {
        toast.success('Match Confirmed!', {
          description: 'The HelpConnect system is sending contact details to both parties via email.',
          duration: 5000,
        });
      }
    } catch (e: any) {
      // Check for uniqueness violation error from Supabase
      if (e.message?.includes('duplicate key') || e.code === '23505') {
        toast.error('You have already responded to this request.');
      } else {
        console.error(e);
        toast.error(`Failed to perform action: ${e.message}`);
      }
    }
  };

  const isResponded = !!existingResponse;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-destructive" />
              {request.recipient_name}
            </CardTitle>
            <CardDescription>
              Needs {request.units_needed} unit(s) of blood
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={urgencyColor}>
              {urgencyLevel.charAt(0).toUpperCase() + urgencyLevel.slice(1)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
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
              <span className="capitalize">{urgencyLevel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Location:</span>
              <span>{request.hospital_address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Contact:</span>
              <span>{request.recipient_phone}</span>
            </div>
            {request.state && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">State:</span>
                <span>{request.state}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t">
            {isResponded ? (
              <Button variant="outline" disabled className="w-full">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                You have responded ({existingResponse.status})
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleResponse('accepted')}
                  disabled={respondMutation.isPending || !!existingResponse}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Accept
                </Button>
                <Button
                  onClick={() => handleResponse('declined')}
                  disabled={respondMutation.isPending || !!existingResponse}
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Discard
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card >
  );
}
