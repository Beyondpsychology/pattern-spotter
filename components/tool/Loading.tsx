export function SkeletonHypotheses() {
  return (
    <div>
      <div className="h-8 w-2/3 mx-auto bg-dark/10 rounded-full mb-3 animate-pulse" />
      <div className="h-4 w-1/2 mx-auto bg-dark/10 rounded-full mb-10 animate-pulse" />
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card">
            <div className="h-4 bg-dark/10 rounded-full mb-3 animate-pulse" />
            <div className="h-4 w-4/5 bg-dark/10 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpinnerWritingReading() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-dark/10 border-t-terracotta rounded-full animate-spin mb-6" />
      <p className="eyebrow text-lg">Writing your full reflection...</p>
    </div>
  );
}

export function SpinnerVerifyingPurchase() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-dark/10 border-t-terracotta rounded-full animate-spin mb-6" />
      <p className="eyebrow text-lg">Confirming your payment...</p>
    </div>
  );
}
