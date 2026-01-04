import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from './pages/LandingPage';
import RequestBloodPage from './pages/RequestBloodPage';
import StatusTrackingPage from './pages/StatusTrackingPage';
import DonorRegistrationPage from './pages/DonorRegistrationPage';
import DonorDashboardPage from './pages/DonorDashboardPage';
import FinalOutcomePage from './pages/FinalOutcomePage';
import Layout from './components/Layout';
import ProfileSetupModal from './components/ProfileSetupModal';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const requestBloodRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/request-blood',
  component: RequestBloodPage,
});

const statusTrackingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/status-tracking',
  component: StatusTrackingPage,
});

const donorRegistrationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/donor-registration',
  component: DonorRegistrationPage,
});

const donorDashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/donor-dashboard',
  component: DonorDashboardPage,
});

const finalOutcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/outcome',
  component: FinalOutcomePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  requestBloodRoute,
  statusTrackingRoute,
  donorRegistrationRoute,
  donorDashboardRoute,
  finalOutcomeRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
      <ProfileSetupModal />
      <Toaster />
    </ThemeProvider>
  );
}
