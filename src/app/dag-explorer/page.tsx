/**
 * KALDRIX DAG Explorer Page
 * 
 * Debug and explore DAG structure, bundle history, and validator performance
 */

'use client';

import { DAGExplorer } from '@/components/dag-explorer/dag-explorer';

export default function DAGExplorerPage() {
  return (
    <div className="min-h-screen bg-background">
      <DAGExplorer />
    </div>
  );
}