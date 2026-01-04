import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            © 2025. Built with <Heart className="h-4 w-4 text-destructive fill-current" /> using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-xs text-muted-foreground max-w-md">
            HelpConnect Blood Wing connects blood donors with those in need. Every donation saves lives.
          </p>
        </div>
      </div>
    </footer>
  );
}
