import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useDonorByUserIdQuery, useUpdateDonor } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { identity, logout, isLoggingIn } = useInternetIdentity();
    const { data: donorProfile, refetch } = useDonorByUserIdQuery(identity?.getPrincipal().toString());
    const updateDonorMutation = useUpdateDonor();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        city: '',
    });

    useEffect(() => {
        if (donorProfile) {
            setFormData({
                name: donorProfile.name,
                phone: donorProfile.contactInfo.phone,
                address: donorProfile.location.address,
                city: donorProfile.location.city || '',
            });
        }
    }, [donorProfile]);

    const handleLogout = async () => {
        await logout();
        navigate({ to: '/' });
    };

    const handleSave = async () => {
        if (!donorProfile) return;

        try {
            await updateDonorMutation.mutateAsync(donorProfile.id, {
                name: formData.name,
                contactInfo: { ...donorProfile.contactInfo, phone: formData.phone },
                location: { ...donorProfile.location, address: formData.address, city: formData.city }
            });
            toast.success('Profile updated successfully');
            setIsEditing(false);
            refetch();
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Failed to update profile');
        }
    };

    if (isLoggingIn) {
        return <div className="flex h-screen items-center justify-center">Loading profile...</div>;
    }

    if (!identity) {
        return (
            <div className="container py-12 text-center">
                <p>Please log in to view your profile.</p>
                <Button onClick={() => navigate({ to: '/login' })} className="mt-4">
                    Login
                </Button>
            </div>
        );
    }

    return (
        <div className="container py-8 md:py-12">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                    <Button variant="destructive" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            User Information
                        </CardTitle>
                        <CardDescription>
                            Manage your personal details and account settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <div className="flex items-center gap-2 text-muted-foreground p-2 bg-muted rounded-md">
                                    <Mail className="h-4 w-4" />
                                    <span>{identity.email}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Account Role</Label>
                                <div className="flex items-center gap-2 text-muted-foreground p-2 bg-muted rounded-md capitalize">
                                    <User className="h-4 w-4" />
                                    <span>Donor</span>
                                </div>
                            </div>
                        </div>

                        {donorProfile ? (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">Donor Details</h3>
                                    {!isEditing && (
                                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                            Edit Details
                                        </Button>
                                    )}
                                </div>

                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                className="pl-9"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">City</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="city"
                                                className="pl-9"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Full Address</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        <Button onClick={handleSave}>Save Changes</Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Alert>
                                <AlertDescription>
                                    You have not registered as a donor yet.
                                    <Button variant="link" className="p-0 h-auto font-bold ml-1" onClick={() => navigate({ to: '/donor-registration' })}>
                                        Register now
                                    </Button>
                                    to complete your profile.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
