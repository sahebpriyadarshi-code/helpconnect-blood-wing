import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyDonorProfile, useUpdateDonorProfile } from '../hooks/useDonors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Settings, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileSidebar() {
    const { identity } = useInternetIdentity();
    const userId = identity?.getPrincipal().toString() || '';

    const { data: currentDonor, isLoading } = useGetMyDonorProfile();
    const updateProfileMutation = useUpdateDonorProfile();

    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [bloodType, setBloodType] = useState<string>('');
    const [isAvailable, setIsAvailable] = useState(false);

    // Initialize form with existing data when sidebar opens or donor loads
    useEffect(() => {
        if (currentDonor) {
            setName(currentDonor.name || '');
            setPhone(currentDonor.contact_phone || '');
            setCity(currentDonor.location_city || '');
            setAddress(currentDonor.location_address || '');
            setBloodType(currentDonor.blood_type || '');
            setIsAvailable(currentDonor.is_available);
        }
    }, [currentDonor, isOpen]);

    const handleSave = async () => {
        if (!name || !phone || !city || !bloodType) {
            toast.error('Please fill in all required fields (Name, Phone, City, Blood Type).');
            return;
        }

        if (!userId) {
            toast.error('User not identified. Please log in.');
            return;
        }

        try {
            await updateProfileMutation.mutateAsync({
                name,
                contact_phone: phone,
                location_city: city,
                location_address: address, // Optional in UI but good to store
                blood_type: bloodType,
                is_available: isAvailable,
            });

            setIsEditing(false); // Exit edit mode on success
            // Toast handled in hook
        } catch (error) {
            // Error handled in hook
        }
    };

    if (!identity) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setIsEditing(false); // Reset edit mode when closing
        }}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 border border-gray-200 dark:border-gray-800">
                    <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
                <SheetHeader className="mb-6 flex flex-row items-center justify-between">
                    <SheetTitle>Your Profile</SheetTitle>
                    {!isLoading && currentDonor && !isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            Edit Profile
                        </Button>
                    )}
                </SheetHeader>

                {isLoading && !currentDonor ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {!isEditing && currentDonor ? (
                            // READ-ONLY VIEW
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</Label>
                                        <p className="font-medium text-lg">{currentDonor.name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Blood Type</Label>
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                            {currentDonor.blood_type}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">City</Label>
                                        <p className="font-medium">{currentDonor.location_city}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Phone</Label>
                                        <p className="font-medium">{currentDonor.contact_phone}</p>
                                    </div>
                                </div>

                                {currentDonor.location_address && (
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Address</Label>
                                        <p className="font-medium">{currentDonor.location_address}</p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div className="space-y-1">
                                        <Label>Availability Status</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {currentDonor.is_available
                                                ? <span className="text-green-600 font-medium flex items-center gap-1">Available to donate</span>
                                                : <span className="text-muted-foreground flex items-center gap-1">Currently unavailable</span>}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={currentDonor.is_available}
                                        disabled
                                    />
                                </div>
                            </div>
                        ) : (
                            // EDIT FORM
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bloodType">Blood Type</Label>
                                    <Select value={bloodType} onValueChange={setBloodType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Blood Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="New York"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address">Address (Optional)</Label>
                                    <Input
                                        id="address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="123 Main St"
                                    />
                                </div>

                                <div className="flex items-center justify-between space-y-0 rounded-md border p-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="available">Available for Donation</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Turn off if you cannot donate right now.
                                        </p>
                                    </div>
                                    <Switch
                                        id="available"
                                        checked={isAvailable}
                                        onCheckedChange={setIsAvailable}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setIsEditing(false)}
                                        disabled={updateProfileMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleSave}
                                        disabled={updateProfileMutation.isPending}
                                    >
                                        {updateProfileMutation.isPending ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Profile
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
