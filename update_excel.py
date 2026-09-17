with open('lib/excel-sync.ts', 'w') as f:
    f.write("""import * as XLSX from 'xlsx';
import { ClassRoom, GradeLevel, Student, StudentGrade } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parses the official Algerian digitisation file to extract class info and student list.
 */
export async function parseDigitizationFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  
  // Use SheetJS (xlsx) for robust parsing (handles HTML-disguised XLS files)
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  if (!worksheet) {
    throw new Error('الملف فارغ أو غير صالح (لا توجد ورقة عمل).');
  }

  // Convert to array of arrays
  const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '', blankrows: true });

  let extractedClassName = 'قسم جديد';
  let level: GradeLevel = '1AS_SCIENCE';
  let stream = 'علوم تجريبية';
  let dataStartIndex = -1;

  // Scan the file to find class info and the start of the student list
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;
    
    const rowText = row.join(' ');
    
    // 1. Extract class name and level
    if (rowText.includes('الفوج التربوي')) {
      const match = rowText.match(/الفوج التربوي\\s*:\\s*(.*?)\\s*(?:مادة|$)/i);
      if (match && match[1]) {
        extractedClassName = match[1].trim();
        // Guess level and stream based on extracted text
        if (extractedClassName.includes('أولى') || extractedClassName.includes('1')) {
          if (extractedClassName.includes('آداب')) {
             level = '1AS_ARTS';
             stream = 'جذع مشترك آداب';
          } else {
             level = '1AS_SCIENCE';
             stream = 'جذع مشترك علوم وتكنولوجيا';
          }
        } else if (extractedClassName.includes('ثانية') || extractedClassName.includes('2')) {
          level = '2AS';
        } else if (extractedClassName.includes('ثالثة') || extractedClassName.includes('3')) {
          level = '3AS';
        }
      }
    }
    
    // 2. Find the header row to know where students start
    if (rowText.includes('اللقب') && rowText.includes('الاسم')) {
      dataStartIndex = i + 1;
    }
  }

  // Fallback if header wasn't found - assume it starts at row 9 (index 8) like standard files
  if (dataStartIndex === -1) {
     dataStartIndex = 8;
  }

  const students: Omit<Student, 'classId'>[] = [];
  let numberInList = 1;

  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    // Col 0: رقم التعريف, Col 1: اللقب, Col 2: الاسم, Col 3: تاريخ الميلاد
    const regNumber = String(row[0] || '').trim();
    
    // Stop if we hit an empty row after we started parsing students
    if (!regNumber && students.length > 0) {
      // It might just be an empty row, or the end of the file. We'll skip it.
      continue;
    }
    
    if (!regNumber) continue;

    const lastName = String(row[1] || '').trim();
    const firstName = String(row[2] || '').trim();
    const birthDateText = row[3];
    
    let birthDate = '';
    if (birthDateText) {
      if (birthDateText instanceof Date) {
        birthDate = birthDateText.toISOString().split('T')[0];
      } else if (typeof birthDateText === 'number' && birthDateText > 10000) {
        // Handle Excel date codes
        const date = XLSX.SSF.parse_date_code(birthDateText);
        if (date) {
           birthDate = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
        }
      } else {
        birthDate = String(birthDateText).trim();
      }
    }

    students.push({
      id: uuidv4(),
      numberInList,
      fullName: `${lastName} ${firstName}`.trim(),
      regNumber,
      birthDate,
    });
    
    numberInList++;
  }

  if (students.length === 0) {
    throw new Error('لم يتم العثور على أي تلاميذ في الملف. تأكد من أن الملف هو الملف الرسمي للرقمنة ويحتوي على جدول التلاميذ.');
  }

  return {
    className: extractedClassName,
    level,
    stream,
    students
  };
}

/**
 * Injects grades into an empty digitisation file for a specific class.
 * Matches students by National ID (رقم التعريف) to ensure 100% accuracy, regardless of sorting.
 */
export async function injectGradesIntoFile(
  file: File,
  students: Student[],
  grades: StudentGrade[]
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Parse with SheetJS
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  // Create a fast lookup map: regNumber -> student -> grade
  const gradeLookup = new Map<string, StudentGrade>();
  students.forEach(student => {
    if (student.regNumber) {
      const grade = grades.find(g => g.studentId === student.id);
      if (grade) {
        gradeLookup.set(student.regNumber, grade);
      }
    }
  });

  // Inject grades into all sheets (usually just one)
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '', blankrows: true });
    
    let dataStartIndex = -1;
    
    // Find the header row
    for (let i = 0; i < data.length; i++) {
      const rowText = (data[i] || []).join(' ');
      if (rowText.includes('اللقب') && rowText.includes('الاسم')) {
        dataStartIndex = i + 1;
        break;
      }
    }
    
    if (dataStartIndex === -1) {
      dataStartIndex = 8; // fallback
    }

    for (let i = dataStartIndex; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;
      
      const regNumber = String(row[0] || '').trim();
      if (!regNumber) continue;

      const grade = gradeLookup.get(regNumber);
      if (grade) {
        // Modify the array row directly
        // Assuming: E (4) = continuousEval, F (5) = quiz, G (6) = exam, H (7) = estimation, I (8) = guidance
        if (grade.continuousEval !== null && grade.continuousEval !== undefined) {
          row[4] = grade.continuousEval;
        }
        if (grade.quiz !== null && grade.quiz !== undefined) {
          row[5] = grade.quiz;
        }
        if (grade.exam !== null && grade.exam !== undefined) {
          row[6] = grade.exam;
        }
        if (grade.estimation && grade.estimation.trim() !== '') {
          row[7] = grade.estimation;
        }
        if (grade.guidance && grade.guidance.trim() !== '') {
          row[8] = grade.guidance;
        }
      }
    }
    
    // Write back the modified data to the worksheet
    const newWorksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Copy column widths if they exist in the original sheet
    if (worksheet['!cols']) {
        newWorksheet['!cols'] = worksheet['!cols'];
    }
    // Copy merges
    if (worksheet['!merges']) {
        newWorksheet['!merges'] = worksheet['!merges'];
    }
    
    workbook.Sheets[sheetName] = newWorksheet;
  });

  // Write the workbook as a binary array buffer in XLSX format
  const outputBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  return new Blob([outputBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
""")
