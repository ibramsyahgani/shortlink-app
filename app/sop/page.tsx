'use client';

import { useState, useCallback, useEffect } from 'react';
import { SOPRow } from '@/components/sop/types';
import SopSidebar from '@/components/sop/SopSidebar';
import SopTable from '@/components/sop/SopTable';
import { getSopRows, createSopRow, updateSopRow, deleteSopRow, getSopFileUrl, SopRowApi } from '@/lib/api';

function toUIRow(r: SopRowApi): SOPRow {
  return {
    id: r.id,
    kategori: r.kategori,
    pic: r.pic,
    product: r.product,
    topik: r.topik,
    subTopik: r.sub_topik,
    sopDokumen: r.sop_dokumen,
    lampiran: r.files.map(f => ({
      id: f.id,
      fileId: f.id,
      name: f.file_name,
      url: getSopFileUrl(f.id),
      size: f.file_size,
      type: f.file_type,
      uploadedAt: f.uploaded_at,
    })),
  };
}

export default function SopPage() {
  const [rows, setRows] = useState<SOPRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeKategori, setActiveKategori] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSopRows()
      .then(data => setRows(data.map(toUIRow)))
      .catch(() => setError('Gagal memuat data SOP'))
      .finally(() => setLoading(false));
  }, []);

  const addRow = useCallback(async () => {
    try {
      setSaving(true);
      const newRow = await createSopRow({ kategori: activeKategori || '' });
      setRows(prev => [...prev, toUIRow(newRow)]);
    } catch {
      setError('Gagal menambah SOP');
    } finally {
      setSaving(false);
    }
  }, [activeKategori]);

  const handleRowsChange = useCallback(async (updated: SOPRow[]) => {
    // Find rows deleted by the table component
    const updatedIds = new Set(updated.map(r => r.id));
    const deletedIds = rows.filter(r => !updatedIds.has(r.id)).map(r => r.id);

    // Find updated cells
    const changed = updated.filter(u => {
      const orig = rows.find(r => r.id === u.id);
      if (!orig) return false;
      return orig.kategori !== u.kategori || orig.pic !== u.pic || orig.product !== u.product ||
        orig.topik !== u.topik || orig.subTopik !== u.subTopik || orig.sopDokumen !== u.sopDokumen;
    });

    // Apply optimistic update immediately
    if (activeKategori) {
      setRows(prev => {
        const activeIds = new Set(prev.filter(r => (r.kategori || 'Tanpa Kategori') === activeKategori).map(r => r.id));
        const kept = prev.filter(r => !activeIds.has(r.id));
        return [...kept, ...updated];
      });
    } else {
      setRows(updated);
    }

    // Sync to server in background
    try {
      await Promise.all([
        ...deletedIds.map(id => deleteSopRow(id)),
        ...changed.map(r => updateSopRow(r.id, {
          kategori: r.kategori, pic: r.pic, product: r.product,
          topik: r.topik, subTopik: r.subTopik, sopDokumen: r.sopDokumen,
        })),
      ]);
    } catch {
      setError('Gagal menyimpan perubahan');
    }
  }, [rows, activeKategori]);

  const handleFilesChange = useCallback((rowId: string, files: SOPRow['lampiran']) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, lampiran: files } : r));
  }, []);

  const filteredRows = activeKategori
    ? rows.filter(r => (r.kategori || 'Tanpa Kategori') === activeKategori)
    : rows;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SopSidebar
        rows={rows}
        activeKategori={activeKategori}
        onKategoriClick={setActiveKategori}
        onAddRow={addRow}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Page Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {activeKategori ? `Kategori: ${activeKategori}` : 'Semua SOP'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {filteredRows.length} dokumen SOP
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-blue-500 animate-pulse">Menyimpan...</span>}
            {error && (
              <span className="text-xs text-red-500 bg-red-50 px-3 py-1 rounded-full flex items-center gap-1">
                ⚠️ {error}
                <button onClick={() => setError('')} className="ml-1 hover:text-red-700">✕</button>
              </span>
            )}
            <button
              onClick={addRow}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <span>+</span> Tambah SOP
            </button>
          </div>
        </header>

        {/* Loading */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-3 animate-pulse">📋</div>
              <p className="text-sm">Memuat data SOP...</p>
            </div>
          </div>
        ) : (
          <SopTable
            rows={filteredRows}
            onRowsChange={handleRowsChange}
            onFilesChange={handleFilesChange}
          />
        )}
      </main>
    </div>
  );
}
