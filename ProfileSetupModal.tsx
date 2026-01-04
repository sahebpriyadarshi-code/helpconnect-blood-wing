import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Role } from '../backend';

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfileMutation = useSaveCallerUserProfile();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !role || !contactInfo.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await saveProfileMutation.mutateAsync({
        name: name.trim(),
        role: role as Role,
        contactInfo: contactInfo.trim(),
      });
      toast.success('Profile created successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to create profile. Please try again.');
    }
  };

  return (
    <Dialog open={showProfileSetup}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome to HelpConnect!</DialogTitle>
          <DialogDescription>
            Please set up your profile to get started. This helps us connect you with the right people.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="role">I am a *</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Role.requester}>Blood Requester</SelectItem>
                <SelectItem value={Role.donor}>Blood Donor</SelectItem>
                <SelectItem value={Role.both}>Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactInfo">Contact Information *</Label>
            <Input
              id="contactInfo"
              placeholder="Phone number or email"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={saveProfileMutation.isPending}>
            {saveProfileMutation.isPending ? 'Creating Profile...' : 'Create Profile'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
