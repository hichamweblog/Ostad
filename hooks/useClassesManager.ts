import { useState } from 'react';
import { ClassRoom, Student, TimetableSlot } from '@/lib/types';
import { ParsedMoumtazeResult } from '@/lib/moumtaze-sync';

export function useClassesManager() {
  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'timetable' | 'students'>('classes');
  
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Partial<ClassRoom> | null>(null);

  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Partial<TimetableSlot> | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);

  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedNames, setPastedNames] = useState('');

  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'student' | 'class';
    id: string;
    name: string;
  } | null>(null);

  const [importNotification, setImportNotification] = useState<string | null>(null);

  const [isMoumtazeModalOpen, setIsMoumtazeModalOpen] = useState(false);
  const [moumtazeData, setMoumtazeData] = useState<ParsedMoumtazeResult | null>(null);
  const [selectedMoumtazeClassIds, setSelectedMoumtazeClassIds] = useState<string[]>([]);
  const [isParsingMoumtaze, setIsParsingMoumtaze] = useState(false);

  return {
    activeSubTab, setActiveSubTab,
    isClassModalOpen, setIsClassModalOpen,
    editingClass, setEditingClass,
    isSlotModalOpen, setIsSlotModalOpen,
    editingSlot, setEditingSlot,
    isStudentModalOpen, setIsStudentModalOpen,
    editingStudent, setEditingStudent,
    isPasteModalOpen, setIsPasteModalOpen,
    pastedNames, setPastedNames,
    deleteConfirmDialog, setDeleteConfirmDialog,
    importNotification, setImportNotification,
    isMoumtazeModalOpen, setIsMoumtazeModalOpen,
    moumtazeData, setMoumtazeData,
    selectedMoumtazeClassIds, setSelectedMoumtazeClassIds,
    isParsingMoumtaze, setIsParsingMoumtaze
  };
}
