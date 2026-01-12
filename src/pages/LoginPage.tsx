import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
    const navigate = useNavigate();
    const { identity, isLoggingIn } = useInternetIdentity();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [linkSent, setLinkSent] = useState(false);

    useEffect(() => {
        if (!isLoggingIn && identity) {
            navigate({ to: '/' });
        }
    }, [isLoggingIn, identity, navigate]);

    if (isLoggingIn) {
        return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return toast.error('Please enter an email address');

        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin + '/',
                },
            });

            if (error) throw error;

            toast.success('Login link sent to your email!');
            setLinkSent(true);
        } catch (error: any) {
            console.error('Error sending login link:', error);
            toast.error(error.message || 'Failed to send login link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-8rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                    <CardDescription>
                        {linkSent
                            ? `Check your email (${email}) for the login link`
                            : 'Enter your email to sign in'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!import.meta.env.VITE_SUPABASE_URL && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>
                                Supabase is not configured. Please add VITE_SUPABASE_URL to your .env file.
                            </AlertDescription>
                        </Alert>
                    )}

                    {linkSent ? (
                        <div className="space-y-4">
                            <Alert>
                                <AlertDescription>
                                    We've sent a magic link to <strong>{email}</strong>.
                                    <br />
                                    Click the link in the email to sign in.
                                </AlertDescription>
                            </Alert>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => setLinkSent(false)}
                            >
                                Use a different email
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Sending Link...' : 'Send Magic Link'}
                                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
