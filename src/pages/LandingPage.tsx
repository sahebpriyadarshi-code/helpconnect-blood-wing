import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Droplet, Heart, Activity, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-gradient-to-br from-red-50 via-background to-orange-50 dark:from-red-950/20 dark:via-background dark:to-orange-950/20 overflow-hidden">

      {/* Hero Section */}
      <section className="relative pt-20 pb-40 overflow-hidden">
        {/* Dynamic Gradient Background */}
        <div className="absolute inset-0 bg-background/50">
          <div className="absolute right-0 top-0 h-[500px] w-[500px] bg-primary/20 blur-[100px] rounded-full mix-blend-multiply opacity-50 animate-blob" />
          <div className="absolute left-0 bottom-0 h-[500px] w-[500px] bg-secondary/30 blur-[100px] rounded-full mix-blend-multiply opacity-50 animate-blob animation-delay-2000" />
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 bg-rose-400/20 blur-[100px] rounded-full mix-blend-multiply opacity-50 animate-blob animation-delay-4000" />
        </div>

        {/* Blood Graffiti / Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 dark:opacity-5">
          <Droplet className="absolute top-20 left-[10%] w-24 h-24 text-rose-600 -rotate-12" />
          <Heart className="absolute top-40 right-[15%] w-32 h-32 text-rose-600 rotate-12" />
          <Activity className="absolute bottom-20 left-[20%] w-40 h-40 text-rose-600 -rotate-6" />
          <div className="absolute top-1/2 right-[5%] w-16 h-16 border-4 border-rose-600 rounded-full opacity-50" />
          <Droplet className="absolute bottom-40 right-[25%] w-20 h-20 text-rose-600 rotate-45" />
          <div className="absolute top-32 left-[30%] text-9xl font-black text-rose-600 opacity-20 select-none hidden lg:block">O+</div>
          <div className="absolute bottom-20 right-[10%] text-9xl font-black text-rose-600 opacity-20 select-none hidden lg:block">AB-</div>
        </div>

        <div className="container relative z-10 px-4 md:px-6">
          <motion.div
            className="flex flex-col items-center text-center space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-background/50 backdrop-blur-md px-6 py-2 text-sm font-bold text-primary shadow-[0_0_20px_rgba(255,0,72,0.15)] hover:shadow-[0_0_25px_rgba(255,0,72,0.25)] transition-all cursor-default">
                <span className="flex h-2.5 w-2.5 rounded-full bg-primary mr-3 animate-pulse shadow-[0_0_10px_currentColor]"></span>
                Emergency Blood Coordination System
              </div>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-foreground drop-shadow-sm pb-2 leading-[1.1]"
            >
              Every Drop <span className="text-primary transparent bg-clip-text bg-gradient-to-r from-primary to-rose-600">Counts</span>, <br />
              Every Life <span className="text-primary transparent bg-clip-text bg-gradient-to-r from-rose-600 to-orange-500">Matters</span>.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="max-w-[800px] text-lg text-muted-foreground md:text-xl font-medium leading-relaxed"
            >
              The real-time bridge connecting those in need with local heroes.
              <span className="block mt-4 text-foreground font-bold">Secure. Fast. Life-saving.</span>
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-6 min-w-[340px] pt-4"
            >
              <Button
                size="lg"
                onClick={() => navigate({ to: '/request-blood' })}
                className="h-14 px-8 text-lg font-bold rounded-full bg-gradient-to-r from-primary to-rose-600 hover:from-primary/90 hover:to-rose-600/90 text-white shadow-[0_10px_30px_rgba(255,0,72,0.3)] hover:shadow-[0_15px_40px_rgba(255,0,72,0.4)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 border-0"
              >
                <Heart className="mr-2 h-5 w-5 fill-current" />
                Request Blood
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate({ to: '/donor-dashboard' })}
                className="h-14 px-8 text-lg font-bold rounded-full border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:bg-primary/5 hover:border-primary text-primary transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 active:scale-95 shadow-lg"
              >
                <Droplet className="mr-2 h-5 w-5" />
                I Want to Donate
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white/50 dark:bg-background/50 backdrop-blur-sm border-t border-rose-100 dark:border-rose-900/20">
        <div className="container px-4 md:px-6">
          <motion.div
            className="grid gap-8 md:grid-cols-3"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <FeatureCard
              icon={<Activity className="h-10 w-10 text-rose-500" />}
              title="Real-Time Availability"
              description="Instantly find donors who are currently available and nearby. No more outdated lists."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-10 w-10 text-rose-500" />}
              title="Verified Donors"
              description="A trusted community of verified volunteers ready to step up when seconds count."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-rose-500" />}
              title="Direct Connection"
              description="Remove the middleman. Connect directly with donors for faster coordination."
            />
          </motion.div>
        </div>
      </section>

      {/* Stats / Impact Section */}
      <section className="py-24 md:py-32 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1615461066841-6116e61058f4?q=80&w=2883&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>

        <div className="container relative z-10 px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">
              Ready to Save a Life?
            </h2>
            <p className="mx-auto max-w-[600px] text-gray-300 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mb-8">
              Join thousands of donors who are making a difference in their community today.
            </p>
            <Button
              size="lg"
              onClick={() => navigate({ to: '/donor-dashboard' })}
              className="h-12 px-8 bg-white text-rose-600 hover:bg-gray-100 font-bold"
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="py-6 border-t bg-background/50 backdrop-blur-sm">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; 2025 HelpConnect. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-2xl bg-white dark:bg-card border border-rose-100 dark:border-rose-900/30 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 w-fit rounded-xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
