import { useEffect, useRef, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { manualSeen, useAuth } from './state';
import { Loading, Toast } from './components/ui';
import { Manual } from './screens/Manual';
import { Signup } from './screens/Signup';
import { Diet } from './screens/Diet';
import { Pantry } from './screens/Pantry';
import { AddItem } from './screens/AddItem';
import { Scan, ScanReading, ScanReview } from './screens/Scan';
import { Generate, RecipeDetail, Unavailable } from './screens/Recipe';
import { Recipes } from './screens/Recipes';
import { Saved, SavedCheck } from './screens/Saved';
import { Grocery } from './screens/Grocery';
import { Privacy, Profile } from './screens/Profile';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Navigate to={manualSeen.get() ? '/signup' : '/welcome'} replace />;
  return <>{children}</>;
}

/**
 * Bounces already-signed-in visitors to the pantry — but only if they were
 * signed in when they arrived, so it never races the post-sign-up redirect.
 */
function PublicOnly({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const signedInOnArrival = useRef<boolean | null>(null);
  if (ready && signedInOnArrival.current === null) signedInOnArrival.current = !!user;
  if (!ready) return <Loading />;
  if (signedInOnArrival.current) return <Navigate to="/pantry" replace />;
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export function App() {
  const authed = (el: ReactNode) => <RequireAuth>{el}</RequireAuth>;
  return (
    <div className="shell">
      <ScrollToTop />
      <Routes>
        <Route path="/welcome" element={<PublicOnly><Manual /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><Signup /></PublicOnly>} />

        <Route path="/onboarding/diet" element={authed(<Diet />)} />
        <Route path="/pantry" element={authed(<Pantry />)} />
        <Route path="/pantry/add" element={authed(<AddItem />)} />
        <Route path="/scan" element={authed(<Scan />)} />
        <Route path="/scan/reading" element={authed(<ScanReading />)} />
        <Route path="/scan/review" element={authed(<ScanReview />)} />

        <Route path="/recipes" element={authed(<Recipes />)} />
        <Route path="/recipes/generate" element={authed(<Generate />)} />
        <Route path="/recipes/unavailable" element={authed(<Unavailable />)} />
        <Route path="/recipes/:id" element={authed(<RecipeDetail />)} />
        <Route path="/saved" element={authed(<Saved />)} />
        <Route path="/saved/:id" element={authed(<SavedCheck />)} />
        <Route path="/list" element={authed(<Grocery />)} />

        <Route path="/profile" element={authed(<Profile />)} />
        <Route path="/profile/diet" element={authed(<Diet fromProfile />)} />
        <Route path="/profile/privacy" element={authed(<Privacy />)} />
        <Route path="/profile/manual" element={authed(<Manual fromProfile />)} />

        <Route path="*" element={<Navigate to="/pantry" replace />} />
      </Routes>
      <Toast />
    </div>
  );
}
