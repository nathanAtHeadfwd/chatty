"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Force Graph MUST be dynamically imported with SSR disabled in Next.js
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

export default function GraphVisualizer({ username }: { username: string }) {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });

    useEffect(() => {
        // Fetch the graph data
        fetch(`/api/graph?username=${username}`)
            .then(res => res.json())
            .then(data => {
                // Format for react-force-graph
                const nodes = data.map((n: any) => ({ id: n.id, name: n.label, val: 1 }));
                const links = data.flatMap((n: any) =>
                    n.neighbors.map((neighbor: string) => ({ source: n.id, target: neighbor.toLowerCase().replace(/\s+/g, '-') }))
                );
                setGraphData({ nodes, links });
            });
    }, [username]);

    return (
        <div className="w-full h-[600px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
            <ForceGraph2D
                graphData={graphData}
                nodeLabel="name"
                nodeAutoColorBy="id"
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                backgroundColor="#0f172a" // Tailwind slate-900
            />
        </div>
    );
}