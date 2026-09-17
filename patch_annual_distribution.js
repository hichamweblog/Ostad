const fs = require('fs');
let code = fs.readFileSync('components/AnnualDistribution.tsx', 'utf8');

const targetStr = `<div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">`;

const replacementStr = `
              {/* Desktop Table */}
              <div className="hidden lg:block border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border-collapse">`;

code = code.replace(targetStr, replacementStr);

const targetStrEnd = `                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>`;

const replacementStrEnd = `                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="block lg:hidden space-y-3 mt-3">
                {sec.units.map(({ unit, originalIndex, sched }) => {
                  return (
                    <div key={unit.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center text-xs font-black">
                            {String(unit.unitNumber).padStart(2, '0')}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-50/50 text-[#0d6547] border border-emerald-100 font-bold text-[10px]">
                            {sched.monthName} • {sched.weekName}
                          </span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                          {unit.hourlyVolume} سا
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {unit.domain}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 leading-snug">
                          {unit.title}
                        </h4>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                        <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                          <span className="font-bold text-slate-900 ml-1">الكفاءة:</span>
                          {unit.targetedCompetence || \`كفاءة الوحدة \${getCompetenceNumber(unit, originalIndex)}\`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>`;

code = code.replace(targetStrEnd, replacementStrEnd);

fs.writeFileSync('components/AnnualDistribution.tsx', code);
console.log("Patched AnnualDistribution.tsx");
