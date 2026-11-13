import React from 'react';
import { Smartphone } from 'lucide-react';

/**
 * Placeholder view mobile untuk pengembangan fase berikutnya
 */
export default function MobileViewPlaceholder() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 text-center">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-sm">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <Smartphone className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">Mode Mobile (Upcoming)</h3>
        <p className="text-xs text-slate-500 mt-1">
          Tampilan khusus mobile sedang dalam tahap persiapan untuk rilis mendatang.
        </p>
      </div>
    </div>
  );
}

