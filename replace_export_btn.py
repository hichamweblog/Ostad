with open('components/GradesAndEvaluation.tsx', 'r') as f:
    content = f.read()

target = """            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
              title="تصدير كشف النقاط وملف الرقمنة كـ Excel"
            >
              <Download className="w-4 h-4" />
              <span>Excel</span>
            </button>"""

replacement = """            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              onChange={handleDigitizationUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isExporting}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white text-xs font-bold shadow-xs cursor-pointer"
              title="حقن النقاط في ملف الرقمنة (Excel) المفرغ"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>حقن الرقمنة</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-xs cursor-pointer"
              title="استخراج كشف النقاط (ملف جديد)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">كشف (جديد)</span>
            </button>"""

content = content.replace(target, replacement)

with open('components/GradesAndEvaluation.tsx', 'w') as f:
    f.write(content)
