'use client';

import { useState, useCallback } from 'react';
import { SOPRow } from '@/components/sop/types';
import SopSidebar from '@/components/sop/SopSidebar';
import SopTable from '@/components/sop/SopTable';

const SAMPLE_DATA: SOPRow[] = [
  {
    id: crypto.randomUUID(),
    kategori: 'HR',
    pic: 'Budi Santoso',
    product: 'HRIS',
    topik: 'Rekrutmen',
    subTopik: 'Seleksi CV',
    sopDokumen: 'SOP-HR-001',
    lampiran: [],
  },
  {
    id: crypto.randomUUID(),
    kategori: 'IT',
    pic: 'Sari Dewi',
    product: 'ERP',
    topik: 'Infrastruktur',
    subTopik: 'Backup Data',
    sopDokumen: 'SOP-IT-001',
    lampiran: [],
  },
  {
    id: crypto.randomUUID(),
    kategori: 'Finance',
    pic: 'Andi Pratama',
    product: 'Accounting',
    topik: 'Laporan',
    subTopik: 'Laporan Bulanan',
    sopDokumen: 'SOP-FIN-001',
    lampiran: [],
  },
];

export default function SopPage() {
  const [rows, setRows] = useState<SOPRow[]>(SAMPLE_DATA);
  const [activeKategori, setActiveKategori] = useState<string | null>(null);

  const addRow = useCallback(() => {
    const newRow: SOPRow = {
      id: crypto.randomUUID(),
      kategori: activeKategori || '',
      pic: '',
      product: '',
      topik: '',
      subTopik: '',
      sopDokumen: '',
      lampiran: [],
    };
    setRows(prev => [...prev, newRow]);
  }, [activeKategori]);

  const filteredRows = activeKategori
    ? rows.filter(r => (r.kategori || 'Tanpa Kategori') === activeKategori)
    : rows;

  const handleRowsChange = useCallback((updated: SOPRow[]) => {
    if (activeKategori) {
      // merge: replace only the filtered subset
      setRows(prev => {
        const ids = new Set(filteredRows.map(r => r.id));
        const kept = prev.filter(r => !ids.has(r.id));
        return [...kept, ...updated];
      });
    } else {
      setRows(updated);
    }
  }, [activeKategori, filteredRows]);

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
            <button
              onClick={addRow}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <span>+</span> Tambah SOP
            </button>
          </div>
        </header>

        {/* Table */}
        <SopTable rows={filteredRows} onRowsChange={handleRowsChange} />
      </main>
    </div>
  );
}
