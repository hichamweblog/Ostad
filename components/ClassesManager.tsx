'use client';

import { showToast } from '@/components/Toast';
import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { AppState } from '@/lib/storage';
import { ClassRoom, GradeLevel, Student, TimetableSlot } from '@/lib/types';
import { parseDigitizationFile, isSchoolSummaryOrFooterRow } from '@/lib/excel-sync';
import { parseMoumtazeFile, ParsedMoumtazeResult } from '@/lib/moumtaze-sync';
import { isSameClass, isSameStudentName, getCanonicalClassName } from '@/lib/name-normalizer';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  X,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ClipboardPaste,
  UserCheck,
  CheckSquare,
  Square,
  Building2,
  Check,
  RotateCcw
} from 'lucide-react';

interface ClassesManagerProps {
  state: AppState;
  onUpdateState: (updater: (prev: AppState) => AppState) => void;
}

export const ClassesManager: React.FC<ClassesManagerProps> = ({
  state,
  onUpdateState
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'timetable' | 'students'>('classes');

  // Modal states for Class
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<ClassRoom> | null>(null);

  // Modal states for Timetable slot
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableSlot> | null>(null);

  // Modal states for Student
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);

  // Quick Paste modal state
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedNames, setPastedNames] = useState('');

  // Delete Confirmation Dialog state (Safe in-app modal instead of blocked window.confirm)
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'student' | 'class';
    id: string;
    name: string;
  } | null>(null);

  // Selected class for students sub-tab
  const [selectedClassId, setSelectedClassId] = useState<string>(
    state.activeClassId || (state.classes[0]?.id || '')
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const moumtazeFileInputRef = useRef<HTMLInputElement>(null);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Moumtaze Import States
  const [isMoumtazeModalOpen, setIsMoumtazeModalOpen] = useState(false);
  const [moumtazeData, setMoumtazeData] = useState<ParsedMoumtazeResult | null>(null);
  const [selectedMoumtazeClassIds, setSelectedMoumtazeClassIds] = useState<string[]>([]);
  const [isParsingMoumtaze, setIsParsingMoumtaze] = useState(false);

  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const activeClassObj = state.classes.find(c => c.id === selectedClassId);




  const classStudents = state.students
    .filter(s => s.classId === selectedClassId)
    .sort((a, b) => a.numberInList - b.numberInList);

  // ---------------------------------------------
  // Class Operations
  // ---------------------------------------------
  const handleOpenAddClass = () => {
    setEditingClass({
      id: `cls-${Date.now()}`,
      name: '',
      level: '3AS',
      stream: 'علوم تجريبية',
      roomNumber: 'القاعة 01',
      color: '#0d9488'
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClass({ ...cls });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = () => {
    if (!editingClass || !editingClass.name) return;
    
    // Unify class name on manual save
    const canonicalName = getCanonicalClassName(editingClass.name);
    const classToSave = { ...editingClass, name: canonicalName };

    onUpdateState(prev => {
      const idx = prev.classes.findIndex(c => c.id === editingClass.id);
      let updatedClasses = [...prev.classes];
      if (idx >= 0) {
        updatedClasses[idx] = classToSave as ClassRoom;
      } else {
        updatedClasses.push(classToSave as ClassRoom);
      }
      return {
        ...prev,
        classes: updatedClasses,
        activeClassId: prev.activeClassId || classToSave.id || null
      };
    });
    setIsClassModalOpen(false);
    setEditingClass(null);
  };

  const promptDeleteClass = (cls: ClassRoom) => {
    setDeleteConfirmDialog({
      isOpen: true,
      type: 'class',
      id: cls.id,
      name: `${cls.name} (${cls.stream})`
    });
  };

  // ---------------------------------------------
  // Timetable Operations
  // ---------------------------------------------
  const handleOpenAddSlot = (dayOfWeek: number) => {
    const validDay = (dayOfWeek >= 0 && dayOfWeek <= 4 ? dayOfWeek : 0) as 0 | 1 | 2 | 3 | 4;
    setEditingSlot({
      id: `slot-${Date.now()}`,
      classId: state.classes[0]?.id || '',
      dayOfWeek: validDay,
      startTime: '08:00',
      endTime: '09:00',
      room: state.classes[0]?.roomNumber?.replace('القاعة ', '') || '01'
    });
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = () => {
    if (!editingSlot || !editingSlot.classId) return;
    onUpdateState(prev => {
      const idx = prev.timetable.findIndex(s => s.id === editingSlot.id);
      let updatedSlots = [...prev.timetable];
      if (idx >= 0) {
        updatedSlots[idx] = editingSlot as TimetableSlot;
      } else {
        updatedSlots.push(editingSlot as TimetableSlot);
      }
      return { ...prev, timetable: updatedSlots };
    });
    setIsSlotModalOpen(false);
    setEditingSlot(null);
  };

  const handleDeleteSlot = (slotId: string) => {
    onUpdateState(prev => ({
      ...prev,
      timetable: prev.timetable.filter(s => s.id !== slotId)
    }));
  };

  // ---------------------------------------------
  // Student Operations & Excel / CSV Platform Import
  // ---------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseDigitizationFile(file);

      let targetClassIdToSelect: string | null = null;
      let summaryNotificationMsg: string | null = null;

      onUpdateState(prev => {
        const updatedClasses = [...prev.classes];
        let updatedStudents = [...prev.students];
        let totalNewStudentsAdded = 0;
        let totalExistingStudentsRetained = 0;
        const processedClassIds: string[] = [];

        const classColors = [
          '#0d9488', '#0284c7', '#d97706', '#7c3aed', '#e11d48',
          '#059669', '#4f46e5', '#ca8a04', '#2563eb', '#db2777'
        ];

        // Loop through all parsed classes from all sheets in the Excel file
        parsedData.classes.forEach((pClass, idx) => {
          // Check if class already exists by exact name or matching normalized name
          let classObj = updatedClasses.find(
            c => isSameClass(c.name, pClass.className)
          );

          // If not found, check if there's an unused placeholder class (e.g., "قسم جديد" with 0 students)
          if (!classObj) {
            const placeholderIdx = updatedClasses.findIndex(
              c => (c.name.includes('قسم جديد') || c.name.trim() === '') &&
                   !updatedStudents.some(s => s.classId === c.id) &&
                   !processedClassIds.includes(c.id)
            );
            if (placeholderIdx !== -1) {
              classObj = updatedClasses[placeholderIdx];
              classObj.name = pClass.className;
              classObj.level = pClass.level;
              classObj.stream = pClass.stream;
              classObj.color = classObj.color || classColors[(updatedClasses.length + idx) % classColors.length];
            }
          }

          // If still not found, create a brand new class
          if (!classObj) {
            const newClassId = `cls-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
            classObj = {
              id: newClassId,
              name: pClass.className,
              level: pClass.level,
              stream: pClass.stream,
              color: classColors[(updatedClasses.length + idx) % classColors.length],
            };
            updatedClasses.push(classObj);
          } else {
            // Update level and stream based on exact parsing
            classObj.level = pClass.level;
            classObj.stream = pClass.stream;
          }

          processedClassIds.push(classObj.id);

          // Process students for this specific class
          const existingStudentsInClass = updatedStudents.filter(s => s.classId === classObj!.id);
          const studentLookupByReg = new Map<string, Student>();
          const studentLookupByName = new Map<string, Student>();

          existingStudentsInClass.forEach(s => {
            if (s.regNumber) studentLookupByReg.set(s.regNumber, s);
            if (s.fullName) studentLookupByName.set(s.fullName.trim(), s);
          });

          pClass.students.forEach(importedStudent => {
            const matchByReg = importedStudent.regNumber ? studentLookupByReg.get(importedStudent.regNumber) : null;
            const matchByName =
              studentLookupByName.get(importedStudent.fullName.trim()) ||
              existingStudentsInClass.find(s => isSameStudentName(s.fullName, importedStudent.fullName));

            if (matchByReg || matchByName) {
              totalExistingStudentsRetained++;
              const targetExisting = matchByReg || matchByName;
              if (targetExisting && importedStudent.regNumber && !targetExisting.regNumber) {
                targetExisting.regNumber = importedStudent.regNumber;
                targetExisting.registrationNumber = importedStudent.regNumber;
              }
            } else {
              totalNewStudentsAdded++;
              const newStudent: Student = {
                ...importedStudent,
                id: `std-${classObj!.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                classId: classObj!.id, // STRICTLY ASSIGNED TO THIS CLASS ID!
              };
              updatedStudents.push(newStudent);
            }
          });
        });

        // Set the active class to the first imported class
        const firstClassId = processedClassIds[0] || prev.activeClassId || (updatedClasses.length > 0 ? updatedClasses[0].id : null);
        targetClassIdToSelect = firstClassId;

        // Summary notification
        summaryNotificationMsg = `تمت المزامنة بنجاح لـ ${parsedData.classes.length} أفواج تربوية: تمت إضافة ${totalNewStudentsAdded} تلميذاً وتحديث ${totalExistingStudentsRetained} تلميذاً في النظام.`;

        // Update profile if schoolName or academicYear were detected
        const updatedProfile = { ...prev.profile };
        if (parsedData.schoolName && (!prev.profile.schoolName || prev.profile.schoolName.includes('ثانوية'))) {
          updatedProfile.schoolName = parsedData.schoolName;
        }
        if (parsedData.academicYear) {
          updatedProfile.academicYear = parsedData.academicYear;
        }
        if (parsedData.stateName) {
          updatedProfile.stateName = parsedData.stateName;
        }

        return {
          ...prev,
          classes: updatedClasses,
          students: updatedStudents,
          activeClassId: firstClassId,
          profile: updatedProfile,
        };
      });

      // Safely update local component state outside the Page onUpdateState reducer
      if (targetClassIdToSelect) {
        setSelectedClassId(targetClassIdToSelect);
      }
      if (summaryNotificationMsg) {
        setImportNotification(summaryNotificationMsg);
      }
    } catch (err: any) {
      console.error('File import error:', err);
      showToast(err.message || 'حدث خطأ أثناء قراءة الملف. يرجى التأكد من أنه ملف الرقمنة الأصلي.', 'error');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ---------------------------------------------
  // Moumtaze (برنامج الممتاز) Import Handlers
  // ---------------------------------------------
  const handleMoumtazeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingMoumtaze(true);
    try {
      const result = await parseMoumtazeFile(file);
      if (result.classes.length === 0) {
        showToast('لم يتم العثور على أي قوائم أقسام داخل هذا الملف. يرجى التأكد من اختيار ملف برنامج الممتاز الصحيح.', 'warning');
        return;
      }

      setMoumtazeData(result);
      // Pre-select all detected classes so the teacher can easily keep what they teach
      setSelectedMoumtazeClassIds(result.classes.map(c => c.id));
      setIsMoumtazeModalOpen(true);
    } catch (err: any) {
      console.error('Error parsing Moumtaze file:', err);
      showToast('حدث خطأ أثناء قراءة ملف الممتاز: ' + (err.message || 'تأكد من سلامة ملف Excel'), 'error');
    } finally {
      setIsParsingMoumtaze(false);
      if (moumtazeFileInputRef.current) moumtazeFileInputRef.current.value = '';
    }
  };

  const handleToggleSelectMoumtazeClass = (id: string) => {
    setSelectedMoumtazeClassIds(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleSelectAllMoumtazeClasses = () => {
    if (!moumtazeData) return;
    setSelectedMoumtazeClassIds(moumtazeData.classes.map(c => c.id));
  };

  const handleDeselectAllMoumtazeClasses = () => {
    setSelectedMoumtazeClassIds([]);
  };

  const handleConfirmMoumtazeImport = () => {
    if (!moumtazeData || selectedMoumtazeClassIds.length === 0) {
      showToast('يرجى تحديد قسم واحد على الأقل للاستيراد.', 'warning');
      return;
    }

    const classesToImport = moumtazeData.classes.filter(c => selectedMoumtazeClassIds.includes(c.id));
    let targetClassIdToSelect: string | null = null;
    let totalAdded = 0;
    let totalUpdated = 0;

    onUpdateState(prev => {
      const updatedClasses = [...prev.classes];
      let updatedStudents = [...prev.students];
      const processedClassIds: string[] = [];

      const classColors = [
        '#0d9488', '#0284c7', '#d97706', '#7c3aed', '#e11d48',
        '#059669', '#4f46e5', '#ca8a04', '#2563eb', '#db2777'
      ];

      classesToImport.forEach((mClass, idx) => {
        // Check if class already exists by exact name or normalized matching
        let classObj = updatedClasses.find(c => isSameClass(c.name, mClass.className));

        // Check if placeholder class exists
        if (!classObj) {
          const placeholderIdx = updatedClasses.findIndex(
            c => (c.name.includes('قسم جديد') || c.name.trim() === '') &&
                 !updatedStudents.some(s => s.classId === c.id) &&
                 !processedClassIds.includes(c.id)
          );
          if (placeholderIdx !== -1) {
            classObj = updatedClasses[placeholderIdx];
            classObj.name = mClass.className;
            classObj.level = mClass.level;
            classObj.stream = mClass.stream;
            if (mClass.roomNumber) classObj.roomNumber = mClass.roomNumber;
            classObj.color = classObj.color || classColors[(updatedClasses.length + idx) % classColors.length];
          }
        }

        // If not found, create new class
        if (!classObj) {
          const newClassId = `cls-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
          classObj = {
            id: newClassId,
            name: mClass.className,
            level: mClass.level,
            stream: mClass.stream,
            roomNumber: mClass.roomNumber || 'القاعة 01',
            color: classColors[(updatedClasses.length + idx) % classColors.length],
          };
          updatedClasses.push(classObj);
        } else {
          // Update room number if detected from Moumtaze
          if (mClass.roomNumber) {
            classObj.roomNumber = mClass.roomNumber;
          }
          classObj.level = mClass.level;
          classObj.stream = mClass.stream;
        }

        processedClassIds.push(classObj.id);

        // Process students for this class
        const existingInClass = updatedStudents.filter(s => s.classId === classObj!.id);

        mClass.students.forEach(mStudent => {
          // Extra guard: ignore any summary rows like "مجموع الذكور والإناث", "ذكور", "إناث", "المجموع"
          if (isSchoolSummaryOrFooterRow(mStudent.fullName)) {
            return;
          }

          const existing = existingInClass.find(s => isSameStudentName(s.fullName, mStudent.fullName));
          if (existing) {
            totalUpdated++;
            existing.isRepeater = mStudent.isRepeater;
            if (mStudent.birthDate && !existing.birthDate) existing.birthDate = mStudent.birthDate;
            if (mStudent.gender) existing.gender = mStudent.gender;
            if (mStudent.address && !existing.notes) existing.notes = `العنوان: ${mStudent.address}`;
          } else {
            totalAdded++;
            const newStudent: Student = {
              id: `std-${classObj!.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              classId: classObj!.id,
              numberInList: mStudent.numberInList,
              fullName: mStudent.fullName,
              gender: mStudent.gender,
              birthDate: mStudent.birthDate,
              isRepeater: mStudent.isRepeater,
              notes: mStudent.address ? `العنوان: ${mStudent.address}` : undefined,
            };
            updatedStudents.push(newStudent);
          }
        });

        // Ensure all students in this class are strictly numbered 1..N starting from 1
        const allInThisClass = updatedStudents
          .filter(s => s.classId === classObj!.id)
          .sort((a, b) => (a.numberInList || 0) - (b.numberInList || 0));

        allInThisClass.forEach((st, sIdx) => {
          st.numberInList = sIdx + 1;
        });
      });

      const firstClassId = processedClassIds[0] || prev.activeClassId || (updatedClasses.length > 0 ? updatedClasses[0].id : null);
      targetClassIdToSelect = firstClassId;

      const updatedProfile = { ...prev.profile };
      if (moumtazeData.schoolName && (!prev.profile.schoolName || prev.profile.schoolName.includes('ثانوية'))) {
        updatedProfile.schoolName = moumtazeData.schoolName;
      }
      if (moumtazeData.academicYear) {
        updatedProfile.academicYear = moumtazeData.academicYear;
      }
      if (moumtazeData.stateName) {
        updatedProfile.stateName = moumtazeData.stateName;
      }

      return {
        ...prev,
        classes: updatedClasses,
        students: updatedStudents,
        activeClassId: firstClassId,
        profile: updatedProfile,
      };
    });

    if (targetClassIdToSelect) {
      setSelectedClassId(targetClassIdToSelect);
    }
    setImportNotification(
      `تم استيراد ${classesToImport.length} أفواج بنجاح من برنامج الممتاز (${totalAdded} تلميذاً جديداً، و ${totalUpdated} تلميذ تم تحديث بياناتهم وحفظ القاعات).`
    );
    setIsMoumtazeModalOpen(false);
    setMoumtazeData(null);
  };

  // Quick Paste Names Parser
  const handleQuickPasteNames = () => {
    if (!pastedNames.trim() || !selectedClassId) return;

    const lines = pastedNames
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    const newStudents: Student[] = [];
    let startNum = classStudents.length + 1;

    for (const line of lines) {
      // remove leading numbers if present (e.g., "1. بن ددوش صهيب" -> "بن ددوش صهيب")
      const cleaned = line.replace(/^[\d\s.\-_)\]]+/, '').trim();

      // Skip any statistical/summary lines (e.g. مجموع الذكور والإناث)
      if (isSchoolSummaryOrFooterRow(cleaned)) {
        continue;
      }

      if (cleaned.length > 1) {
        newStudents.push({
          id: `std-${selectedClassId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          classId: selectedClassId,
          numberInList: startNum++,
          fullName: cleaned,
          gender: 'M'
        });
      }
    }

    if (newStudents.length > 0) {
      onUpdateState(prev => {
        const combined = [...prev.students, ...newStudents];
        // Renumber all students in this class strictly starting from 1 continuously
        const inClass = combined
          .filter(s => s.classId === selectedClassId)
          .sort((a, b) => (a.numberInList || 0) - (b.numberInList || 0));

        const idToNumber = new Map<string, number>();
        inClass.forEach((st, idx) => {
          idToNumber.set(st.id, idx + 1);
        });

        const renumbered = combined.map(st => {
          if (st.classId === selectedClassId && idToNumber.has(st.id)) {
            return { ...st, numberInList: idToNumber.get(st.id)! };
          }
          return st;
        });

        return { ...prev, students: renumbered };
      });
      setImportNotification(`تمت إضافة ${newStudents.length} تلميذاً عبر اللصق السريع مع ضبط الترقيم التسلسلي من 1.`);
    }

    setPastedNames('');
    setIsPasteModalOpen(false);
  };

  // Export Students to Excel
  const handleExportStudentsExcel = () => {
    if (!activeClassObj) return;

    const exportData = classStudents.map((s, idx) => ({
      'الرقم في القائمة': s.numberInList || idx + 1,
      'الاسم واللقب': s.fullName,
      'الجنس': s.gender === 'M' ? 'ذكر' : 'أنثى',
      'رقم التسجيل': s.registrationNumber || '-',
      'القسم': activeClassObj.name,
      'الشعبة': activeClassObj.stream
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    if (!ws['!dir']) ws['!dir'] = 'rtl';
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'قائمة التلاميذ');
    XLSX.writeFile(wb, `قائمة_${activeClassObj.name.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleSaveStudent = () => {
    if (!editingStudent || !editingStudent.fullName || !selectedClassId) return;
    onUpdateState(prev => {
      const idx = prev.students.findIndex(s => s.id === editingStudent.id);
      let updated = [...prev.students];
      if (idx >= 0) {
        updated[idx] = editingStudent as Student;
      } else {
        updated.push({
          ...(editingStudent as Student),
          classId: selectedClassId,
          numberInList: editingStudent.numberInList || classStudents.length + 1
        });
      }

      // Re-index this class strictly starting from 1
      const inClass = updated
        .filter(s => s.classId === selectedClassId)
        .sort((a, b) => (a.numberInList || 0) - (b.numberInList || 0));

      const idToNumber = new Map<string, number>();
      inClass.forEach((st, sIdx) => {
        idToNumber.set(st.id, sIdx + 1);
      });

      const renumbered = updated.map(st => {
        if (st.classId === selectedClassId && idToNumber.has(st.id)) {
          return { ...st, numberInList: idToNumber.get(st.id)! };
        }
        return st;
      });

      return { ...prev, students: renumbered };
    });
    setIsStudentModalOpen(false);
    setEditingStudent(null);
  };

  const promptDeleteStudent = (student: Student) => {
    setDeleteConfirmDialog({
      isOpen: true,
      type: 'student',
      id: student.id,
      name: `${student.fullName} (رقم ${student.numberInList})`
    });
  };

  // Re-sequence the active class numbers starting from 1 and clean any summary rows
  const handleResequenceCurrentClass = () => {
    if (!selectedClassId) return;
    onUpdateState(prev => {
      // 1. Filter out any accidental summary rows like "ذكور" or "إناث" or "المجموع"
      const cleaned = prev.students.filter(s => {
        if (s.classId !== selectedClassId) return true;
        return !isSchoolSummaryOrFooterRow(s.fullName);
      });

      // 2. Sort existing students by their current order
      const inClass = cleaned
        .filter(s => s.classId === selectedClassId)
        .sort((a, b) => (a.numberInList || 0) - (b.numberInList || 0));

      // 3. Assign continuous numbers strictly starting from 1: 1, 2, 3...
      const idToNumber = new Map<string, number>();
      inClass.forEach((st, idx) => {
        idToNumber.set(st.id, idx + 1);
      });

      const renumbered = cleaned.map(st => {
        if (st.classId === selectedClassId && idToNumber.has(st.id)) {
          return { ...st, numberInList: idToNumber.get(st.id)! };
        }
        return st;
      });

      return { ...prev, students: renumbered };
    });
    setImportNotification('تم تحديث وإعادة ضبط ترقيم تلاميذ القسم تسلسلياً بدءاً من 1.');
  };

  const handleExecuteDelete = () => {
    if (!deleteConfirmDialog) return;
    const { type, id } = deleteConfirmDialog;

    if (type === 'student') {
      onUpdateState(prev => {
        const studentToDelete = prev.students.find(s => s.id === id);
        const classId = studentToDelete?.classId || selectedClassId;
        const remainingStudents = prev.students.filter(s => s.id !== id);

        // Resequence remaining students in this class strictly starting from 1 continuously
        const targetClassIds = classId ? [classId] : Array.from(new Set(remainingStudents.map(s => s.classId)));

        const idToNewNumber = new Map<string, number>();
        targetClassIds.forEach(cId => {
          const inClass = remainingStudents
            .filter(s => s.classId === cId && !isSchoolSummaryOrFooterRow(s.fullName))
            .sort((a, b) => (a.numberInList || 0) - (b.numberInList || 0));

          inClass.forEach((st, idx) => {
            idToNewNumber.set(st.id, idx + 1);
          });
        });

        const updatedStudents = remainingStudents
          .filter(s => !isSchoolSummaryOrFooterRow(s.fullName))
          .map(st => {
            if (idToNewNumber.has(st.id)) {
              return { ...st, numberInList: idToNewNumber.get(st.id)! };
            }
            return st;
          });

        return {
          ...prev,
          students: updatedStudents,
          grades: prev.grades.filter(g => g.studentId !== id)
        };
      });
    } else if (type === 'class') {
      onUpdateState(prev => ({
        ...prev,
        classes: prev.classes.filter(c => c.id !== id),
        students: prev.students.filter(s => s.classId !== id),
        timetable: prev.timetable.filter(s => s.classId !== id),
        activeClassId:
          prev.activeClassId === id
            ? prev.classes.find(c => c.id !== id)?.id || null
            : prev.activeClassId
      }));
    }
    setDeleteConfirmDialog(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6" id="classes-manager-view">
      {/* Header & Sub-tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--warning)]" />
            <span>الأفواج التربوية</span>
          </h2>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveSubTab('classes')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeSubTab === 'classes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الأقسام المسندة ({state.classes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('timetable')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeSubTab === 'timetable'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            استعمال الزمن الأسبوعي
          </button>
          <button
            onClick={() => setActiveSubTab('students')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeSubTab === 'students'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            قوائم التلاميذ والرقمنة
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {importNotification && (
        <div className="p-3 rounded-xl bg-[var(--primary-soft)] border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span>{importNotification}</span>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-[var(--primary)] hover:text-emerald-900 font-bold"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* SUB-TAB 1: CLASSES LIST */}
      {/* --------------------------------------------- */}
      {activeSubTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs font-bold text-slate-700">
              قائمة الأقسام التي تدرسها في ثانوية {state.profile.schoolName}
            </div>
            <button
              onClick={handleOpenAddClass}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-[var(--warning-soft)]0 text-white text-xs font-bold shadow-xs cursor-pointer"
              id="btn-add-new-class"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قسم جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.classes.map(cls => {
              const studentsCount = state.students.filter(s => s.classId === cls.id).length;
              const slotsCount = state.timetable.filter(s => s.classId === cls.id).length;

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-3"
                  id={`class-card-${cls.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: cls.color || '#0d9488' }}
                      />
                      <h3 className="text-base font-black text-slate-900">{cls.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditClass(cls)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="تعديل القسم"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => promptDeleteClass(cls)}
                        className="p-1 rounded text-rose-400 hover:text-rose-600 cursor-pointer"
                        title="حذف القسم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">الشعبة:</span>
                      <span className="font-bold text-slate-800">{cls.stream}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">المستوى الدراسي:</span>
                      <span className="font-bold text-slate-800">
                        {cls.level === '3AS'
                          ? 'السنة الثالثة ثانوي'
                          : cls.level === '2AS'
                          ? 'السنة الثانية ثانوي'
                          : cls.level === '1AS_ARTS'
                          ? 'السنة الأولى ثانوي (ج.م آداب)'
                          : 'السنة الأولى ثانوي (ج.م علوم)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">القاعة المخصصة:</span>
                      <span className="font-mono text-slate-800">{cls.roomNumber || 'غير محدد'}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span className="text-slate-500">عدد التلاميذ:</span>
                      <span className="font-bold text-[var(--primary)]">{studentsCount} تلميذ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الحصص الأسبوعية:</span>
                      <span className="font-bold text-slate-800">
                        {cls.level === '1AS_SCIENCE' ? '1 حصة (ساعة واحدة)' : '2 حصص (ساعتان)'}
                        {slotsCount > 0 ? ` • ${slotsCount} بالتوقيت` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        setActiveSubTab('students');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      إدارة التلاميذ
                    </button>
                    <button
                      onClick={() => {
                        onUpdateState(prev => ({ ...prev, activeClassId: cls.id }));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        state.activeClassId === cls.id
                          ? 'bg-amber-600 text-white'
                          : 'bg-[var(--warning-soft)] text-amber-800 hover:bg-[var(--warning-soft)]'
                      }`}
                    >
                      {state.activeClassId === cls.id ? 'القسم النشط ✓' : 'تفعيل'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* SUB-TAB 2: WEEKLY TIMETABLE */}
      {/* --------------------------------------------- */}
      {activeSubTab === 'timetable' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-700">
              استعمال الزمن الأسبوعي - جدول التوقيت الدراسي (الأحد إلى الخميس)
            </div>
            <button
              onClick={() => handleOpenAddSlot(0)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حصة جديدة للجدول</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {dayNames.map((dayName, dayIndex) => {
              const daySlots = state.timetable
                .filter(s => s.dayOfWeek === dayIndex)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              return (
                <div
                  key={dayIndex}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col"
                >
                  <div className="bg-slate-100 px-3 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">{dayName}</span>
                    <button
                      onClick={() => handleOpenAddSlot(dayIndex)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-600 cursor-pointer"
                      title={`إضافة حصة ليوم ${dayName}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-2 space-y-2 flex-1 min-h-[220px]">
                    {daySlots.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-slate-400">
                        لا توجد حصص
                      </div>
                    ) : (
                      daySlots.map(slot => {
                        const cls = state.classes.find(c => c.id === slot.classId);
                        return (
                          <div
                            key={slot.id}
                            className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-1 relative group"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 font-bold">
                              <span>
                                {slot.startTime} – {slot.endTime}
                              </span>
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="حذف الحصة"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-xs font-black text-slate-900">
                              {cls?.name || 'قسم غير معروف'}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {cls?.stream} {slot.room && `(ق ${slot.room})`}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* SUB-TAB 3: STUDENTS ROSTER & DIGITAL PLATFORM */}
      {/* --------------------------------------------- */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          {/* Class selector & actions bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">اختر القسم:</span>
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-900 outline-none cursor-pointer"
              >
                {state.classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.stream})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* File Input for Excel/CSV - Digitization */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* File Input for Excel - Moumtaze */}
              <input
                type="file"
                ref={moumtazeFileInputRef}
                accept=".xlsx, .xls"
                onChange={handleMoumtazeFileUpload}
                className="hidden"
              />

              <button
                onClick={() => moumtazeFileInputRef.current?.click()}
                disabled={isParsingMoumtaze}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                title="استيراد الأقسام المسندة وتلاميذها من برنامج الممتاز"
                id="btn-import-moumtaze-students"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isParsingMoumtaze ? 'جاري القراءة...' : 'استيراد من الممتاز'}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)] text-white text-xs font-bold shadow-xs cursor-pointer"
                title="استيراد ملف Excel أو CSV مستخرج من منصة الرقمنة لوزارة التربية"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>استيراد ملف الرقمنة (Excel)</span>
              </button>

              <button
                onClick={() => setIsPasteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs cursor-pointer"
                title="لصق قائمة أسماء التلاميذ دفعة واحدة"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>لصق الأسماء سريعاً</span>
              </button>

              <button
                onClick={handleExportStudentsExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير Excel</span>
              </button>

              <button
                onClick={() => {
                  setEditingStudent({
                    id: `std-${selectedClassId}-${Date.now()}`,
                    classId: selectedClassId,
                    numberInList: classStudents.length + 1,
                    fullName: '',
                    gender: 'M'
                  });
                  setIsStudentModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة تلميذ</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span>تعداد القسم: {classStudents.length} تلميذ</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-normal text-[11px]">
                  الترقيم تسلسلي دائماً من 1 إلى {classStudents.length}
                </span>
              </div>

              {classStudents.length > 0 && (
                <button
                  onClick={handleResequenceCurrentClass}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium cursor-pointer transition-colors shadow-2xs"
                  title="إعادة ضبط أرقام تلاميذ هذا القسم لتبدأ من 1 بالتسلسل دون أي انقطاع وحذف خانات المجموع إن وجدت"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>إعادة ترتيب الأرقام (1 إلى {classStudents.length})</span>
                </button>
              )}
            </div>

            {classStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs space-y-3">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p>لا يوجد تلاميذ مسجلين في هذا القسم بعد.</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold cursor-pointer"
                  >
                    استيراد من ملف الرقمنة (Excel)
                  </button>
                  <button
                    onClick={() => setIsPasteModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer"
                  >
                    لصق الأسماء نصياً
                  </button>
                </div>
              </div>
            ) : (
              <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-4 w-14">#</th>
                      <th className="py-2.5 px-4">اسم ولقب التلميذ</th>
                      <th className="py-2.5 px-4 w-24">الجنس</th>
                      <th className="py-2.5 px-4">رقم التعريف / التسجيل</th>
                      <th className="py-2.5 px-4 w-28 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-500">
                          {student.numberInList}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {student.fullName}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              student.gender === 'F'
                                ? 'bg-pink-50 text-pink-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {student.gender === 'F' ? 'أنثى' : 'ذكر'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500 text-[11px]">
                          {student.registrationNumber || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingStudent({ ...student });
                                setIsStudentModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                              title="تعديل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => promptDeleteStudent(student)}
                              className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Cards */}
              <div className="block md:hidden divide-y divide-slate-100">
                {classStudents.map(student => (
                  <div key={student.id} className="p-4 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-mono font-bold flex items-center justify-center text-xs shrink-0">
                        {student.numberInList}
                      </span>
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-slate-900">
                          {student.fullName}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              student.gender === 'F'
                                ? 'bg-pink-50 text-pink-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {student.gender === 'F' ? 'أنثى' : 'ذكر'}
                          </span>
                          {student.registrationNumber && (
                            <span className="font-mono text-slate-500 text-[10px]">
                              {student.registrationNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingStudent({ ...student });
                          setIsStudentModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer bg-slate-50 rounded-lg"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => promptDeleteStudent(student)}
                        className="p-2 text-[var(--danger)] hover:opacity-80 cursor-pointer bg-[var(--danger-soft)] rounded-lg"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* MODAL: ADD / EDIT CLASS */}
      {/* --------------------------------------------- */}
      {isClassModalOpen && editingClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingClass.name ? 'تعديل القسم' : 'إضافة قسم جديد'}
              </h3>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">تسمية القسم (مثال: 3 علوم 1):</label>
                <input
                  type="text"
                  value={editingClass.name || ''}
                  onChange={e => setEditingClass({ ...editingClass, name: e.target.value })}
                  placeholder="3 علوم تجريبية 1"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold focus:outline-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">المستوى الدراسي:</label>
                  <select
                    value={editingClass.level || '3AS'}
                    onChange={e => setEditingClass({ ...editingClass, level: e.target.value as GradeLevel })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                  >
                    <option value="1AS_ARTS">1 ج.م آداب (2 سا/أسبوع)</option>
                    <option value="1AS_SCIENCE">1 ج.م علوم وتكنولوجيا (1 سا/أسبوع)</option>
                    <option value="2AS">السنة الثانية ثانوي 2AS (2 سا/أسبوع)</option>
                    <option value="3AS">السنة الثالثة ثانوي بكالوريا 3AS (2 سا/أسبوع)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">الشعبة:</label>
                  <input
                    type="text"
                    value={editingClass.stream || ''}
                    onChange={e => setEditingClass({ ...editingClass, stream: e.target.value })}
                    placeholder="علوم تجريبية / رياضيات / آداب..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">القاعة:</label>
                  <input
                    type="text"
                    value={editingClass.roomNumber || ''}
                    onChange={e => setEditingClass({ ...editingClass, roomNumber: e.target.value })}
                    placeholder="القاعة 04"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">لون التمييز:</label>
                  <input
                    type="color"
                    value={editingClass.color || '#0d9488'}
                    onChange={e => setEditingClass({ ...editingClass, color: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveClass}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-[var(--warning-soft)]0 text-white text-xs font-bold"
              >
                حفظ القسم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* MODAL: ADD / EDIT TIMETABLE SLOT */}
      {/* --------------------------------------------- */}
      {isSlotModalOpen && editingSlot && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">إضافة حصة إلى جدول التوقيت</h3>
              <button onClick={() => setIsSlotModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">اليوم:</label>
                <select
                  value={editingSlot.dayOfWeek ?? 0}
                  onChange={e => setEditingSlot({ ...editingSlot, dayOfWeek: Number(e.target.value) as 0 | 1 | 2 | 3 | 4 })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                >
                  {dayNames.map((name, i) => (
                    <option key={i} value={i}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">القسم:</label>
                <select
                  value={editingSlot.classId || ''}
                  onChange={e => setEditingSlot({ ...editingSlot, classId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                >
                  {state.classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.stream})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">من الساعة:</label>
                  <input
                    type="time"
                    value={editingSlot.startTime || '08:00'}
                    onChange={e => setEditingSlot({ ...editingSlot, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">إلى الساعة:</label>
                  <input
                    type="time"
                    value={editingSlot.endTime || '09:00'}
                    onChange={e => setEditingSlot({ ...editingSlot, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">القاعة:</label>
                <input
                  type="text"
                  value={editingSlot.room || ''}
                  onChange={e => setEditingSlot({ ...editingSlot, room: e.target.value })}
                  placeholder="04"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSlot}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
              >
                إضافة الحصة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* MODAL: QUICK PASTE NAMES */}
      {/* --------------------------------------------- */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                لصق قائمة أسماء التلاميذ سريعا
              </h3>
              <button onClick={() => setIsPasteModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600">
                الصق أسماء التلاميذ هنا (اسم في كل سطر). سيقوم التطبيق بحذف الأرقام السابقة تلقائياً وإضافتها إلى قسم: 
                <span className="font-bold text-slate-900 mr-1">{activeClassObj?.name}</span>
              </p>
              <textarea
                rows={8}
                value={pastedNames}
                onChange={e => setPastedNames(e.target.value)}
                placeholder="1. بن ددوش صهيب&#10;2. سنوساوي نسرين أمال&#10;3. عاشوري تسنيم نهى..."
                className="w-full p-3 rounded-lg border border-slate-300 font-bold focus:outline-amber-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleQuickPasteNames}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                معالجة وإضافة القائمة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* MODAL: ADD / EDIT SINGLE STUDENT */}
      {/* --------------------------------------------- */}
      {isStudentModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingStudent.fullName ? 'تعديل بيانات التلميذ' : 'إضافة تلميذ جديد'}
              </h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">الاسم واللقب:</label>
                <input
                  type="text"
                  value={editingStudent.fullName || ''}
                  onChange={e => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  placeholder="محمد بلقاسم"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">الرقم في القائمة:</label>
                  <input
                    type="number"
                    value={editingStudent.numberInList || 1}
                    onChange={e =>
                      setEditingStudent({ ...editingStudent, numberInList: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">الجنس:</label>
                  <select
                    value={editingStudent.gender || 'M'}
                    onChange={e =>
                      setEditingStudent({ ...editingStudent, gender: e.target.value as 'M' | 'F' })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="M">ذكر</option>
                    <option value="F">أنثى</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">رقم التعريف / التسجيل بالرقمنة:</label>
                <input
                  type="text"
                  value={editingStudent.registrationNumber || ''}
                  onChange={e =>
                    setEditingStudent({ ...editingStudent, registrationNumber: e.target.value })
                  }
                  placeholder="اختياري"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveStudent}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --------------------------------------------- */}
      {/* MODAL: DELETE CONFIRMATION DIALOG (SAFE IN-APP DIALOG) */}
      {/* --------------------------------------------- */}
      {deleteConfirmDialog && deleteConfirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200" dir="rtl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {deleteConfirmDialog.type === 'class' ? 'تأكيد حذف القسم' : 'تأكيد حذف التلميذ'}
                </h3>
                <span className="text-[11px] text-slate-500">هذا الإجراء لا يمكن التراجع عنه</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              هل أنت متأكد من رغبتك في حذف{' '}
              <strong className="text-slate-900 font-black">«{deleteConfirmDialog.name}»</strong>؟
              {deleteConfirmDialog.type === 'class' && (
                <span className="block mt-1.5 text-rose-700 font-semibold text-[11px]">
                  ملاحظة: سيتم حذف جميع تلاميذ هذا القسم والعلامات المسجلة والحصص المرتبطة به في الجدول تلقائياً.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmDialog(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء الأمر
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl bg-[var(--danger)] hover:opacity-90 text-[var(--color-primary-fg)] text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>نعم، تأكيد الحذف</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* MODAL: MOUMTAZE (الممتاز) CLASS SELECTION MODAL */}
      {/* --------------------------------------------- */}
      {isMoumtazeModalOpen && moumtazeData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
            dir="rtl"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-2">
                    <span>استيراد الأقسام المسندة من برنامج الممتاز</span>
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-600/60 text-indigo-100 border border-indigo-400/30">
                      مؤسسة
                    </span>
                  </h3>
                  <div className="text-xs text-slate-300 flex items-center gap-3 mt-0.5 flex-wrap">
                    {moumtazeData.schoolName && (
                      <span className="flex items-center gap-1 font-semibold text-amber-200">
                        <Building2 className="w-3.5 h-3.5" />
                        {moumtazeData.schoolName}
                      </span>
                    )}
                    {moumtazeData.academicYear && (
                      <span className="text-slate-300">الموسم: {moumtazeData.academicYear}</span>
                    )}
                    <span className="text-slate-400 font-mono text-[11px]">({moumtazeData.fileName})</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMoumtazeModalOpen(false);
                  setMoumtazeData(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Bar & Actions */}
            <div className="px-6 py-3.5 bg-indigo-50/70 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-indigo-950 leading-relaxed">
                <span className="font-bold">تنبيه بيداغوجي:</span> تم استخراج{' '}
                <strong className="text-indigo-900 font-black">{moumtazeData.classes.length} أقسام</strong> من ملف المؤسسة.
                حدد <strong className="underline">الأقسام المسندة إليك فقط</strong> لتنزيل قوائمها وقاعاتها تلقائياً.
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllMoumtazeClasses}
                  className="px-3 py-1.5 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-100 text-indigo-900 font-bold cursor-pointer transition-colors"
                >
                  تحديد الكل
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllMoumtazeClasses}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold cursor-pointer transition-colors"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>

            {/* Classes Grid */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {moumtazeData.classes.map(cls => {
                  const isSelected = selectedMoumtazeClassIds.includes(cls.id);
                  const repeatersCount = cls.students.filter(s => s.isRepeater).length;
                  const malesCount = cls.students.filter(s => s.gender === 'M').length;
                  const femalesCount = cls.students.filter(s => s.gender === 'F').length;

                  return (
                    <div
                      key={cls.id}
                      onClick={() => handleToggleSelectMoumtazeClass(cls.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </span>
                          <h4 className="font-black text-slate-900 text-sm">{cls.className}</h4>
                        </div>
                        {cls.roomNumber && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--warning-soft)] text-amber-900 border border-amber-200">
                            القاعة {cls.roomNumber}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] space-y-1 text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-500">الشعبة:</span>
                          <span className="font-semibold text-slate-800">{cls.stream}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">المستوى:</span>
                          <span className="font-semibold text-slate-800">
                            {cls.level === '3AS'
                              ? 'السنة 3 ثانوي'
                              : cls.level === '2AS'
                              ? 'السنة 2 ثانوي'
                              : cls.level === '1AS_ARTS'
                              ? 'السنة 1 ثانوي (آداب)'
                              : 'السنة 1 ثانوي (علوم)'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">اسم الورقة الأصلية:</span>
                          <span className="font-mono text-slate-500">{cls.sheetName}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-800 bg-[var(--primary-soft)] px-2 py-0.5 rounded-md border border-emerald-100">
                          {cls.students.length} تلميذاً
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
                          <span>{malesCount} ذ</span>
                          <span>•</span>
                          <span>{femalesCount} إناث</span>
                          {repeatersCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-rose-600 font-bold">{repeatersCount} معيد</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-700 font-medium">
                تم تحديد{' '}
                <strong className="text-indigo-900 font-black text-sm">
                  {selectedMoumtazeClassIds.length}
                </strong>{' '}
                من أصل {moumtazeData.classes.length} قسماً
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoumtazeModalOpen(false);
                    setMoumtazeData(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-white cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMoumtazeImport}
                  disabled={selectedMoumtazeClassIds.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)] disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تأكيد استيراد الأقسام المحددة ({selectedMoumtazeClassIds.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
