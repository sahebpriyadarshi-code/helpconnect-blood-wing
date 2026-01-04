import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateBloodRequest, useFindDonorsNearby } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BloodType } from '../backend';
import { AlertCircle, Droplet, Search, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BLOOD_TYPES = [
  { value: BloodType.O_positive, label: 'O+' },
  { value: BloodType.O_negative, label: 'O-' },
  { value: BloodType.A_positive, label: 'A+' },
  { value: BloodType.A_negative, label: 'A-' },
  { value: BloodType.B_positive, label: 'B+' },
  { value: BloodType.B_negative, label: 'B-' },
  { value: BloodType.AB_positive, label: 'AB+' },
  { value: BloodType.AB_negative, label: 'AB-' },
];

const URGENCY_LEVELS = [
  { value: 'critical', label: 'Critical' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'moderate', label: 'Moderate' },
];

const DUPLICATE_REQUEST_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export default function RequestBloodPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const createRequestMutation = useCreateBloodRequest();

  const [bloodGroup, setBloodGroup] = useState('');
  const [unitsRequired, setUnitsRequired] = useState('1');
  const [urgency, setUrgency] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [requestCreated, setRequestCreated] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  const { data: nearbyDonorsCount } = useFindDonorsNearby(
    requestCreated && bloodGroup ? (bloodGroup as BloodType) : null,
    requestCreated && city ? city.trim() : null
  );

  useEffect(() => {
    // Check for recent requests on component mount
    const recentRequests = getRecentRequests();
    if (recentRequests.length > 0) {
      setShowDuplicateWarning(true);
    }
  }, []);

  const getRecentRequests = (): number[] => {
    try {
      const stored = localStorage.getItem('bloodRequestTimestamps');
      if (!stored) return [];
      const timestamps: number[] = JSON.parse(stored);
      const now = Date.now();
      // Filter to only recent requests within the time window
      return timestamps.filter(ts => now - ts < DUPLICATE_REQUEST_WINDOW_MS);
    } catch {
      return [];
    }
  };

  const recordRequestTimestamp = () => {
    try {
      const recentRequests = getRecentRequests();
      recentRequests.push(Date.now());
      localStorage.setItem('bloodRequestTimestamps', JSON.stringify(recentRequests));
    } catch (error) {
      console.error('Failed to record request timestamp:', error);
    }
  };

  const saveUserRequestId = (requestId: string) => {
    if (!identity) return;
    
    try {
      const principalId = identity.getPrincipal().toString();
      const stored = localStorage.getItem(`userRequests_${principalId}`);
      const requestIds: string[] = stored ? JSON.parse(stored) : [];
      
      if (!requestIds.includes(requestId)) {
        requestIds.push(requestId);
        localStorage.setItem(`userRequests_${principalId}`, JSON.stringify(requestIds));
      }
    } catch (error) {
      console.error('Failed to save user request ID:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bloodGroup || !urgency || !hospitalName.trim() || !city.trim() || !phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const units = parseInt(unitsRequired);
    if (isNaN(units) || units < 1) {
      toast.error('Please enter a valid number of units');
      return;
    }

    try {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await createRequestMutation.mutateAsync({
        id: requestId,
        recipientName: hospitalName.trim(),
        bloodType: bloodGroup as BloodType,
        location: city.trim(),
        urgency,
        contactInfo: phone.trim(),
        unitsRequired: BigInt(units),
      });

      recordRequestTimestamp();
      saveUserRequestId(requestId);
      setRequestCreated(true);
      toast.success('Blood request created successfully!');
      
      setTimeout(() => {
        navigate({ to: '/status-tracking' });
      }, 3000);
    } catch (error) {
      console.error('Error creating blood request:', error);
      toast.error('Failed to create blood request. Please contact the hospital directly.');
    }
  };

  const hasPotentialDonors = nearbyDonorsCount && Number(nearbyDonorsCount) > 0;

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <Droplet className="h-8 w-8 text-destructive fill-current" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
            Request Blood
          </h1>
          <p className="text-lg text-muted-foreground">
            Submit your blood request details
          </p>
        </div>

        <Alert className="mb-6 border-destructive/50">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> This system helps connect you with potential donors but does not guarantee blood availability. 
            Always contact hospitals directly for urgent needs.
          </AlertDescription>
        </Alert>

        {showDuplicateWarning && !requestCreated && (
          <Alert className="mb-6 border-blue-500/50 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <strong className="text-blue-700 dark:text-blue-400">Note:</strong>
                  <span className="text-blue-700 dark:text-blue-400 ml-1">
                    You have recently created a blood request. Please check existing requests before creating a new one.
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDuplicateWarning(false)}
                  className="text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 h-auto p-1"
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {requestCreated && (
          <Alert className="mb-6 border-blue-500/50 bg-blue-500/5">
            <Search className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <strong>Searching for compatible donors nearby</strong>
              {hasPotentialDonors && (
                <div className="mt-2 flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Potential donors found</span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Blood Request Form</CardTitle>
            <CardDescription>
              All fields are required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group *</Label>
                  <Select value={bloodGroup} onValueChange={setBloodGroup} required disabled={requestCreated}>
                    <SelectTrigger id="bloodGroup">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unitsRequired">Units Required *</Label>
                  <Input
                    id="unitsRequired"
                    type="number"
                    min="1"
                    placeholder="Number of units"
                    value={unitsRequired}
                    onChange={(e) => setUnitsRequired(e.target.value)}
                    required
                    disabled={requestCreated}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency *</Label>
                <Select value={urgency} onValueChange={setUrgency} required disabled={requestCreated}>
                  <SelectTrigger id="urgency">
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital Name *</Label>
                <Input
                  id="hospitalName"
                  placeholder="Enter hospital name"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                  disabled={requestCreated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={requestCreated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter contact phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={requestCreated}
                />
              </div>

              {!requestCreated && (
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate({ to: '/' })}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
