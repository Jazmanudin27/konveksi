import React from 'react';

export default function KaryawanMobile({ employees = [] }) {
  return (
    <div className="space-y-2">
      {employees.map((emp) => (
        <div
          key={emp.id}
          className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between"
        >
          <div>
            <div className="font-bold text-xs text-slate-900">{emp.nama}</div>
            <div className="text-[11px] text-slate-500">
              {emp.bagian} • {emp.kategori}
            </div>
            <div className="text-[10px] text-cyan-700 mt-0.5">{emp.telepon || '-'}</div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {emp.status || 'Aktif'}
          </span>
        </div>
      ))}

      {employees.length === 0 && (
        <div className="bg-white p-6 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
          Belum ada data karyawan
        </div>
      )}
    </div>
  );
}

