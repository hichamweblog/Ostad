'use client';

import { showToast } from '@/components/Toast';
import { ConfirmDialog } from './ConfirmDialog';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { AppState } from '@/lib/storage';
import { CurriculumUnit, GradeLevel } from '@/lib/types';
import { OFFICIAL_LEVELS, getMergedCurriculumUnits } from '@/lib/curriculum-data';
import { exportUnitToWordDoc } from '@/lib/doc-exporter';
import { getDriveFolderForLevel } from '@/lib/drive-curriculum-map';
import {
  BookOpen,
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  Search,
  Trash2,
  ExternalLink,
  FileUp,
  Layers,
  Compass,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  Calendar,
  Clock,
  Award,
  BookMarked,
  Sparkles,
  FileDown,
  FolderOpen,
  HardDrive,
  Eye
} from 'lucide-react';

interface LessonPreparationProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
  initialUnit?: CurriculumUnit | null;
  initialTab?: 'card' | 'pdf' | 'bank';
}

export const LessonPreparation: React.FC<LessonPreparationProps> = ({
  state,
  onUpdateState,
  initialUnit,
  initialTab
}) => {
  const allUnits = useMemo(() => getMergedCurriculumUnits(state.customUnits), [state.customUnits]);

  // Selected level & unit state
  const [selectedLevel, setSelectedLevel] = useState<GradeLevel>(
    initialUnit?.level || (state.classes.find(c => c.id === state.activeClassId)?.level) || '1AS_ARTS'
  );

  const unitsForLevel = useMemo(
    () => allUnits.filter(u => u.level === selectedLevel),
    [allUnits, selectedLevel]
  );

  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    initialUnit?.id && initialUnit.level === selectedLevel
      ? initialUnit.id
      : unitsForLevel[0]?.id || ''
  );

  // Active view tab: 'card' (official ministerial card) | 'pdf' (embedded PDF) | 'bank' (reference bank)
  const [activeTab, setActiveTab] = useState<'card' | 'pdf' | 'bank'>(initialTab || 'card');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync when prop changes
  useEffect(() => {
    if (initialTab) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(initialTab);
    }
  }, [initialTab, initialUnit]);
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [pdfUploadNotice, setPdfUploadNotice] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current selected unit
  const currentUnit: CurriculumUnit | undefined =
    unitsForLevel.find(u => u.id === selectedUnitId) || unitsForLevel[0];

  // Current attached PDF for this unit (local custom override or official Google Drive PDF)
  const attachedPdf = currentUnit ? state.unitPdfFiles?.[currentUnit.id] : undefined;
  const activePdfUrl = attachedPdf?.fileDataUrl || attachedPdf?.fileUrl || currentUnit?.drivePreviewUrl || currentUnit?.pdfUrl || null;
  const directViewUrl = currentUnit?.driveViewUrl || activePdfUrl;
  const directDownloadUrl = currentUnit?.driveDownloadUrl || (attachedPdf?.fileDataUrl ? attachedPdf.fileDataUrl : undefined);
  const isGoogleDrivePdf = Boolean(currentUnit?.driveFileId && !attachedPdf?.fileDataUrl);
  const levelFolderInfo = getDriveFolderForLevel(selectedLevel);

  // Change level
  const handleSelectLevel = (lvl: GradeLevel) => {
    setSelectedLevel(lvl);
    const firstUnit = allUnits.find(u => u.level === lvl);
    if (firstUnit) {
      setSelectedUnitId(firstUnit.id);
    }
  };

  // Change unit
  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setPdfUploadNotice(null);
  };

  // Previous & Next unit navigation
  const currentIndex = unitsForLevel.findIndex(u => u.id === selectedUnitId);
  const handlePrevUnit = () => {
    if (currentIndex > 0) {
      setSelectedUnitId(unitsForLevel[currentIndex - 1].id);
    }
  };
  const handleNextUnit = () => {
    if (currentIndex < unitsForLevel.length - 1) {
      setSelectedUnitId(unitsForLevel[currentIndex + 1].id);
    }
  };

  // Handle PDF file upload via file picker or drop
  const handleFileUpload = (file: File) => {
    if (!currentUnit) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('يرجى اختيار ملف بصيغة PDF فقط (.pdf)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const fileName = file.name;
      const fileSize = file.size;

      onUpdateState(prev => ({
        ...prev,
        unitPdfFiles: {
          ...(prev.unitPdfFiles || {}),
          [currentUnit.id]: {
            fileName,
            fileDataUrl: dataUrl,
            uploadedAt: new Date().toISOString().split('T')[0]
          }
        }
      }));

      setPdfUploadNotice(`تم إرفاق ملف المذكرة «${fileName}» بنجاح للوحدة.`);
      setActiveTab('pdf');
      setTimeout(() => setPdfUploadNotice(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  // Handle URL PDF input
  const handleSavePdfUrl = () => {
    if (!currentUnit || !urlInput.trim()) return;
    const url = urlInput.trim();

    onUpdateState(prev => ({
      ...prev,
      unitPdfFiles: {
        ...(prev.unitPdfFiles || {}),
        [currentUnit.id]: {
          fileName: `مذكرة_${currentUnit.title}.pdf`,
          fileUrl: url,
          uploadedAt: new Date().toISOString().split('T')[0]
        }
      }
    }));

    setUrlInput('');
    setShowUrlInput(false);
    setPdfUploadNotice('تم ربط رابط ملف المذكرة بنجاح.');
    setActiveTab('pdf');
    setTimeout(() => setPdfUploadNotice(null), 4000);
  };

  // Delete attached PDF
  const handleDeletePdf = () => {
    if (!currentUnit || !deleteConfirmId) return;
    onUpdateState(prev => {
      const nextPdfs = { ...(prev.unitPdfFiles || {}) };
      delete nextPdfs[currentUnit.id];
      return {
        ...prev,
        unitPdfFiles: nextPdfs
      };
    });
    setPdfUploadNotice('تمت إزالة ملف الـ PDF من هذه الوحدة.');
    setTimeout(() => setPdfUploadNotice(null), 3000);
    setDeleteConfirmId(null);
  };

  // Word (.doc) Export of official lesson card
  const handleExportWord = () => {
    if (!currentUnit) return;
    exportUnitToWordDoc(currentUnit, state.profile);
  };

  // Copy full card content to clipboard
  const handleCopyCard = () => {
    if (!currentUnit) return;
    const text = `بطاقة المذكرة البيداغوجية: ${currentUnit.title}
المستوى: ${currentUnit.level} | الميدان: ${currentUnit.domain}
الحجم الساعي: ${currentUnit.hourlyVolume} سا
الهدف التعلمي: ${currentUnit.learningObjective || currentUnit.targetedCompetence || ''}

الموارد المستهدفة:
${(currentUnit.targetedResources || currentUnit.learningObjectives || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}

آلية تنفيذ التعلمات:
${(currentUnit.implementationMechanisms || []).map(m => `• ${m}`).join('\n')}

توجيهات خاصة بالأستاذ:
${(currentUnit.teacherDirectives || currentUnit.pedagogicalDirectives || []).map(d => `• ${d}`).join('\n')}

مؤشرات الأداء والتقويم:
${(currentUnit.indicators || []).map(ind => `• ${ind}`).join('\n')}

السندات والنصوص الشرعية المؤطرة:
${(currentUnit.referenceTexts || []).map(t => `« ${t} »`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered units in Reference Bank
  const filteredBankUnits = useMemo(() => {
    if (!searchQuery.trim()) return unitsForLevel;
    const q = searchQuery.toLowerCase();
    return unitsForLevel.filter(
      u =>
        u.title.toLowerCase().includes(q) ||
        u.domain.toLowerCase().includes(q) ||
        (u.learningObjective && u.learningObjective.toLowerCase().includes(q)) ||
        (u.targetedResources && u.targetedResources.some(r => r.toLowerCase().includes(q))) ||
        (u.referenceTexts && u.referenceTexts.some(t => t.toLowerCase().includes(q)))
    );
  }, [unitsForLevel, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6" id="lesson-preparation-container">
      {/* Top Header & Level Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#E3F1F7] text-[#2E7D9B]">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              المذكرات
            </h2>
          </div>
        </div>

        {/* Level Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {OFFICIAL_LEVELS.map(lvl => {
            const isSelected = selectedLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                onClick={() => handleSelectLevel(lvl.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A1C1E] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span>{lvl.id === '1AS_ARTS' ? '1AS آداب (2 سا)' : lvl.id === '1AS_SCIENCE' ? '1AS علوم (1 سا)' : lvl.id === '2AS' ? '2AS ثانية (2 سا)' : '3AS بكالوريا (2 سا)'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Unit Selection & Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col gap-3">
          {/* Row 1: Label + Prev/Next navigation */}
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-primary" />
              <span>الوحدة التعلمية:</span>
            </label>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handlePrevUnit}
                disabled={currentIndex <= 0}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="الوحدة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextUnit}
                disabled={currentIndex >= unitsForLevel.length - 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="الوحدة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Full-width unit select dropdown */}
          <select
            value={selectedUnitId}
            onChange={e => handleSelectUnit(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-[#1A1C1E] focus:ring-1 focus:ring-[#1A1C1E] cursor-pointer"
          >
            {unitsForLevel.map(unit => {
              const hasPdf = Boolean(state.unitPdfFiles?.[unit.id] || unit.driveFileName || unit.pdfUrl);
              return (
                <option key={unit.id} value={unit.id}>
                  الوحدة {unit.unitNumber}: {unit.title} ({unit.hourlyVolume} سا) {hasPdf ? '— 📄 [مدمجة]' : ''}
                </option>
              );
            })}
          </select>

          {/* Tab Navigation: Official Card vs Embedded PDF vs Bank */}
          <div className="flex items-center gap-2 flex-wrap shrink-0 w-full sm:w-auto">
            <div role="tablist" className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:w-auto bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              <button
                role="tab"
                aria-selected={activeTab === 'card'}
                onClick={() => setActiveTab('card')}
                className={`flex items-center justify-center w-full sm:w-auto gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'card'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-primary" />
                <span>البطاقة</span>
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'pdf'}
                onClick={() => setActiveTab('pdf')}
                className={`flex items-center justify-center w-full sm:w-auto gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                  activeTab === 'pdf'
                    ? 'bg-white text-[#1A1C1E] shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>المذكرة</span>
                {activePdfUrl && (
                  <span className="w-2 h-2 rounded-full bg-emerald-primary animate-pulse" />
                )}
              </button>

              <button
                role="tab"
                aria-selected={activeTab === 'bank'}
                onClick={() => setActiveTab('bank')}
                className={`flex items-center justify-center w-full sm:w-auto gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'bank'
                    ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookMarked className="w-3.5 h-3.5 text-gold" />
                <span>الفهرس</span>
              </button>
            </div>

            {/* Word .doc Export & Copy Action */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleExportWord}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1C1E] text-white hover:bg-[#256A85] text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="تصدير المذكرة كملف Word (.doc) جاهز للتحرير والطباعة"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>تصدير Word (.doc)</span>
              </button>

              <button
                onClick={handleCopyCard}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                title="نسخ نص المذكرة"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-primary" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Notice alert */}
        {pdfUploadNotice && (
          <div className="mt-3 p-2.5 rounded-xl bg-[var(--primary-soft)] border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-primary shrink-0" />
            <span>{pdfUploadNotice}</span>
          </div>
        )}
      </div>

      {/* Active Unit Meta Ribbon */}
      {currentUnit && (
        <div className="bg-gradient-to-r from-[#1A1C1E] to-[#256A85] text-white rounded-xl p-5 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap text-xs text-amber-300 font-bold">
                <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20">
                  {currentUnit.sectionName}
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/20">
                  {currentUnit.domain}
                </span>
              </div>
              <h1 className="text-lg font-bold font-serif">
                الوحدة {currentUnit.unitNumber}: {currentUnit.title}
              </h1>
            </div>

            {/* Time & Hours Volume Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-2 rounded-xl text-center">
                <div className="text-[11px] text-amber-200 flex items-center justify-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>الزمن والحجم الساعي</span>
                </div>
                <div className="text-lg font-bold text-white">
                  {currentUnit.hourlyVolume} سا
                </div>
                <div className="text-[10px] text-slate-300">
                  {currentUnit.level === '1AS_SCIENCE' ? '1 سا / أسبوع' : '2 سا / أسبوع'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 1: OFFICIAL PEDAGOGICAL CARD (البطاقة) */}
      {/* ============================================================== */}
      {activeTab === 'card' && currentUnit && (
        <div className="space-y-6">
          {/* Section 1: الهدف التعلمي (Learning Objective) */}
          <div className="bg-white rounded-xl border-2 border-emerald-primary/30 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-[var(--primary-soft)] text-emerald-800">
                <Compass className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                1. الهدف التعلمي
              </h3>
            </div>
            <div className="p-4 rounded-xl bg-[var(--primary-soft)]/70 border border-emerald-200 text-emerald-950 font-serif text-sm leading-relaxed font-bold">
              {currentUnit.learningObjective ||
                currentUnit.targetedCompetence ||
                'يتعرف المتعلم على المفاهيم المركزية للوحدة، ويستخلص الأحكام والفوائد الشرعية، ويتمثل قيم الدرس في سلوكه اليومي.'}
            </div>
          </div>

          {/* Section 2: الموارد المستهدفة (Targeted Resources / المفاهيم والعناصر) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-blue-100 text-navy">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                2. الموارد المستهدفة (العناصر المفاهيمية وبناء التعلمات)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(currentUnit.targetedResources || currentUnit.learningObjectives || []).map((resource, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition-colors"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1A1C1E] text-white text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="text-xs font-medium text-slate-800 leading-relaxed font-serif">
                    {resource}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: آلية تنفيذ التعلمات (Learning Implementation Mechanisms) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Compass className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                3. آلية تنفيذ التعلمات (خطوات الإنجاز والأنشطة البيداغوجية)
              </h3>
            </div>

            <div className="space-y-3">
              {(currentUnit.implementationMechanisms || []).map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/70"
                >
                  <div className="p-1 rounded-md bg-amber-200 text-amber-900 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-800 leading-relaxed">
                    <span className="font-bold text-amber-950">المرحلة {idx + 1}: </span>
                    <span className="font-serif">{step}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: توجيهات خاصة بالأستاذ (Teacher Directives & Guidance) */}
          <div className="bg-white rounded-xl border-2 border-gold/60 p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-900">
                  <AlertCircle className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-amber-950">
                  4. توجيهات خاصة بالأستاذ (ليست عناصر مفاهيمية)
                </h3>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                تنبيهات المنهاج
              </span>
            </div>

            {currentUnit.teacherDirectives && currentUnit.teacherDirectives.length > 0 ? (
              <div className="space-y-2.5">
                {currentUnit.teacherDirectives.map((dir, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 leading-relaxed font-serif flex items-start gap-2"
                  >
                    <span className="text-gold font-bold shrink-0">•</span>
                    <span>{dir}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                لا توجد توجيهات استثنائية ملحقة؛ يلتزم الأستاذ بالحدود المسطرة في المنهاج والتدرجات السنوية.
              </p>
            )}
          </div>

          {/* Section 5: مؤشرات الأداء والتقويم (Performance Indicators) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-[var(--primary-soft)] text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                5. مؤشرات الأداء والتقويم
              </h3>
            </div>

            <div className="space-y-2">
              {(currentUnit.indicators || []).map((indicator, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                >
                  <span className="font-bold text-emerald-primary shrink-0">✓</span>
                  <span className="font-serif">{indicator}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: السندات والنصوص الشرعية المؤطرة (Scriptural References) */}
          {currentUnit.referenceTexts && currentUnit.referenceTexts.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="p-1.5 rounded-lg bg-[var(--primary-soft)] text-emerald-800">
                  <BookOpen className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  6. السندات والنصوص الشرعية المؤطرة للوحدة
                </h3>
              </div>

              <div className="space-y-2.5">
                {currentUnit.referenceTexts.map((text, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 font-serif text-xs sm:text-sm leading-relaxed"
                  >
                    « {text} »
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Direct CTA to Embedded PDF Tab */}
          <div className="bg-gradient-to-br from-slate-900 to-[#1A1C1E] text-white rounded-xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-right">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-primary/20 text-emerald-300 border border-emerald-primary/30 text-[10px] font-bold">
                  PDF مدمج
                </span>
                <span className="text-xs text-slate-300">مذكرة الوحدة بصيغة PDF</span>
              </div>
              <h4 className="text-base font-bold flex items-center justify-center sm:justify-start gap-2 pt-1">
                <FileUp className="w-5 h-5 text-[var(--primary)]" />
                <span>مذكرة الوحدة مدمجة وجاهزة للمعاينة والطباعة</span>
              </h4>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('pdf')}
                className="px-5 py-2.5 rounded-xl bg-emerald-primary hover:bg-emerald-primary text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>معاينة مذكرة الوحدة المدمجة</span>
              </button>
              {currentUnit.driveViewUrl && (
                <a
                  href={currentUnit.driveViewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="فتح المجلد"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: EMBEDDED PDF VIEWER & MANAGER (مستعرض ملفات PDF المدمجة) */}
      {/* ============================================================== */}
      {activeTab === 'pdf' && currentUnit && (
        <div className="space-y-4">
          {/* Top PDF Controls Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <span className="p-2.5 rounded-xl bg-[var(--primary-soft)] text-emerald-primary border border-emerald-200 shrink-0">
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 font-serif">
                    الوحدة {currentUnit.unitNumber}: «{currentUnit.title}»
                  </h3>
                  {isGoogleDrivePdf && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-blue-600" />
                      <span>Drive مدمج</span>
                    </span>
                  )}
                  {attachedPdf?.fileDataUrl && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-navy border border-purple-200 text-[10px] font-bold">
                      نسخة مخصصة مرفوعة
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {attachedPdf?.fileName
                    ? `تم رفع مذكرة مخصصة محلياً`
                    : currentUnit.driveFileName
                    ? `مذكرة الوحدة المدمجة`
                    : 'مذكرة بصيغة PDF'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
              {/* Google Drive View Button */}
              {directViewUrl && (
                <a
                  href={directViewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1C1E] hover:bg-[#256A85] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="فتح الملف"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح الملف</span>
                </a>
              )}

              {/* Direct Download PDF Button */}
              {directDownloadUrl && (
                <a
                  href={directDownloadUrl}
                  download={currentUnit.driveFileName || `مذكرة_${currentUnit.title}.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-primary hover:bg-emerald-primary text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  title="تحميل نسخة PDF مباشرة على جهازك"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل PDF</span>
                </a>
              )}

              {/* مجلد المستوى Link */}
              {levelFolderInfo && (
                <a
                  href={levelFolderInfo.folderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  title="فتح المجلد"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-gold" />
                  <span>مجلد المستوى ({levelFolderInfo.unitsCount} ملف)</span>
                </a>
              )}

              {/* Hidden file input for custom teacher override */}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              {/* Upload custom override button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                title="رفع نسختك الخاصة من جهازك"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>رفع نسخة خاصة</span>
              </button>

              {/* Direct link button */}
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                title="إدخال رابط ويب مباشر"
              >
                <span>رابط URL</span>
              </button>

              {/* Reset to official Drive if local override exists */}
              {attachedPdf && (
                <button
                  onClick={() => setDeleteConfirmId(currentUnit?.id || null)}
                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="حذف النسخة المرفوعة واستعادة المذكرة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* URL Input Drawer */}
          {showUrlInput && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="أدخل رابط ملف الـ PDF المباشر..."
                className="flex-1 w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-[#1A1C1E]"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSavePdfUrl}
                  className="px-3 py-1.5 rounded-lg bg-[#1A1C1E] text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  حفظ الرابط
                </button>
                <button
                  onClick={() => setShowUrlInput(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* PDF Viewer */}
          {activePdfUrl ? (
            <div className="bg-white rounded-xl border border-slate-300 p-2 shadow-sm">
              <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                <iframe
                  src={activePdfUrl}
                  className="w-full h-[840px] rounded-xl border-0 bg-white"
                  title={`مذكرة ${currentUnit.title}`}
                  allow="autoplay"
                />
              </div>

              {/* Viewer Footer Toolbar */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#1A1C1E]">الوحدة: {currentUnit.title}</span>
                  <span>•</span>
                  <span>الميدان: {currentUnit.domain}</span>
                  <span>•</span>
                  <span>الحجم: {currentUnit.hourlyVolume} سا</span>
                </div>
                <div className="flex items-center gap-3">
                  {directViewUrl && (
                    <a
                      href={directViewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-700 hover:text-slate-900 font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>فتح ملء الشاشة</span>
                    </a>
                  )}
                  {levelFolderInfo && (
                    <a
                      href={levelFolderInfo.folderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 hover:text-navy font-bold flex items-center gap-1"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>مجلد الوحدة</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-12 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-xl bg-[var(--primary-soft)] text-emerald-primary flex items-center justify-center border border-emerald-200">
                <FileUp className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-base font-bold text-slate-800">
                  إرفاق ملف مذكرة بصيغة PDF لهذه الوحدة
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  اسحب وأفلت ملف الـ PDF هنا أو انقر للاختيار من جهازك.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-primary hover:bg-emerald-primary text-white text-xs font-bold cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>اختر ملف PDF من جهازك</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: REFERENCE BANK & CURRICULUM INDEX (الفهرس) */}
      {/* ============================================================== */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          {/* مجلد المستوى Hero Banner & All-In-One Markdown Export */}
          {levelFolderInfo && (
            <div className="bg-gradient-to-r from-[#1A1C1E] to-[#134e4a] rounded-xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-3 rounded-xl bg-white/10 text-emerald-300 border border-white/10">
                  <FolderOpen className="w-6 h-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-primary/30 text-emerald-200 text-[10px] font-bold border border-[var(--primary)]/30">
                      مذكرات مدمجة
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      {levelFolderInfo.unitsCount} ملفات مذكرة مدمجة
                    </span>
                  </div>
                  <h4 className="text-base font-bold font-serif mt-0.5">
                    مجلد المذكرات: {levelFolderInfo.titleAr}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap shrink-0">
                <a
                  href={levelFolderInfo.folderUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-primary hover:bg-emerald-primary text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>فتح المجلد في Drive</span>
                </a>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث في وحدات المستوى، الأهداف التعلمية، أو السندات الشرعية..."
              className="w-full text-xs bg-transparent border-0 focus:outline-none text-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>

          {/* Unit Cards List */}
          <div className="space-y-3">
            {filteredBankUnits.map(unit => {
              const isSelected = unit.id === selectedUnitId;
              const hasPdf = Boolean(state.unitPdfFiles?.[unit.id] || unit.pdfUrl || unit.driveFileId);

              return (
                <div
                  key={unit.id}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedUnitId(unit.id);
                      setActiveTab('card');
                    }
                  }}
                  onClick={() => {
                    setSelectedUnitId(unit.id);
                    setActiveTab('card');
                  }}
                  className={`bg-white rounded-xl border p-4 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-primary ring-2 ring-emerald-primary/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          الوحدة {unit.unitNumber}
                        </span>
                        <span>•</span>
                        <span>{unit.domain}</span>
                        <span>•</span>
                        <span className="text-emerald-primary font-bold">{unit.hourlyVolume} سا</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 font-serif">
                        {unit.title}
                      </h4>
                      {unit.learningObjective && (
                        <p className="text-xs text-slate-600 font-serif line-clamp-2">
                          <span className="font-bold text-slate-800">الهدف: </span>
                          {unit.learningObjective}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedUnitId(unit.id);
                          setActiveTab('card');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                      >
                        البطاقة البيداغوجية
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedUnitId(unit.id);
                          setActiveTab('pdf');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-primary text-white hover:bg-emerald-primary text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>المذكرة</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
          <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="إزالة المرفق"
        message={`هل أنت متأكد من إزالة ملف الـ PDF المرفق لدرس «${currentUnit?.title || ''}»؟`}
        onConfirm={() => { if (deleteConfirmId) handleDeletePdf(); }}
        onCancel={() => setDeleteConfirmId(null)}
      />
</div>
  );
};
