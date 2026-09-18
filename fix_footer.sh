#!/bin/bash
cat << 'INNER_EOF' > footer_replacement.txt
        <footer className="py-6 px-4 pb-24 md:pb-6 text-center text-xs border-t border-[#E2E0D8] bg-white print:hidden">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-1">
            <div className="font-bold text-sm text-[#152A32] mb-1">معين</div>
            <div className="text-slate-500 font-medium">تطبيق مساعد لأستاذ العلوم الإسلامية في التعليم الثانوي</div>
            <div className="text-slate-600 font-bold mt-1">ثانوية الدكتور بن زرجب - تلمسان</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">2026 - 2027</div>
          </div>
        </footer>
INNER_EOF

# Replace the old footer with the new one
sed -i -e '/<footer/,/<\/footer>/c\' -e "$(cat footer_replacement.txt | sed 's/$/\\/')" -e '$s/\\$//' app/page.tsx
