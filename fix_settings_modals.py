import re

with open('components/SettingsSanad.tsx', 'r') as f:
    content = f.read()

# Add states for modals
state_insertion = """  const [newHolidayType, setNewHolidayType] = useState<'national' | 'religious' | 'term'>('national');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHolidaysConfirm, setShowHolidaysConfirm] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState('');"""

content = content.replace("  const [newHolidayType, setNewHolidayType] = useState<'national' | 'religious' | 'term'>('national');", state_insertion)


# Replace handleClearClassesData
clear_data_target = """  const handleClearClassesData = () => {
    if (confirm('تنبيه: سيتم مسح جميع بيانات الأقسام والتلاميذ والغيابات والعلامات فقط، مع الإبقاء على ملفك المهني وإعداداتك. هل أنت متأكد؟')) {
      onUpdateState(prev => ({
        ...prev,
        classes: [],
        students: [],
        sessions: [],
        grades: [],
        lessonProgress: [],
        activeClassId: null
      }));
      alert('تمت إعادة تعيين الأقسام والتلاميذ بنجاح.');
    }
  };"""

clear_data_replacement = """  const handleClearClassesData = () => {
    setShowResetConfirm(true);
  };

  const confirmClearClassesData = () => {
    onUpdateState(prev => ({
      ...prev,
      classes: [],
      students: [],
      sessions: [],
      grades: [],
      lessonProgress: [],
      activeClassId: null
    }));
    setShowResetConfirm(false);
    setShowSuccessMsg('تمت إعادة تعيين الأقسام والتلاميذ بنجاح.');
    setTimeout(() => setShowSuccessMsg(''), 3000);
  };"""

content = content.replace(clear_data_target, clear_data_replacement)


# Replace handleResetHolidays
reset_holidays_target = """  const handleResetHolidays = () => {
    if (confirm('هل ترغب في استعادة قائمة العطل الرسمية المعتمدة لوزارة التربية الوطنية؟')) {
      setCalendarSettings(prev => ({
        ...prev,
        holidays: DEFAULT_CALENDAR_SETTINGS.holidays
      }));
    }
  };"""

reset_holidays_replacement = """  const handleResetHolidays = () => {
    setShowHolidaysConfirm(true);
  };

  const confirmResetHolidays = () => {
    setCalendarSettings(prev => ({
      ...prev,
      holidays: DEFAULT_CALENDAR_SETTINGS.holidays
    }));
    setShowHolidaysConfirm(false);
  };"""

content = content.replace(reset_holidays_target, reset_holidays_replacement)


# Add modals at the bottom of the component, just before the closing </div> of the main return
modals_jsx = """
      {/* Custom Modals */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-rose-900">إعادة تعيين الأقسام</h3>
            </div>
            <div className="p-5 text-sm text-slate-700 leading-relaxed font-bold">
              هل أنت متأكد؟ سيتم مسح جميع بيانات الأقسام، والتلاميذ، والغيابات، والعلامات بشكل نهائي.
              <br/><br/>
              <span className="text-slate-500 font-normal">ملاحظة: سيتم الإبقاء على ملفك المهني وإعدادات التطبيق وجدول التوقيت.</span>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmClearClassesData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors text-sm shadow-sm cursor-pointer"
              >
                نعم، مسح البيانات
              </button>
            </div>
          </div>
        </div>
      )}

      {showHolidaysConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-amber-50 border-b border-amber-100 p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-full">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-amber-900">استعادة قائمة العطل</h3>
            </div>
            <div className="p-5 text-sm text-slate-700 leading-relaxed font-bold">
              هل ترغب في استعادة قائمة العطل الرسمية المعتمدة لوزارة التربية الوطنية؟
              سيتم إلغاء أي تعديلات قمت بها.
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowHolidaysConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmResetHolidays}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors text-sm shadow-sm cursor-pointer"
              >
                نعم، استعادة
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessMsg && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">{showSuccessMsg}</span>
        </div>
      )}
    </div>
  );
};"""

content = re.sub(r'    </div>\n  \);\n};\s*$', modals_jsx, content)


with open('components/SettingsSanad.tsx', 'w') as f:
    f.write(content)

