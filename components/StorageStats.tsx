import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FileNode, FileType } from '../types';

interface StorageStatsProps {
  files: FileNode[];
  onClose: () => void;
}

export const StorageStatsModal: React.FC<StorageStatsProps> = ({ files, onClose }) => {
  // Calculate stats
  const dataMap = new Map<string, number>();
  
  files.forEach(file => {
    if (file.type !== FileType.FOLDER) {
      const current = dataMap.get(file.type) || 0;
      dataMap.set(file.type, current + (file.size || 0));
    }
  });

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#64748b'];
  
  const data = Array.from(dataMap.entries()).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  })).filter(d => d.value > 0);

  // Formatter for tooltip
  const formatSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Storage Breakdown</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            Close
          </button>
        </div>

        <div className="h-64 w-full">
           {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatSize(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
           ) : (
             <div className="h-full flex items-center justify-center text-slate-400">
               No file data to analyze
             </div>
           )}
        </div>

        <div className="mt-6 space-y-3">
          <h4 className="font-medium text-slate-700">Quick Tips</h4>
          <ul className="text-sm text-slate-500 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Large video files consume the most space.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Empty the trash to reclaim space immediately.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
