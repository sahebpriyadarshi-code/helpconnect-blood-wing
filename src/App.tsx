import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from './pages/LandingPage';
import RequestBloodPage from './pages/RequestBloodPage';
import StatusTrackingPage from './pages/StatusTrackingPage';
import DonorRegistrationPage from './pages/DonorRegistrationPage';
import DonorDashboardPage from './pages/DonorDashboardPage';
import LoginPage from './pages/LoginPage';
import FinalOutcomePage from './pages/FinalOutcomePage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LandingPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
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

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
});

const finalOutcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/outcome',
  component: FinalOutcomePage,
  validateSearch: (search: Record<string, unknown>) => ({
    type: typeof search.type === 'string' ? search.type : 'accept',
  }),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  requestBloodRoute,
  statusTrackingRoute,
  donorRegistrationRoute,
  donorDashboardRoute,
  profileRoute,
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
      <Toaster />
    </ThemeProvider>
  );
}
