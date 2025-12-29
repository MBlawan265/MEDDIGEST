"use client";

import { useSession } from "next-auth/react";

export default function DebugAuthPage() {
    const { data: session, status } = useSession();

    return (
        <div className="p-10">
            <h1 className="text-2xl font-bold mb-4">Auth Debug</h1>
            <pre className="bg-gray-100 p-4 rounded">
                {JSON.stringify({ status, session }, null, 2)}
            </pre>
        </div>
    );
}
