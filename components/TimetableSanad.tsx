'use client';

import React, { useState } from'react';
import { exportToDoc } from'@/lib/utils';
import { AppState } from'@/lib/storage';
import { TimetableSlot, ClassRoom } from'@/lib/types';
import {
 CalendarDays,
 Plus,
 Printer,
 Trash2,
 Edit2,
 X,
 Clock,
 MapPin,
 Users,
 CheckCircle2,
 SlidersHorizontal
} from'lucide-react';

interface TimetableSanadProps {
 state: AppState;
 onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

const MORNING_HOURS = [
 { start:'08:00', end:'09:00', label:'08:00 - 09:00'},
 { start:'09:00', end:'10:00', label:'09:00 - 10:00'},
 { start:'10:00', end:'11:00', label:'10:00 - 11:00'},
 { start:'11:00', end:'12:00', label:'11:00 - 12:00'}
];

const AFTERNOON_HOURS = [
 { start:'13:30', end:'14:30', label:'13:30 - 14:30'},
 { start:'14:30', end:'15:30', label:'14:30 - 15:30'},
 { start:'15:30', end:'16:30', label:'15:30 - 16:30'},
 { start:'16:30', end:'17:30', label:'16:30 - 17:30'}
];

const ALL_HOURS = [...MORNING_HOURS, ...AFTERNOON_HOURS];

const DAYS: { dayOfWeek: 0 | 1 | 2 | 3 | 4; name: string }[] = [
 { dayOfWeek: 0, name:'الأحد'},
 { dayOfWeek: 1, name:'الإثنين'},
 { dayOfWeek: 2, name:'الثلاثاء'},
 { dayOfWeek: 3, name:'الأربعاء'},
 { dayOfWeek: 4, name:'الخميس'}
];

export const TimetableSanad: React.FC<TimetableSanadProps> = ({
 state,
 onUpdateState
}) => {
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [filterMyHoursOnly, setFilterMyHoursOnly] = useState(false);
 const [mobileActiveDay, setMobileActiveDay] = useState<0 | 1 | 2 | 3 | 4>(0);

 // Form state for slot modal
 const [selectedDay, setSelectedDay] = useState<0 | 1 | 2 | 3 | 4>(0);
 const [selectedStartTime, setSelectedStartTime] = useState('08:00');
 const [selectedEndTime, setSelectedEndTime] = useState('09:00');
 const [selectedClassId, setSelectedClassId] = useState<string>(
 state.classes[0]?.id ||''
 );
 const [selectedRoom, setSelectedRoom] = useState('القاعة 01');

 // Total weekly teaching hours
 const totalTeachingHours = state.timetable.length;

 // Filter columns if filterMyHoursOnly is active
 const activeHours = filterMyHoursOnly
 ? ALL_HOURS.filter(hour =>
 state.timetable.some(slot => slot.startTime === hour.start)
 )
 : ALL_HOURS;

 const handleOpenAddModal = (day?: 0 | 1 | 2 | 3 | 4, startHour?: string) => {
 if (day !== undefined) setSelectedDay(day);
 if (startHour) {
 setSelectedStartTime(startHour);
 const foundHour = ALL_HOURS.find(h => h.start === startHour);
 setSelectedEndTime(foundHour ? foundHour.end :'09:00');
 }
 const defaultCls = state.classes[0];
 if (defaultCls) {
 setSelectedClassId(defaultCls.id);
 setSelectedRoom(defaultCls.roomNumber ||'القاعة 01');
 }
 setIsModalOpen(true);
 };

 const handleSaveSlot = (e: React.FormEvent) => {
 e.preventDefault();
 if (!selectedClassId) return;

 const newSlot: TimetableSlot = {
 id:`tt-${Date.now()}`,
 classId: selectedClassId,
 dayOfWeek: selectedDay,
 startTime: selectedStartTime,
 endTime: selectedEndTime,
 room: selectedRoom
 };

 onUpdateState(prev => ({
 ...prev,
 // Replace existing slot at this exact day & time if any
 timetable: [
 ...prev.timetable.filter(
 s => !(s.dayOfWeek === selectedDay && s.startTime === selectedStartTime)
 ),
 newSlot
 ]
 }));

 setIsModalOpen(false);
 };

 const handleDeleteSlot = (slotId: string) => {
 onUpdateState(prev => ({
 ...prev,
 timetable: prev.timetable.filter(s => s.id !== slotId)
 }));
 };

 const handleExportDoc = () => {
 const html =`
 <div style="text-align: center; border-bottom: 2px solid #0d6547; padding-bottom: 12px; margin-bottom: 16px;">
 <h3 style="margin: 0; font-size: 13pt; font-weight: bold;">الجمهورية الجزائرية الديمقراطية الشعبية</h3>
 <h4 style="margin: 3px 0; font-size: 11.5pt; font-weight: bold; color: #0d6547;">وزارة التربية الوطنية</h4>
 <p style="margin: 2px 0; font-size: 10pt;">مديرية التربية لولاية ${state.profile.stateName ||'................'} — ${state.profile.schoolName ||'ثانوية التعليم الثانوي'}</p>
 <h2 style="margin: 10px 0 4px; font-size: 16pt; font-weight: bold; color: #0d6547; text-decoration: underline;">
 جدول التوقيت الأسبوعي للأستاذ(ة): ${state.profile.name ||'الاسم واللقب'}
 </h2>
 <p style="margin: 0; font-size: 10pt; color: #475569;">
 المادة: العلوم الإسلامية | الموسم الدراسي: ${state.profile.academicYear ||'2026/2027'} | الحجم الساعي الأسبوعي: ${totalTeachingHours} سا/أسبوع
 </p>
 </div>

 <table dir="rtl"style="width: 100%; border-collapse: collapse; text-align: center; font-size: 9.5pt; margin-top: 10px;">
 <thead>
 <tr style="background-color: #f8fafc;">
 <th rowspan="2"style="border: 1.5px solid #334155; padding: 6px; width: 10%; background-color: #f1f5f9; font-weight: bold;">اليوم</th>
 <th colspan="4"style="border: 1.5px solid #334155; padding: 6px; background-color: #ecfdf5; color: #065f46; font-weight: bold; font-size: 10pt;">الفترة الصباحية (08:00 - 12:00)</th>
 <th colspan="4"style="border: 1.5px solid #334155; padding: 6px; background-color: #fffbeb; color: #92400e; font-weight: bold; font-size: 10pt;">الفترة المسائية (13:30 - 17:30)</th>
 </tr>
 <tr style="background-color: #f1f5f9;">
 ${MORNING_HOURS.map(h =>`<th style="border: 1.5px solid #334155; padding: 4px; font-weight: bold; font-size: 8.5pt;">${h.label}</th>`).join('')}
 ${AFTERNOON_HOURS.map(h =>`<th style="border: 1.5px solid #334155; padding: 4px; font-weight: bold; font-size: 8.5pt;">${h.label}</th>`).join('')}
 </tr>
 </thead>
 <tbody>
 ${DAYS.map(day =>`
 <tr>
 <td style="border: 1.5px solid #334155; padding: 8px 4px; font-weight: bold; background-color: #f8fafc;">${day.name}</td>
 ${ALL_HOURS.map(hour => {
 const slot = state.timetable.find(s => s.dayOfWeek === day.dayOfWeek && (s.startTime === hour.start || s.startTime.startsWith(hour.start.substring(0, 2))));
 if (!slot) return'<td style="border: 1.5px solid #334155; padding: 6px; background-color: #ffffff;">-</td>';
 const cls = state.classes.find(c => c.id === slot.classId);
 return`
 <td style="border: 1.5px solid #334155; padding: 6px; background-color: #f0fdf4; vertical-align: middle;">
 <div style="font-weight: bold; font-size: 10pt; color: #0d6547;">${cls?.name ||'فوج دراسي'}</div>
 <div style="font-size: 8pt; color: #475569;">${cls?.stream ||''}</div>
 <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">${slot.room || cls?.roomNumber ||'القاعة'}</div>
 </td>
`;
 }).join('')}
 </tr>
`).join('')}
 </tbody>
 </table>

 <!-- Official Validation & Stamps -->
 <table dir="rtl"style="width: 100%; border-collapse: collapse; margin-top: 28px;">
 <tr>
 <td style="width: 33%; text-align: center; border: 1px dashed #94a3b8; padding: 14px; vertical-align: top;">
 <p style="margin: 0 0 40px; font-weight: bold; font-size: 10pt;">توقيع الأستاذ(ة):</p>
 <p style="margin: 0; font-size: 8.5pt; color: #64748b;">حرر في: .... / .... / 2026</p>
 </td>
 <td style="width: 33%; text-align: center; border: 1px dashed #94a3b8; padding: 14px; vertical-align: top;">
 <p style="margin: 0 0 40px; font-weight: bold; font-size: 10pt;">تأشيرة مدير المؤسسة:</p>
 <p style="margin: 0; font-size: 8.5pt; color: #64748b;">(الختم والتوقيع)</p>
 </td>
 <td style="width: 33%; text-align: center; border: 1px dashed #94a3b8; padding: 14px; vertical-align: top;">
 <p style="margin: 0 0 40px; font-weight: bold; font-size: 10pt;">تأشيرة مفتش التربية الوطنية:</p>
 <p style="margin: 0; font-size: 8.5pt; color: #64748b;">(الختم والتوقيع)</p>
 </td>
 </tr>
 </table>
`;

 exportToDoc(html,`جدول_التوقيت_الاسبوعي_${(state.profile.name ||'الأستاذ').replace(/\s+/g,'_')}`, {
 landscape: true,
 title:'جدول التوقيت الأسبوعي'
 });
 };

 return (
 <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6"id="sanad-timetable-view">
 {/* Top Header Card */}
 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div>
 <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
 <CalendarDays className="w-5 h-5 text-[#0d6547]"/>
 جدول التوقيت الأسبوعي
 </h2>
 <p className="text-xs text-slate-500 mt-1">
 {state.profile.academicYear ||'2026/2027'} · <span className="font-bold text-[#0d6547]">{totalTeachingHours} ساعة تدريس أسبوعياً</span>
 </p>
 </div>

 <div className="flex items-center gap-2.5 flex-wrap">
 {/* Toggle filter */}
 <button
 onClick={() => setFilterMyHoursOnly(prev => !prev)}
 className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
 filterMyHoursOnly
 ?'bg-emerald-50 text-[#0d6547] border-emerald-300 shadow-xs'
 :'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
 }`}
 >
 <SlidersHorizontal className="w-3.5 h-3.5"/>
 <span>اعرض ساعات حصصي فقط</span>
 </button>

 {/* Export Button */}
 <button
 onClick={handleExportDoc}
 className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
 >
 <Printer className="w-3.5 h-3.5 text-slate-500"/>
 <span>تصدير إلى ملف doc</span>
 </button>

 {/* Add Session Button */}
 <button
 onClick={() => handleOpenAddModal()}
 className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0d6547] hover:bg-[#0b543b] text-white transition-colors shadow-xs cursor-pointer"
 id="btn-add-timetable-slot"
 >
 <Plus className="w-4 h-4"/>
 <span>إضافة حصة إلى الجدول</span>
 </button>
 </div>
 </div>

 {/* 1. Mobile-First Daily Schedule View (Screens < 1024px): ZERO Horizontal Scrolling */}
 <div className="block lg:hidden space-y-4">
 {/* Day Selector Pills */}
 <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
 {DAYS.map(day => {
 const daySlotCount = state.timetable.filter(s => s.dayOfWeek === day.dayOfWeek).length;
 const isSelected = mobileActiveDay === day.dayOfWeek;

 return (
 <button
 key={day.dayOfWeek}
 onClick={() => setMobileActiveDay(day.dayOfWeek)}
 className={`flex-1 min-w-[62px] py-2 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
 isSelected
 ?'bg-[#0d6547] text-white shadow-xs'
 :'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
 }`}
 >
 <span>{day.name}</span>
 <span
 className={`text-[10px] font-mono px-1.5 rounded-full ${
 isSelected
 ?'bg-white/20 text-white'
 :'bg-slate-100 text-slate-500'
 }`}
 >
 {daySlotCount}
 </span>
 </button>
 );
 })}
 </div>

 {/* Selected Day Slots List */}
 {(() => {
 const daySlots = state.timetable
 .filter(s => s.dayOfWeek === mobileActiveDay)
 .sort((a, b) => a.startTime.localeCompare(b.startTime));

 const selectedDayName = DAYS.find(d => d.dayOfWeek === mobileActiveDay)?.name ||'';

 return (
 <div className="space-y-3">
 <div className="flex items-center justify-between text-xs text-slate-600 px-1">
 <span className="font-bold">
 حصص يوم {selectedDayName}: <strong className="text-slate-900">{daySlots.length} حصة</strong>
 </span>
 <button
 onClick={() => handleOpenAddModal(mobileActiveDay)}
 className="text-[#0d6547] hover:text-[#0b543b] font-bold flex items-center gap-1 text-xs cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5"/>
 <span>إضافة حصة</span>
 </button>
 </div>

 {daySlots.length === 0 ? (
 <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
 <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-lg">
 📅
 </div>
 <div className="text-xs font-bold text-slate-700">لا توجد حصص مسجلة يوم {selectedDayName}</div>
 <p className="text-[11px] text-slate-400">يمكنك إضافة حصص هذا اليوم لتنظيم توقيتك الأسبوعي</p>
 <button
 onClick={() => handleOpenAddModal(mobileActiveDay)}
 className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0d6547] text-white text-xs font-bold shadow-xs cursor-pointer"
 >
 <Plus className="w-4 h-4"/>
 <span>إضافة حصة ليوم {selectedDayName}</span>
 </button>
 </div>
 ) : (
 daySlots.map(slot => {
 const slotClass = state.classes.find(c => c.id === slot.classId);

 return (
 <div
 key={slot.id}
 className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3"
 >
 <div className="flex items-center gap-3 min-w-0">
 {/* Time Pill */}
 <div className="w-16 text-center py-2 px-1 rounded-xl bg-slate-100 font-mono text-[11px] font-black text-slate-800 shrink-0 border border-slate-200/80">
 <div>{slot.startTime}</div>
 <div className="text-[9px] text-slate-400 font-normal">إلى</div>
 <div>{slot.endTime}</div>
 </div>

 {/* Class and Room Info */}
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <span
 className="w-2.5 h-2.5 rounded-full shrink-0"
 style={{ backgroundColor: slotClass?.color ||'#0d6547'}}
 />
 <h4 className="font-bold text-sm text-slate-900 truncate">
 {slotClass?.name ||'فوج دراسي'}
 </h4>
 </div>
 <p className="text-xs text-slate-500 truncate mt-0.5">
 {slotClass?.stream ||''}
 </p>
 <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
 <MapPin className="w-3 h-3 text-slate-400"/>
 <span>{slot.room || slotClass?.roomNumber ||'القاعة'}</span>
 </div>
 </div>
 </div>

 {/* Action buttons */}
 <button
 onClick={() => handleDeleteSlot(slot.id)}
 className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
 title="حذف الحصة"
 >
 <Trash2 className="w-4 h-4"/>
 </button>
 </div>
 );
 })
 )}
 </div>
 );
 })()}
 </div>

 {/* 2. Desktop Timetable Matrix (Screens >= 1024px) */}
 <div className="hidden lg:block bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-right border-collapse min-w-[850px]"id="timetable-matrix-table">
 <thead>
 {/* Period Headers Row */}
 <tr className="bg-slate-50/80 border-b border-slate-200 text-xs text-slate-600 font-bold">
 <th className="p-3 w-28 text-center border-l border-slate-200">اليوم</th>
 <th
 colSpan={filterMyHoursOnly ? activeHours.filter(h => MORNING_HOURS.some(m => m.start === h.start)).length : MORNING_HOURS.length}
 className="p-2.5 text-center bg-emerald-50/70 text-emerald-900 font-bold text-xs border-l border-slate-200"
 >
 الفترة الصباحية (08:00 - 12:00)
 </th>
 <th
 colSpan={filterMyHoursOnly ? activeHours.filter(h => AFTERNOON_HOURS.some(a => a.start === h.start)).length : AFTERNOON_HOURS.length}
 className="p-2.5 text-center bg-amber-50/60 text-amber-900 font-bold text-xs"
 >
 الفترة المسائية (13:30 - 17:30)
 </th>
 </tr>
 {/* Hour Columns Row */}
 <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-700">
 <th className="p-2.5 text-center border-l border-slate-200">التوقيت</th>
 {activeHours.map(hour => (
 <th
 key={hour.start}
 className="p-2 text-center border-l border-slate-200 last:border-l-0 min-w-[95px]"
 >
 {hour.label}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-200 text-xs">
 {DAYS.map(day => (
 <tr key={day.dayOfWeek} className="hover:bg-slate-50/50 transition-colors">
 {/* Day Label */}
 <td className="p-3 font-bold text-slate-800 bg-slate-50/40 text-center border-l border-slate-200">
 {day.name}
 </td>

 {/* Hourly Slots */}
 {activeHours.map(hour => {
 const slot = state.timetable.find(
 s => s.dayOfWeek === day.dayOfWeek && (s.startTime === hour.start || s.startTime.startsWith(hour.start.substring(0, 2)))
 );
 const slotClass = slot
 ? state.classes.find(c => c.id === slot.classId)
 : null;

 return (
 <td
 key={hour.start}
 className="p-1.5 border-l border-slate-200 last:border-l-0 align-top h-24 relative group"
 >
 {slot && slotClass ? (
 <div
 className="h-full w-full rounded-xl p-2 flex flex-col justify-between transition-all border shadow-2xs relative group/card"
 style={{
 backgroundColor:`${slotClass.color ||'#0d6547'}12`,
 borderColor:`${slotClass.color ||'#0d6547'}40`
 }}
 >
 <div>
 <div
 className="font-bold text-xs truncate leading-tight"
 style={{ color: slotClass.color ||'#0d6547'}}
 >
 {slotClass.name}
 </div>
 <div className="text-[10px] text-slate-500 truncate mt-0.5">
 {slotClass.stream}
 </div>
 </div>

 <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/40 mt-1">
 <span className="flex items-center gap-0.5">
 <MapPin className="w-2.5 h-2.5 text-slate-400"/>
 {slot.room || slotClass.roomNumber ||'القاعة'}
 </span>
 <span className="font-mono text-[9px] text-slate-400">
 {slot.startTime}–{slot.endTime}
 </span>
 </div>

 {/* Delete Button on Hover */}
 <button
 onClick={() => handleDeleteSlot(slot.id)}
 className="absolute top-1 left-1 w-5 h-5 rounded-md bg-white/90 text-rose-500 hover:bg-rose-50 hover:text-rose-700 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity shadow-2xs cursor-pointer"
 title="حذف الحصة"
 >
 <Trash2 className="w-3 h-3"/>
 </button>
 </div>
 ) : (
 <button
 onClick={() => handleOpenAddModal(day.dayOfWeek, hour.start)}
 className="w-full h-full rounded-xl border border-dashed border-slate-200 hover:border-[#0d6547] hover:bg-emerald-50/40 flex flex-col items-center justify-center text-slate-300 hover:text-[#0d6547] transition-all cursor-pointer opacity-40 hover:opacity-100 group/btn"
 title={`إضافة حصة يوم ${day.name} في ${hour.label}`}
 >
 <Plus className="w-4 h-4 transition-transform group-hover/btn:scale-110"/>
 </button>
 )}
 </td>
 );
 })}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Modal: إضافة حصة إلى الجدول (Screenshot 13) */}
 {isModalOpen && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
 <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-right space-y-4">
 <div className="flex items-center justify-between pb-3 border-b border-slate-100">
 <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
 <CalendarDays className="w-5 h-5 text-[#0d6547]"/>
 <span>إضافة حصة إلى الجدول</span>
 </div>
 <button
 onClick={() => setIsModalOpen(false)}
 className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>

 <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
 {/* Day Selection */}
 <div>
 <label className="block font-bold text-slate-700 mb-1">اليوم</label>
 <select
 value={selectedDay}
 onChange={e => setSelectedDay(Number(e.target.value) as 0 | 1 | 2 | 3 | 4)}
 className="w-full px-3 py-2 border border-slate-200 ] rounded-xl bg-slate-50 ] focus:bg-white :bg-[#1A3140] focus:outline-none focus:ring-2 focus:ring-[#0d6547] text-slate-900"
 >
 {DAYS.map(d => (
 <option key={d.dayOfWeek} value={d.dayOfWeek}>
 {d.name}
 </option>
 ))}
 </select>
 </div>

 {/* Timing (من ... إلى ...) */}
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block font-bold text-slate-700 mb-1">من (البداية)</label>
 <select
 value={selectedStartTime}
 onChange={e => {
 setSelectedStartTime(e.target.value);
 const matchHour = ALL_HOURS.find(h => h.start === e.target.value);
 if (matchHour) {
 setSelectedEndTime(matchHour.end);
 }
 }}
 className="w-full px-3 py-2 border border-slate-200 ] rounded-xl bg-slate-50 ] focus:bg-white :bg-[#1A3140] focus:outline-none focus:ring-2 focus:ring-[#0d6547] text-slate-900"
 >
 {ALL_HOURS.map(h => (
 <option key={h.start} value={h.start}>
 {h.start}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="block font-bold text-slate-700 mb-1">إلى (النهاية)</label>
 <select
 value={selectedEndTime}
 onChange={e => setSelectedEndTime(e.target.value)}
 className="w-full px-3 py-2 border border-slate-200 ] rounded-xl bg-slate-50 ] focus:bg-white :bg-[#1A3140] focus:outline-none focus:ring-2 focus:ring-[#0d6547] text-slate-900"
 >
 {ALL_HOURS.map(h => (
 <option key={h.end} value={h.end}>
 {h.end}
 </option>
 ))}
 </select>
 </div>
 </div>


 {/* Class Selection */}
 <div>
 <label className="block font-bold text-slate-700 mb-1">الفوج التربوي</label>
 <select
 value={selectedClassId}
 onChange={e => {
 setSelectedClassId(e.target.value);
 const cls = state.classes.find(c => c.id === e.target.value);
 if (cls?.roomNumber) setSelectedRoom(cls.roomNumber);
 }}
 className="w-full px-3 py-2 border border-slate-200 ] rounded-xl bg-slate-50 ] focus:bg-white :bg-[#1A3140] focus:outline-none focus:ring-2 focus:ring-[#0d6547] text-slate-900"
 >
 {state.classes.map(cls => (
 <option key={cls.id} value={cls.id}>
 {cls.name} ({cls.stream})
 </option>
 ))}
 </select>
 </div>

 {/* Room Number */}
 <div>
 <label className="block font-bold text-slate-700 mb-1">القاعة</label>
 <input
 type="text"
 value={selectedRoom}
 onChange={e => setSelectedRoom(e.target.value)}
 placeholder="القاعة 20"
 className="w-full px-3 py-2 border border-slate-200 ] rounded-xl bg-slate-50 ] focus:bg-white :bg-[#1A3140] focus:outline-none focus:ring-2 focus:ring-[#0d6547] text-slate-900"
 />
 </div>

 {/* Action Buttons */}
 <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold transition-colors cursor-pointer"
 >
 إلغاء
 </button>
 <button
 type="submit"
 className="px-5 py-2 rounded-xl text-white bg-[#0d6547] hover:bg-[#0b543b] font-bold shadow-xs transition-colors cursor-pointer"
 >
 إضافة الحصة
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};
