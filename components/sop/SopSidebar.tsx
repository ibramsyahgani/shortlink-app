'use client';

import { SOPRow } from './types';

interface SopSidebarProps {
  rows: SOPRow[];
  activeKategori: string | null;
  onKategoriClick: (kategori: string | null) => void;
  onAddRow: () => void;
}

const ICONS: Record<string, string> = {
  'HR': '👥',
  'IT': '💻',
  'Finance': '💰',
  'Operations': '⚙️',
  'Marketing': '📣',
  'Legal': '⚖️',
  'Default': '📁',
};

export default function SopSidebar({ rows, activeKategori, onKategoriClick, onAddRow }: SopSidebarProps) {
  const kategoriCounts = rows.reduce<Record<string, number>>((acc, row) => {
    const k = row.kategori || 'Tanpa Kategori';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const totalFiles = rows.reduce((acc, row) => acc + row.lampiran.length, 0);

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">📋</span>
          <h1 className="text-lg font-bold text-gray-900">SOP Manager</h1>
        </div>
        <p className="text-xs text-gray-500">Manajemen Dokumen SOP</p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={onAddRow}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <span>+</span> Tambah SOP
        </button>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-blue-700">{rows.length}</div>
            <div className="text-xs text-blue-500">Total SOP</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2.5 text-center">
            <div className="text-xl font-bold text-green-700">{totalFiles}</div>
            <div className="text-xs text-green-500">File</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Kategori</p>

        {/* All */}
        <button
          onClick={() => onKategoriClick(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
            activeKategori === null
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <span>🗂️</span> Semua SOP
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeKategori === null ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
            {rows.length}
          </span>
        </button>

        {Object.entries(kategoriCounts).map(([kat, count]) => {
          const icon = ICONS[kat] || ICONS['Default'];
          const isActive = activeKategori === kat;
          return (
            <button
              key={kat}
              onClick={() => onKategoriClick(kat)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span>{icon}</span>
                <span className="truncate">{kat}</span>
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">SOP Manager v1.0</p>
      </div>
    </aside>
  );
}
