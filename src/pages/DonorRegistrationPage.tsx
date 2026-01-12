import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyDonorProfile, useUpdateDonorProfile } from '../hooks/useDonors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle, Heart } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BLOOD_TYPES = [
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
];

export default function DonorRegistrationPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const userId = identity?.email || identity?.getPrincipal().toString();
  const { data: currentDonor } = useGetMyDonorProfile();
  const updateProfileMutation = useUpdateDonorProfile();

  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [noChronicIllness, setNoChronicIllness] = useState(false);
  const [noRecentSurgery, setNoRecentSurgery] = useState(false);
  const [eligibleToDonate, setEligibleToDonate] = useState(false);
  const [healthNotes, setHealthNotes] = useState('');

  // Prefill data if donor exists
  useEffect(() => {
    if (currentDonor) {
      setName(currentDonor.name || '');
      setBloodGroup(currentDonor.blood_type || '');
      setCity(currentDonor.location_city || '');
      setState(currentDonor.state || '');
      setPhone(currentDonor.contact_phone || '');
    }
  }, [currentDonor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error('Please log in to register as a donor');
      return;
    }

    if (!name.trim() || !bloodGroup || !city.trim() || !state.trim() || !phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        user_id: userId,
        email: identity?.email || '', // Save email to public profile
        name: name.trim(),
        blood_type: bloodGroup,
        location_city: city.trim(),
        state: state.trim(),
        contact_phone: phone.trim(),
        is_available: true,
        // Store health notes if there was a field in schema, 
        // currently schema key is not strictly enforced by TS interface but is by SQL.
        // We'll skip storing health notes in the 'donors' table for now unless we add a column.
        // Or we can assume it's just a client-side check gate.
      });

      toast.success('Donor registration successful!');
      navigate({ to: '/donor-dashboard' });
    } catch (error) {
      console.error('Error registering donor:', error);
      toast.error('Failed to register as donor. Please try again.');
    }
  };

  return (
    <div className="container py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Heart className="h-8 w-8 text-primary fill-current" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
            Donor Registration
          </h1>
          <p className="text-lg text-muted-foreground">
            Register to view blood requests matching your profile
          </p>
        </div>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            After registration, you'll see blood requests that match your blood type and location.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Donor Information</CardTitle>
            <CardDescription>
              All fields marked with * are required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group *</Label>
                  <Select value={bloodGroup} onValueChange={setBloodGroup} required>
                    <SelectTrigger id="bloodGroup">
                      <SelectValue placeholder="Select your blood group" />
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
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="Enter your city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    placeholder="Enter your state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Health Information</Label>
                <div className="space-y-3 border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="noChronicIllness"
                      checked={noChronicIllness}
                      onCheckedChange={(checked) => setNoChronicIllness(checked as boolean)}
                    />
                    <Label htmlFor="noChronicIllness" className="font-normal cursor-pointer">
                      No chronic illness
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="noRecentSurgery"
                      checked={noRecentSurgery}
                      onCheckedChange={(checked) => setNoRecentSurgery(checked as boolean)}
                    />
                    <Label htmlFor="noRecentSurgery" className="font-normal cursor-pointer">
                      No recent surgery
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="eligibleToDonate"
                      checked={eligibleToDonate}
                      onCheckedChange={(checked) => setEligibleToDonate(checked as boolean)}
                    />
                    <Label htmlFor="eligibleToDonate" className="font-normal cursor-pointer">
                      Eligible to donate
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthNotes">Additional Health Notes (Optional)</Label>
                <Textarea
                  id="healthNotes"
                  placeholder="Any additional health information..."
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Registering...' : 'Register as Donor'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/' })}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
