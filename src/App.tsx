import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import ComponentShowcase from "@/pages/component-showcase";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { NotificationProvider } from "@/hooks/use-notification-settings";
import { NotificationSoundPlayer } from "@/components/ui/notification-sound-player";
import { ThemedToast } from "@/components/ui/themed-toast";

// Protected route component that redirects to login if not authenticated
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Show nothing while checking auth status
  if (isLoading) {
    return null;
  }

  // If authenticated, render the component, otherwise redirect to login
  return user ? <Component {...rest} /> : <Redirect to="/" />;
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    // If user is logged in and tries to access the landing page, redirect to dashboard
    if (!isLoading && user && location === "/") {
      window.location.href = "/dashboard";
    }
  }, [user, isLoading, location]);

  return (
    <Switch>
      <Route path="/dashboard">
        {(params) => <ProtectedRoute component={Dashboard} params={params} />}
      </Route>
      <Route path="/showcase" component={ComponentShowcase} />
      <Route path="/" component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <AuthProvider>
          <Router />
          <ThemedToast />
          <NotificationSoundPlayer />
        </AuthProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;