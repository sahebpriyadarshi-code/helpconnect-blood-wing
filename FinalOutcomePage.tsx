import { useNavigate, useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Heart } from 'lucide-react';

export default function FinalOutcomePage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { type?: string };
  const outcomeType = search?.type || 'accept';

  const isAccept = outcomeType === 'accept';

  return (
    <div className="container py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <Card className={isAccept ? 'border-green-500/50' : 'border-gray-500/50'}>
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-6">
              {isAccept ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-500/10">
                  <XCircle className="h-12 w-12 text-gray-600" />
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight mb-4">
              {isAccept ? 'Thank You for Your Response!' : 'Request Declined'}
            </h1>

            {isAccept ? (
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  Your acceptance has been recorded. The requester will be notified and will contact you shortly.
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-2">Next Steps:</p>
                  <ul className="text-left space-y-1 text-muted-foreground">
                    <li>• Wait for the requester to contact you</li>
                    <li>• Verify the hospital details before donating</li>
                    <li>• Ensure you meet all health requirements for donation</li>
                    <li>• Contact the hospital directly if you have questions</li>
                  </ul>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
                  <Heart className="h-4 w-4 text-destructive fill-current" />
                  <span>Your generosity can save lives</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  You have declined this blood request. The request status has been updated.
                </p>
                <p className="text-sm text-muted-foreground">
                  Thank you for considering. You can view other requests anytime.
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center mt-8">
              <Button onClick={() => navigate({ to: '/' })}>
                Back to Home
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/status-tracking' })}>
                View All Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
