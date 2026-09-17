import re

with open('lib/excel-sync.ts', 'r') as f:
    content = f.read()

# Currently it only looks at workbook.worksheets[0]. We need to iterate over ALL worksheets.
# We also need to change parseDigitizationFile to return an array of parsed data, or handle it differently.
# But wait, it's easier to just parse ALL worksheets in the file and create classes for each.

target = """export async function parseDigitizationFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0]; // Usually the first sheet
  
  if (!worksheet) {
    throw new Error('الملف فارغ أو غير صالح (لا توجد ورقة عمل).');
  }

  // Row 5 contains class info: "حجز النقاط الخاصة بـ:الفصل الأول السنة الدراسية : 2025-2026 : الفوج التربوي : ثالثة ثانوي علوم تجريبية 1 مادة : العلوم الاسلامية"
  const infoRow = worksheet.getRow(5);
  const infoText = infoRow.getCell(1).text || infoRow.getCell('A').text || Object.values(infoRow.values || {}).join(' ');
  
  let extractedClassName = 'قسم جديد';
  let level: GradeLevel = '1AS_SCIENCE';
  let stream = 'علوم تجريبية';
  
  // Attempt to extract class name (الفوج التربوي)
  const regex = /الفوج التربوي\s*:\s*(.*?)\s*مادة/i;
  const match = infoText.match(regex);
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

  const students: Omit<Student, 'classId'>[] = [];
  let rowIndex = 9; // Data starts at row 9
  let isDone = false;
  let numberInList = 1;

  while (!isDone) {
    const row = worksheet.getRow(rowIndex);
    const regNumber = row.getCell('A').text?.trim(); // رقم التعريف
    
    if (!regNumber || regNumber === '') {
      isDone = true;
      break;
    }

    const lastName = row.getCell('B').text?.trim() || ''; // اللقب
    const firstName = row.getCell('C').text?.trim() || ''; // الاسم
    const birthDateText = row.getCell('D').text?.trim(); // تاريخ الميلاد
    
    // Sometimes ExcelJS returns dates as Date objects. If so, format it.
    let birthDate = '';
    const dateValue = row.getCell('D').value;
    if (dateValue instanceof Date) {
      birthDate = dateValue.toISOString().split('T')[0];
    } else {
      birthDate = birthDateText || '';
    }

    students.push({
      id: uuidv4(),
      numberInList,
      fullName: `${lastName} ${firstName}`.trim(),
      regNumber,
      birthDate,
    });

    numberInList++;
    rowIndex++;
  }

  if (students.length === 0) {
    throw new Error('لم يتم العثور على أي تلاميذ في الملف. تأكد من أن الملف هو الملف الرسمي للرقمنة.');
  }

  return {
    className: extractedClassName,
    level,
    stream,
    students
  };
}"""

replacement = """export async function parseDigitizationFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  
  if (workbook.worksheets.length === 0) {
    throw new Error('الملف فارغ أو غير صالح (لا توجد أوراق عمل).');
  }

  const allParsedClasses = [];

  for (const worksheet of workbook.worksheets) {
    // Row 5 contains class info
    const infoRow = worksheet.getRow(5);
    const infoText = infoRow.getCell(1).text || infoRow.getCell('A').text || Object.values(infoRow.values || {}).join(' ');
    
    // If it doesn't look like a standard digitization sheet, skip it
    if (!infoText.includes('الفوج التربوي') && !infoText.includes('مادة')) {
      continue;
    }

    let extractedClassName = 'قسم جديد';
    let level: GradeLevel = '1AS_SCIENCE';
    let stream = 'علوم تجريبية';
    
    // Attempt to extract class name (الفوج التربوي)
    const regex = /الفوج التربوي\s*:\s*(.*?)\s*مادة/i;
    const match = infoText.match(regex);
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
        if (extractedClassName.includes('آداب') && extractedClassName.includes('فلسفة')) stream = 'آداب وفلسفة';
        else if (extractedClassName.includes('لغات')) stream = 'لغات أجنبية';
        else if (extractedClassName.includes('رياضيات')) stream = 'رياضيات';
        else if (extractedClassName.includes('تقني')) stream = 'تقني رياضي';
        else if (extractedClassName.includes('تسيير')) stream = 'تسيير واقتصاد';
        else stream = 'علوم تجريبية';
      } else if (extractedClassName.includes('ثالثة') || extractedClassName.includes('3')) {
        level = '3AS';
        if (extractedClassName.includes('آداب') && extractedClassName.includes('فلسفة')) stream = 'آداب وفلسفة';
        else if (extractedClassName.includes('لغات')) stream = 'لغات أجنبية';
        else if (extractedClassName.includes('رياضيات')) stream = 'رياضيات';
        else if (extractedClassName.includes('تقني')) stream = 'تقني رياضي';
        else if (extractedClassName.includes('تسيير')) stream = 'تسيير واقتصاد';
        else stream = 'علوم تجريبية';
      }
    }

    const students: Omit<Student, 'classId'>[] = [];
    let rowIndex = 9; // Data starts at row 9
    let isDone = false;
    let numberInList = 1;

    while (!isDone) {
      const row = worksheet.getRow(rowIndex);
      const regNumber = row.getCell('A').text?.trim(); // رقم التعريف
      
      if (!regNumber || regNumber === '') {
        isDone = true;
        break;
      }

      const lastName = row.getCell('B').text?.trim() || ''; // اللقب
      const firstName = row.getCell('C').text?.trim() || ''; // الاسم
      const birthDateText = row.getCell('D').text?.trim(); // تاريخ الميلاد
      
      let birthDate = '';
      const dateValue = row.getCell('D').value;
      if (dateValue instanceof Date) {
        birthDate = dateValue.toISOString().split('T')[0];
      } else {
        birthDate = birthDateText || '';
      }

      students.push({
        id: uuidv4(),
        numberInList,
        fullName: `${lastName} ${firstName}`.trim(),
        regNumber,
        birthDate,
      });

      numberInList++;
      rowIndex++;
    }

    if (students.length > 0) {
      allParsedClasses.push({
        className: extractedClassName,
        level,
        stream,
        students
      });
    }
  }

  if (allParsedClasses.length === 0) {
    throw new Error('لم يتم العثور على أي بيانات صحيحة في الملف. تأكد من أن الملف هو الملف الرسمي للرقمنة.');
  }

  return allParsedClasses;
}"""

content = content.replace(target, replacement)

# Fix injectGradesIntoFile for multiple sheets too
inject_target = """export async function injectGradesIntoFile(
  file: File,
  students: Student[],
  grades: StudentGrade[]
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const worksheet = workbook.worksheets[0];
  
  if (!worksheet) {
    throw new Error('الملف فارغ أو غير صالح (لا توجد ورقة عمل).');
  }"""

inject_replacement = """export async function injectGradesIntoFile(
  file: File,
  students: Student[],
  grades: StudentGrade[]
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  
  if (workbook.worksheets.length === 0) {
    throw new Error('الملف فارغ أو غير صالح (لا توجد أوراق عمل).');
  }"""

content = content.replace(inject_target, inject_replacement)

# Update inject logic for all sheets
inject_logic_target = """  let rowIndex = 9; // Data starts at row 9
  let isDone = false;

  while (!isDone) {
    const row = worksheet.getRow(rowIndex);
    const regNumber = row.getCell('A').text?.trim();
    
    if (!regNumber || regNumber === '') {
      // Empty row or end of list
      isDone = true;
      break;
    }

    const grade = gradeLookup.get(regNumber);
    if (grade) {
      // E = التقييم المستمر /20
      if (grade.continuousEval !== null && grade.continuousEval !== undefined) {
        row.getCell('E').value = grade.continuousEval;
      }
      // F = معدل الفروض /20 (or الفرض الأول depending on stream, but column F is the first grade col for it)
      if (grade.quiz !== null && grade.quiz !== undefined) {
        row.getCell('F').value = grade.quiz;
      }
      // G = الاختبار /20
      if (grade.exam !== null && grade.exam !== undefined) {
        row.getCell('G').value = grade.exam;
      }
      // H = التقديرات (Appreciations)
      if (grade.estimation && grade.estimation.trim() !== '') {
        row.getCell('H').value = grade.estimation;
      }
      // I = الارشادات (Guidance/Remarks)
      if (grade.guidance && grade.guidance.trim() !== '') {
        row.getCell('I').value = grade.guidance;
      }
    }

    rowIndex++;
  }"""

inject_logic_replacement = """  for (const worksheet of workbook.worksheets) {
    let rowIndex = 9; // Data starts at row 9
    let isDone = false;

    while (!isDone) {
      const row = worksheet.getRow(rowIndex);
      const regNumber = row.getCell('A').text?.trim();
      
      if (!regNumber || regNumber === '') {
        isDone = true;
        break;
      }

      const grade = gradeLookup.get(regNumber);
      if (grade) {
        if (grade.continuousEval !== null && grade.continuousEval !== undefined) {
          row.getCell('E').value = grade.continuousEval;
        }
        if (grade.quiz !== null && grade.quiz !== undefined) {
          row.getCell('F').value = grade.quiz;
        }
        if (grade.exam !== null && grade.exam !== undefined) {
          row.getCell('G').value = grade.exam;
        }
        if (grade.estimation && grade.estimation.trim() !== '') {
          row.getCell('H').value = grade.estimation;
        }
        if (grade.guidance && grade.guidance.trim() !== '') {
          row.getCell('I').value = grade.guidance;
        }
      }
      rowIndex++;
    }
  }"""

content = content.replace(inject_logic_target, inject_logic_replacement)

with open('lib/excel-sync.ts', 'w') as f:
    f.write(content)
