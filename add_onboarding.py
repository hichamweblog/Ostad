import re

with open('components/Dashboard.tsx', 'r') as f:
    content = f.read()

target = """      {/* Quick Status / Next Class Indicator */}"""

replacement = """      {/* Onboarding Banner for New Teachers */}
      {state.classes.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-600 to-[#0D2C3B] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-3">مرحباً بك أستاذ(ة) في منصة "سند الأستاذ"</h2>
            <p className="text-sm text-emerald-50 mb-6 max-w-2xl leading-relaxed">
              يبدو أنك مستخدم جديد أو قمت بإعادة تعيين بياناتك. للبدء بأسرع طريقة وأكثرها دقة، لا تقم بإدخال الأقسام يدوياً! 
              توجّه إلى <strong className="bg-white/20 px-1.5 py-0.5 rounded">إدارة الأفواج</strong> ثم <strong className="bg-white/20 px-1.5 py-0.5 rounded">التلاميذ</strong> وقم برفع ملف "الرقمنة (Excel)" مباشرة.
              المنصة ستقوم آلياً باكتشاف اسم القسم، مستواه، وشعبته، وتسجيل جميع التلاميذ بضغطة زر واحدة!
            </p>
            <button
              onClick={() => onNavigate('classes')}
              className="px-5 py-2.5 bg-white text-[#0D2C3B] hover:bg-emerald-50 font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-1 cursor-pointer flex items-center gap-2 text-sm w-fit"
            >
              <Users className="w-5 h-5" />
              <span>الذهاب إلى استيراد ملف الرقمنة</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Status / Next Class Indicator */}"""

content = content.replace(target, replacement)

with open('components/Dashboard.tsx', 'w') as f:
    f.write(content)

