/**
 * Shared route-level loading UI (loading.tsx). Invisible for the first 150 ms so fast
 * navigations never flash it, then fades in a quiet skeleton. Opacity only; reduced motion
 * shows it immediately without animation.
 */
export default function RouteLoading() {
  return (
    <div className="h-full bg-white cc-delayed-fade" role="status" aria-label="Loading">
      <div className="px-4 pt-5 space-y-3">
        <div className="h-6 w-1/3 rounded-lg bg-gray-100" />
        <div className="h-20 rounded-xl bg-gray-100" />
        <div className="h-20 rounded-xl bg-gray-100" />
        <div className="h-20 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
