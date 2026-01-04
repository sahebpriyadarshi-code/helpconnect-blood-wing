import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useCreateOrUpdateDonor } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { BloodType } from '../backend';
import { AlertCircle, Heart } from 'lucide-react';
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

export default function DonorRegistrationPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const createDonorMutation = useCreateOrUpdateDonor();

  const [bloodGroup, setBloodGroup] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [noChronicIllness, setNoChronicIllness] = useState(false);
  const [noRecentSurgery, setNoRecentSurgery] = useState(false);
  const [eligibleToDonate, setEligibleToDonate] = useState(false);
  const [healthNotes, setHealthNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error('Please log in to register as a donor');
      return;
    }

    if (!userProfile) {
      toast.error('Please complete your profile first');
      return;
    }

    if (!bloodGroup || !city.trim() || !phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const donorId = identity.getPrincipal().toString();
      await createDonorMutation.mutateAsync({
        id: donorId,
        name: userProfile.name,
        bloodType: bloodGroup as BloodType,
        location: city.trim(),
        contactInfo: phone.trim(),
        healthChecklist: {
          noChronicIllness,
          noRecentSurgery,
          eligibleToDonate,
          notes: healthNotes.trim(),
        },
        availability: true,
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
                  disabled={createDonorMutation.isPending}
                >
                  {createDonorMutation.isPending ? 'Registering...' : 'Register as Donor'}
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
