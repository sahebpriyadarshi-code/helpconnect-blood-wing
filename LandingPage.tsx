import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Droplet, Heart } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-destructive/5">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="flex justify-center mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
                <Droplet className="h-12 w-12 text-destructive fill-current" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              HelpConnect – Blood Wing
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect blood donors with people in need. Every donation saves lives.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                size="lg"
                onClick={() => navigate({ to: '/request-blood' })}
                className="text-lg px-8 py-6"
              >
                <Heart className="mr-2 h-6 w-6" />
                Request Blood
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate({ to: '/donor-dashboard' })}
                className="text-lg px-8 py-6"
              >
                <Droplet className="mr-2 h-6 w-6" />
                I Can Donate
              </Button>
            </div>

            <div className="pt-8 text-sm text-muted-foreground">
              <p className="italic">
                Note: This platform facilitates connections only. Always verify with hospitals and follow proper medical procedures.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
