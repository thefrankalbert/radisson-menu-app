export default function Loading() {
    return (
        <main className="min-h-screen bg-radisson-light animate-fade-in">
            {/* Header Skeleton */}
            <div className="h-14 w-full bg-white/60 flex items-center justify-center">
                <div className="h-5 w-40 bg-gray-200/60 rounded animate-pulse" />
            </div>

            <div className="px-4 pt-6 space-y-8">
                {/* Hero Skeleton */}
                <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200/50 rounded-2xl animate-pulse" />

                {/* Category Pills Skeleton */}
                <div className="flex gap-3 overflow-hidden">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-10 w-24 bg-gray-100 rounded-full animate-pulse flex-shrink-0" />
                    ))}
                </div>

                {/* Featured Section Skeleton */}
                <div className="space-y-4">
                    <div className="h-5 w-32 bg-gray-200/70 rounded animate-pulse" />
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-40 flex-shrink-0 space-y-2">
                                <div className="h-32 w-full bg-gray-100 rounded-xl animate-pulse" />
                                <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                                <div className="h-3 w-1/2 bg-gray-50 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Venue Cards Skeleton */}
                <div className="space-y-4">
                    <div className="h-5 w-40 bg-gray-200/70 rounded animate-pulse" />
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 w-full bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
