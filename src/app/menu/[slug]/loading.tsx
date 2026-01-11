export default function Loading() {
    return (
        <main className="min-h-screen bg-radisson-light pb-24 relative overflow-hidden animate-fade-in">
            {/* Header Skeleton */}
            <div className="h-14 w-full bg-white/60 border-b border-gray-100 flex items-center justify-center mb-8">
                <div className="h-4 w-32 bg-gray-200/50 rounded animate-pulse" />
            </div>

            <div className="max-w-3xl lg:max-w-5xl mx-auto px-6 pt-4 space-y-12">
                {/* Category Sections Skeleton */}
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-6 w-40 bg-gray-200/80 rounded" />
                            <div className="h-[1px] flex-1 bg-gray-200/50" />
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm overflow-hidden">
                            <div className="divide-y divide-gray-50">
                                {[1, 2, 3].map((j) => (
                                    <div key={j} className="p-4 flex gap-4">
                                        <div className="flex-1 space-y-3 py-2">
                                            <div className="h-4 w-3/4 bg-gray-100 rounded" />
                                            <div className="h-3 w-1/2 bg-gray-50 rounded" />
                                            <div className="h-4 w-20 bg-gray-200/60 rounded mt-4" />
                                        </div>
                                        <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}
