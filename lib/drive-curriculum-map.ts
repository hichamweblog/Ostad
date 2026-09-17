import { GradeLevel, CurriculumUnit } from './types';

export interface DriveFolderInfo {
  level: GradeLevel;
  levelName: string;
  titleAr: string;
  unitsCount: number;
  folderId: string;
  folderUrl: string;
  embedUrl: string;
  description: string;
}

export interface DriveUnitFile {
  unitNumber: number;
  fileName: string;
  fileId: string;
  previewUrl: string;
  viewUrl: string;
  downloadUrl: string;
}

/**
 * مجلدات Google Drive الرسمية لمذكرات مادة العلوم الإسلامية بالتعليم الثانوي
 */
export const DRIVE_FOLDERS: Record<GradeLevel, DriveFolderInfo> = {
  '3AS': {
    level: '3AS',
    levelName: 'السنة الثالثة ثانوي (بكالوريا) — جميع الشعب',
    titleAr: 'السنة الثالثة ثانوي (بكالوريا)',
    unitsCount: 23,
    folderId: '1GvjsQ7qk3HX__zQRdtOcIg_5aDtiBV6x',
    folderUrl: 'https://drive.google.com/drive/folders/1GvjsQ7qk3HX__zQRdtOcIg_5aDtiBV6x?usp=drive_link',
    embedUrl: 'https://drive.google.com/embeddedfolderview?id=1GvjsQ7qk3HX__zQRdtOcIg_5aDtiBV6x#grid',
    description: 'المجلد الرسمي لمذكرات السنة الثالثة ثانوي (أقسام البكالوريا) وفق المنهاج والتدرج الوزاري'
  },
  '1AS_ARTS': {
    level: '1AS_ARTS',
    levelName: 'السنة الأولى ثانوي — جذع مشترك آداب',
    titleAr: 'السنة الأولى ثانوي — جذع مشترك آداب',
    unitsCount: 24,
    folderId: '1cZafSF9222nKUrMtTiZRA1yESmhsvNC8',
    folderUrl: 'https://drive.google.com/drive/folders/1cZafSF9222nKUrMtTiZRA1yESmhsvNC8?usp=drive_link',
    embedUrl: 'https://drive.google.com/embeddedfolderview?id=1cZafSF9222nKUrMtTiZRA1yESmhsvNC8#grid',
    description: 'المجلد الرسمي لمذكرات 1 ج م آداب (24 وحدة مقررة — ساعتان أسبوعياً)'
  },
  '1AS_SCIENCE': {
    level: '1AS_SCIENCE',
    levelName: 'السنة الأولى ثانوي — جذع مشترك علوم وتكنولوجيا',
    titleAr: 'السنة الأولى ثانوي — جذع مشترك علوم وتكنولوجيا',
    unitsCount: 15,
    folderId: '1logOtIyCEYQ3KVsSeZfJQCtytyvp3IAR',
    folderUrl: 'https://drive.google.com/drive/folders/1logOtIyCEYQ3KVsSeZfJQCtytyvp3IAR?usp=drive_link',
    embedUrl: 'https://drive.google.com/embeddedfolderview?id=1logOtIyCEYQ3KVsSeZfJQCtytyvp3IAR#grid',
    description: 'المجلد الرسمي لمذكرات 1 ج م ع ت (15 وحدة مقررة — ساعة واحدة أسبوعياً)'
  },
  '2AS': {
    level: '2AS',
    levelName: 'السنة الثانية ثانوي — جميع الشعب',
    titleAr: 'السنة الثانية ثانوي — جميع الشعب',
    unitsCount: 23,
    folderId: '1ftZf-IjNulR2jFwtujHdbH39wdRdYjmC',
    folderUrl: 'https://drive.google.com/drive/folders/1ftZf-IjNulR2jFwtujHdbH39wdRdYjmC?usp=drive_link',
    embedUrl: 'https://drive.google.com/embeddedfolderview?id=1ftZf-IjNulR2jFwtujHdbH39wdRdYjmC#grid',
    description: 'المجلد الرسمي لمذكرات السنة الثانية ثانوي (23 وحدة مقررة — ساعتان أسبوعياً)'
  }
};

/**
 * جدول الربط التفصيلي الدقيق لكل وحدة بملف PDF الخاص بها حصراً من Google Drive
 */
export const DRIVE_UNIT_FILES: Record<GradeLevel, DriveUnitFile[]> = {
  "3AS": [
    {
      "unitNumber": 1,
      "fileName": "الوحدة_01_العقيدة_الإسلامية_وأثرها_على_الفرد_والمجتمع.pdf",
      "fileId": "1ggcwetrhfNODU_l5gkqEhQ5z2_vjiY3V",
      "previewUrl": "https://drive.google.com/file/d/1ggcwetrhfNODU_l5gkqEhQ5z2_vjiY3V/preview",
      "viewUrl": "https://drive.google.com/file/d/1ggcwetrhfNODU_l5gkqEhQ5z2_vjiY3V/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1ggcwetrhfNODU_l5gkqEhQ5z2_vjiY3V"
    },
    {
      "unitNumber": 2,
      "fileName": "الوحدة_02_وسائل_القرآن_الكريم_في_تثبيت_العقيدة_الإسلامية.pdf",
      "fileId": "132JnV5wiCaUm9JBEIP35pMtmYka5UgH2",
      "previewUrl": "https://drive.google.com/file/d/132JnV5wiCaUm9JBEIP35pMtmYka5UgH2/preview",
      "viewUrl": "https://drive.google.com/file/d/132JnV5wiCaUm9JBEIP35pMtmYka5UgH2/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=132JnV5wiCaUm9JBEIP35pMtmYka5UgH2"
    },
    {
      "unitNumber": 3,
      "fileName": "الوحدة_03_الإسلام_والرسالات_السماوية_الدين_عند_الله_الإسلام.pdf",
      "fileId": "1h5iuJvXu_pYQuIzNwmg_6xfPU0E9xQzm",
      "previewUrl": "https://drive.google.com/file/d/1h5iuJvXu_pYQuIzNwmg_6xfPU0E9xQzm/preview",
      "viewUrl": "https://drive.google.com/file/d/1h5iuJvXu_pYQuIzNwmg_6xfPU0E9xQzm/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1h5iuJvXu_pYQuIzNwmg_6xfPU0E9xQzm"
    },
    {
      "unitNumber": 4,
      "fileName": "الوحدة_04_الإسلام_والرسالات_السماوية_اليهودية.pdf",
      "fileId": "1NwLOtmlJ_ghshzhDGPj3XAdsJjl4jSOz",
      "previewUrl": "https://drive.google.com/file/d/1NwLOtmlJ_ghshzhDGPj3XAdsJjl4jSOz/preview",
      "viewUrl": "https://drive.google.com/file/d/1NwLOtmlJ_ghshzhDGPj3XAdsJjl4jSOz/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1NwLOtmlJ_ghshzhDGPj3XAdsJjl4jSOz"
    },
    {
      "unitNumber": 5,
      "fileName": "الوحدة_05_الإسلام_والرسالات_السماوية_النصرانية.pdf",
      "fileId": "170dd_6Oc9fbp8twgFAa16LjAjYqBSnzJ",
      "previewUrl": "https://drive.google.com/file/d/170dd_6Oc9fbp8twgFAa16LjAjYqBSnzJ/preview",
      "viewUrl": "https://drive.google.com/file/d/170dd_6Oc9fbp8twgFAa16LjAjYqBSnzJ/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=170dd_6Oc9fbp8twgFAa16LjAjYqBSnzJ"
    },
    {
      "unitNumber": 6,
      "fileName": "الوحدة_06_الإسلام_والرسالات_السماوية_الإسلام_الرسالة_الخاتمة.pdf",
      "fileId": "1NF1o0xIcV2eRhMk7Dko27THHkkPRHrqf",
      "previewUrl": "https://drive.google.com/file/d/1NF1o0xIcV2eRhMk7Dko27THHkkPRHrqf/preview",
      "viewUrl": "https://drive.google.com/file/d/1NF1o0xIcV2eRhMk7Dko27THHkkPRHrqf/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1NF1o0xIcV2eRhMk7Dko27THHkkPRHrqf"
    },
    {
      "unitNumber": 7,
      "fileName": "الوحدة_07_العقل_في_القرآن_الكريم.pdf",
      "fileId": "1TW6qYocJ19RAxAIuP4pmmUUAxuac24_3",
      "previewUrl": "https://drive.google.com/file/d/1TW6qYocJ19RAxAIuP4pmmUUAxuac24_3/preview",
      "viewUrl": "https://drive.google.com/file/d/1TW6qYocJ19RAxAIuP4pmmUUAxuac24_3/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1TW6qYocJ19RAxAIuP4pmmUUAxuac24_3"
    },
    {
      "unitNumber": 8,
      "fileName": "الوحدة_08_مقاصد_الشريعة_الإسلامية.pdf",
      "fileId": "1wJ3MwiIkX8-GkOSeRgrKVOrJafqskLbT",
      "previewUrl": "https://drive.google.com/file/d/1wJ3MwiIkX8-GkOSeRgrKVOrJafqskLbT/preview",
      "viewUrl": "https://drive.google.com/file/d/1wJ3MwiIkX8-GkOSeRgrKVOrJafqskLbT/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1wJ3MwiIkX8-GkOSeRgrKVOrJafqskLbT"
    },
    {
      "unitNumber": 9,
      "fileName": "الوحدة_09_منهج_الإسلام_في_محاربة_الانحراف_والجريمة.pdf",
      "fileId": "1ZkK3hj8W2-fTtTtP7nVirMpYy-N9H8At",
      "previewUrl": "https://drive.google.com/file/d/1ZkK3hj8W2-fTtTtP7nVirMpYy-N9H8At/preview",
      "viewUrl": "https://drive.google.com/file/d/1ZkK3hj8W2-fTtTtP7nVirMpYy-N9H8At/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1ZkK3hj8W2-fTtTtP7nVirMpYy-N9H8At"
    },
    {
      "unitNumber": 10,
      "fileName": "الوحدة_10_المساواة_أمام_أحكام_الشريعة_الإسلامية.pdf",
      "fileId": "18C6wP8FtWcoz3yFm2qoWLr39dh9tfKkM",
      "previewUrl": "https://drive.google.com/file/d/18C6wP8FtWcoz3yFm2qoWLr39dh9tfKkM/preview",
      "viewUrl": "https://drive.google.com/file/d/18C6wP8FtWcoz3yFm2qoWLr39dh9tfKkM/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=18C6wP8FtWcoz3yFm2qoWLr39dh9tfKkM"
    },
    {
      "unitNumber": 11,
      "fileName": "الوحدة_11_الصحة_النفسية_و��لجسمية_في_القرآن_الكريم.pdf",
      "fileId": "1qKz-krnPBOWy4xs1_I4eCH7s0KyLb-MW",
      "previewUrl": "https://drive.google.com/file/d/1qKz-krnPBOWy4xs1_I4eCH7s0KyLb-MW/preview",
      "viewUrl": "https://drive.google.com/file/d/1qKz-krnPBOWy4xs1_I4eCH7s0KyLb-MW/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1qKz-krnPBOWy4xs1_I4eCH7s0KyLb-MW"
    },
    {
      "unitNumber": 12,
      "fileName": "الوحدة_12_من_مصادر_التشريع_الإسلامي_الإجماع.pdf",
      "fileId": "1kouwh05fBJaegBphm3DTWqypJmj4coI8",
      "previewUrl": "https://drive.google.com/file/d/1kouwh05fBJaegBphm3DTWqypJmj4coI8/preview",
      "viewUrl": "https://drive.google.com/file/d/1kouwh05fBJaegBphm3DTWqypJmj4coI8/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1kouwh05fBJaegBphm3DTWqypJmj4coI8"
    },
    {
      "unitNumber": 13,
      "fileName": "الوحدة_13_من_مصادر_التشريع_الإسلامي_القياس.pdf",
      "fileId": "14zpcBBs303sGBFGucTE6yPEY5-U-PKTb",
      "previewUrl": "https://drive.google.com/file/d/14zpcBBs303sGBFGucTE6yPEY5-U-PKTb/preview",
      "viewUrl": "https://drive.google.com/file/d/14zpcBBs303sGBFGucTE6yPEY5-U-PKTb/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=14zpcBBs303sGBFGucTE6yPEY5-U-PKTb"
    },
    {
      "unitNumber": 14,
      "fileName": "الوحدة_14_من_مصادر_التشريع_الإسلامي_المصلحة_المرسلة.pdf",
      "fileId": "1tl_WReQarGPUt3dkogDHm9JliXWIh98t",
      "previewUrl": "https://drive.google.com/file/d/1tl_WReQarGPUt3dkogDHm9JliXWIh98t/preview",
      "viewUrl": "https://drive.google.com/file/d/1tl_WReQarGPUt3dkogDHm9JliXWIh98t/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1tl_WReQarGPUt3dkogDHm9JliXWIh98t"
    },
    {
      "unitNumber": 15,
      "fileName": "الوحدة_15_القيم_في_القرآن_الكريم.pdf",
      "fileId": "13Ql5j8OepQCGes2_RwnBVHa0p6WrQJOW",
      "previewUrl": "https://drive.google.com/file/d/13Ql5j8OepQCGes2_RwnBVHa0p6WrQJOW/preview",
      "viewUrl": "https://drive.google.com/file/d/13Ql5j8OepQCGes2_RwnBVHa0p6WrQJOW/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=13Ql5j8OepQCGes2_RwnBVHa0p6WrQJOW"
    },
    {
      "unitNumber": 16,
      "fileName": "الوحدة_16_الوقف_في_الإسلام.pdf",
      "fileId": "1BNY7OCUnnkURuXqbmhD3EJt5hRQ02r2M",
      "previewUrl": "https://drive.google.com/file/d/1BNY7OCUnnkURuXqbmhD3EJt5hRQ02r2M/preview",
      "viewUrl": "https://drive.google.com/file/d/1BNY7OCUnnkURuXqbmhD3EJt5hRQ02r2M/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1BNY7OCUnnkURuXqbmhD3EJt5hRQ02r2M"
    },
    {
      "unitNumber": 17,
      "fileName": "الوحدة_17_مدخل_إلى_علم_الميراث.pdf",
      "fileId": "1xDJmk9ajPT2Clcg4xyS_vvGnUJnxeA0y",
      "previewUrl": "https://drive.google.com/file/d/1xDJmk9ajPT2Clcg4xyS_vvGnUJnxeA0y/preview",
      "viewUrl": "https://drive.google.com/file/d/1xDJmk9ajPT2Clcg4xyS_vvGnUJnxeA0y/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1xDJmk9ajPT2Clcg4xyS_vvGnUJnxeA0y"
    },
    {
      "unitNumber": 18,
      "fileName": "الوحدة_18_الورثة_وطرق_إرثهم.pdf",
      "fileId": "1hLonCkPKg7GOAfDcjeNG-z13uloCIWh1",
      "previewUrl": "https://drive.google.com/file/d/1hLonCkPKg7GOAfDcjeNG-z13uloCIWh1/preview",
      "viewUrl": "https://drive.google.com/file/d/1hLonCkPKg7GOAfDcjeNG-z13uloCIWh1/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1hLonCkPKg7GOAfDcjeNG-z13uloCIWh1"
    },
    {
      "unitNumber": 19,
      "fileName": "الوحدة_19_الربا_وأحكامه.pdf",
      "fileId": "1AQ3zAYq0FN0QPLisT9uKZKI2nI55pL16",
      "previewUrl": "https://drive.google.com/file/d/1AQ3zAYq0FN0QPLisT9uKZKI2nI55pL16/preview",
      "viewUrl": "https://drive.google.com/file/d/1AQ3zAYq0FN0QPLisT9uKZKI2nI55pL16/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1AQ3zAYq0FN0QPLisT9uKZKI2nI55pL16"
    },
    {
      "unitNumber": 20,
      "fileName": "الوحدة_20_من_المعاملات_المالية_الجائزة_الصرف_التقسيط_المرابحة.pdf",
      "fileId": "1NUXa3A6KDqWRHmAaHfGRkeHG7KfDFg1S",
      "previewUrl": "https://drive.google.com/file/d/1NUXa3A6KDqWRHmAaHfGRkeHG7KfDFg1S/preview",
      "viewUrl": "https://drive.google.com/file/d/1NUXa3A6KDqWRHmAaHfGRkeHG7KfDFg1S/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1NUXa3A6KDqWRHmAaHfGRkeHG7KfDFg1S"
    },
    {
      "unitNumber": 21,
      "fileName": "الوحدة_21_الحرية_الشخصية_ومدى_ارتباطها_بحقوق_الآخرين.pdf",
      "fileId": "1M2htDDztkUh6Dc0JQJj2l63Y4B-KBzK8",
      "previewUrl": "https://drive.google.com/file/d/1M2htDDztkUh6Dc0JQJj2l63Y4B-KBzK8/preview",
      "viewUrl": "https://drive.google.com/file/d/1M2htDDztkUh6Dc0JQJj2l63Y4B-KBzK8/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1M2htDDztkUh6Dc0JQJj2l63Y4B-KBzK8"
    },
    {
      "unitNumber": 22,
      "fileName": "الوحدة_22_النسب_والتبني_والكفالة.pdf",
      "fileId": "1PxyTnyDeXEtUaHt3kJGbpBGCUP_or0Lb",
      "previewUrl": "https://drive.google.com/file/d/1PxyTnyDeXEtUaHt3kJGbpBGCUP_or0Lb/preview",
      "viewUrl": "https://drive.google.com/file/d/1PxyTnyDeXEtUaHt3kJGbpBGCUP_or0Lb/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1PxyTnyDeXEtUaHt3kJGbpBGCUP_or0Lb"
    },
    {
      "unitNumber": 23,
      "fileName": "الوحدة_23_العلاقات_الاجتماعية_بين_المسلمين_وغيرهم.pdf",
      "fileId": "1VMaVd7Dk92T2ePBcRUhTVek6u2BaqdiP",
      "previewUrl": "https://drive.google.com/file/d/1VMaVd7Dk92T2ePBcRUhTVek6u2BaqdiP/preview",
      "viewUrl": "https://drive.google.com/file/d/1VMaVd7Dk92T2ePBcRUhTVek6u2BaqdiP/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1VMaVd7Dk92T2ePBcRUhTVek6u2BaqdiP"
    }
  ],
  "1AS_ARTS": [
    {
      "unitNumber": 1,
      "fileName": "الوحدة_01_قيمة_العلم_والعلماء.pdf",
      "fileId": "1jAi1Qf8PQIrzccHJV3jXIH2zBZVuT9EO",
      "previewUrl": "https://drive.google.com/file/d/1jAi1Qf8PQIrzccHJV3jXIH2zBZVuT9EO/preview",
      "viewUrl": "https://drive.google.com/file/d/1jAi1Qf8PQIrzccHJV3jXIH2zBZVuT9EO/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1jAi1Qf8PQIrzccHJV3jXIH2zBZVuT9EO"
    },
    {
      "unitNumber": 2,
      "fileName": "الوحدة_02_سعة_فضل_الله_تعالى_وعدله_وقدرته.pdf",
      "fileId": "1jY9DxR4XF93-fsVRr9DLQzbsiKn9BZM3",
      "previewUrl": "https://drive.google.com/file/d/1jY9DxR4XF93-fsVRr9DLQzbsiKn9BZM3/preview",
      "viewUrl": "https://drive.google.com/file/d/1jY9DxR4XF93-fsVRr9DLQzbsiKn9BZM3/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1jY9DxR4XF93-fsVRr9DLQzbsiKn9BZM3"
    },
    {
      "unitNumber": 3,
      "fileName": "الوحدة_03_من_مصادر_التشريع_الإسلامي_القرآن_الكريم.pdf",
      "fileId": "1bgB9jtFvdYDRgkxjDxkaL-OOSl_ngsqf",
      "previewUrl": "https://drive.google.com/file/d/1bgB9jtFvdYDRgkxjDxkaL-OOSl_ngsqf/preview",
      "viewUrl": "https://drive.google.com/file/d/1bgB9jtFvdYDRgkxjDxkaL-OOSl_ngsqf/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1bgB9jtFvdYDRgkxjDxkaL-OOSl_ngsqf"
    },
    {
      "unitNumber": 4,
      "fileName": "الوحدة_04_من_علوم_القرآن_الكريم_نزول_القرآن_الكريم.pdf",
      "fileId": "1DCOA4ziFHqM6v7dRvWG_5ftOfRAsAjhX",
      "previewUrl": "https://drive.google.com/file/d/1DCOA4ziFHqM6v7dRvWG_5ftOfRAsAjhX/preview",
      "viewUrl": "https://drive.google.com/file/d/1DCOA4ziFHqM6v7dRvWG_5ftOfRAsAjhX/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1DCOA4ziFHqM6v7dRvWG_5ftOfRAsAjhX"
    },
    {
      "unitNumber": 5,
      "fileName": "الوحدة_05_من_علوم_القرآن_الكريم_جمع_القرآن_الكريم.pdf",
      "fileId": "1L3feonqQrg4JAuYRzX1dw1Y7y7lJ3ArE",
      "previewUrl": "https://drive.google.com/file/d/1L3feonqQrg4JAuYRzX1dw1Y7y7lJ3ArE/preview",
      "viewUrl": "https://drive.google.com/file/d/1L3feonqQrg4JAuYRzX1dw1Y7y7lJ3ArE/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1L3feonqQrg4JAuYRzX1dw1Y7y7lJ3ArE"
    },
    {
      "unitNumber": 6,
      "fileName": "الوحدة_06_من_علوم_القرآن_الكريم_مقدمة_في_علم_التجويد.pdf",
      "fileId": "1CDNe3_rSvJsejZ6mxCDqoi3CnHwU4uIZ",
      "previewUrl": "https://drive.google.com/file/d/1CDNe3_rSvJsejZ6mxCDqoi3CnHwU4uIZ/preview",
      "viewUrl": "https://drive.google.com/file/d/1CDNe3_rSvJsejZ6mxCDqoi3CnHwU4uIZ/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1CDNe3_rSvJsejZ6mxCDqoi3CnHwU4uIZ"
    },
    {
      "unitNumber": 7,
      "fileName": "الوحدة_07_من_علوم_القرآن_الكريم_أحكام_النون_والميم_الساكنتين_والتنوين.pdf",
      "fileId": "1WDWsS5P9Vk53NUC924VrnTUsywcK3iLu",
      "previewUrl": "https://drive.google.com/file/d/1WDWsS5P9Vk53NUC924VrnTUsywcK3iLu/preview",
      "viewUrl": "https://drive.google.com/file/d/1WDWsS5P9Vk53NUC924VrnTUsywcK3iLu/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1WDWsS5P9Vk53NUC924VrnTUsywcK3iLu"
    },
    {
      "unitNumber": 8,
      "fileName": "الوحدة_08_من_دلائل_قدرة_الله_تعالى.pdf",
      "fileId": "16p6df0Ans7ALonV_Ve6OKN29Dp41RC1i",
      "previewUrl": "https://drive.google.com/file/d/16p6df0Ans7ALonV_Ve6OKN29Dp41RC1i/preview",
      "viewUrl": "https://drive.google.com/file/d/16p6df0Ans7ALonV_Ve6OKN29Dp41RC1i/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=16p6df0Ans7ALonV_Ve6OKN29Dp41RC1i"
    },
    {
      "unitNumber": 9,
      "fileName": "الوحدة_09_من_ركائز_الإيمان.pdf",
      "fileId": "1M9_IrUtvOcJfpeVbTDR9f4ltaGQ5ACM8",
      "previewUrl": "https://drive.google.com/file/d/1M9_IrUtvOcJfpeVbTDR9f4ltaGQ5ACM8/preview",
      "viewUrl": "https://drive.google.com/file/d/1M9_IrUtvOcJfpeVbTDR9f4ltaGQ5ACM8/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1M9_IrUtvOcJfpeVbTDR9f4ltaGQ5ACM8"
    },
    {
      "unitNumber": 10,
      "fileName": "الوحدة_10_أدب_المؤمن_مع_الله_تعالى.pdf",
      "fileId": "1N482DOgfFoXm9gzrHdluQQ7_LrgDuFMM",
      "previewUrl": "https://drive.google.com/file/d/1N482DOgfFoXm9gzrHdluQQ7_LrgDuFMM/preview",
      "viewUrl": "https://drive.google.com/file/d/1N482DOgfFoXm9gzrHdluQQ7_LrgDuFMM/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1N482DOgfFoXm9gzrHdluQQ7_LrgDuFMM"
    },
    {
      "unitNumber": 11,
      "fileName": "الوحدة_11_من_صفات_عباد_الرحمان.pdf",
      "fileId": "1x9cJoYstzbTha9rpqNkjpusZz5CtuEet",
      "previewUrl": "https://drive.google.com/file/d/1x9cJoYstzbTha9rpqNkjpusZz5CtuEet/preview",
      "viewUrl": "https://drive.google.com/file/d/1x9cJoYstzbTha9rpqNkjpusZz5CtuEet/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1x9cJoYstzbTha9rpqNkjpusZz5CtuEet"
    },
    {
      "unitNumber": 12,
      "fileName": "الوحدة_12_الحكم_الشرعي.pdf",
      "fileId": "1CdcCKAlNMDhXtWVbFSoUg9LcsNHJkB4f",
      "previewUrl": "https://drive.google.com/file/d/1CdcCKAlNMDhXtWVbFSoUg9LcsNHJkB4f/preview",
      "viewUrl": "https://drive.google.com/file/d/1CdcCKAlNMDhXtWVbFSoUg9LcsNHJkB4f/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1CdcCKAlNMDhXtWVbFSoUg9LcsNHJkB4f"
    },
    {
      "unitNumber": 13,
      "fileName": "الوحدة_13_من_العبادات_الصلاة_عماد_الدين.pdf",
      "fileId": "1eQUXb-dvuC_jqOOU5ExKj6NrmrhtEiQB",
      "previewUrl": "https://drive.google.com/file/d/1eQUXb-dvuC_jqOOU5ExKj6NrmrhtEiQB/preview",
      "viewUrl": "https://drive.google.com/file/d/1eQUXb-dvuC_jqOOU5ExKj6NrmrhtEiQB/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1eQUXb-dvuC_jqOOU5ExKj6NrmrhtEiQB"
    },
    {
      "unitNumber": 14,
      "fileName": "الوحدة_14_من_العبادات_شروط_الصلاة_وفرائضها_وسننها_ومبطلاتها.pdf",
      "fileId": "12SGBBD_ApeOQdT7Ii7d6G7JCew4qLsgV",
      "previewUrl": "https://drive.google.com/file/d/12SGBBD_ApeOQdT7Ii7d6G7JCew4qLsgV/preview",
      "viewUrl": "https://drive.google.com/file/d/12SGBBD_ApeOQdT7Ii7d6G7JCew4qLsgV/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=12SGBBD_ApeOQdT7Ii7d6G7JCew4qLsgV"
    },
    {
      "unitNumber": 15,
      "fileName": "الوحدة_15_من_العبادات_سجود_السهو_وأحكام_المسبوق_في_الصلاة.pdf",
      "fileId": "1nwHZhLiW7ag5aboKOqim9fhCnvJZ6sZc",
      "previewUrl": "https://drive.google.com/file/d/1nwHZhLiW7ag5aboKOqim9fhCnvJZ6sZc/preview",
      "viewUrl": "https://drive.google.com/file/d/1nwHZhLiW7ag5aboKOqim9fhCnvJZ6sZc/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1nwHZhLiW7ag5aboKOqim9fhCnvJZ6sZc"
    },
    {
      "unitNumber": 16,
      "fileName": "الوحدة_16_من_العبادات_من_الصلوات_المشروعة.pdf",
      "fileId": "1n42JP2vNwFKrwBcFIu_yrE4j764rHGMJ",
      "previewUrl": "https://drive.google.com/file/d/1n42JP2vNwFKrwBcFIu_yrE4j764rHGMJ/preview",
      "viewUrl": "https://drive.google.com/file/d/1n42JP2vNwFKrwBcFIu_yrE4j764rHGMJ/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1n42JP2vNwFKrwBcFIu_yrE4j764rHGMJ"
    },
    {
      "unitNumber": 17,
      "fileName": "الوحدة_17_من_العبادات_الصيام.pdf",
      "fileId": "1EeNYoBgklAH4Zlw0QoWgvWOAVw-DJZNp",
      "previewUrl": "https://drive.google.com/file/d/1EeNYoBgklAH4Zlw0QoWgvWOAVw-DJZNp/preview",
      "viewUrl": "https://drive.google.com/file/d/1EeNYoBgklAH4Zlw0QoWgvWOAVw-DJZNp/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1EeNYoBgklAH4Zlw0QoWgvWOAVw-DJZNp"
    },
    {
      "unitNumber": 18,
      "fileName": "الوحدة_18_من_أخلاق_القرآن_الكريم.pdf",
      "fileId": "12Dfh4WW51MObtIQfYZRK1QN6f7mx_ytm",
      "previewUrl": "https://drive.google.com/file/d/12Dfh4WW51MObtIQfYZRK1QN6f7mx_ytm/preview",
      "viewUrl": "https://drive.google.com/file/d/12Dfh4WW51MObtIQfYZRK1QN6f7mx_ytm/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=12Dfh4WW51MObtIQfYZRK1QN6f7mx_ytm"
    },
    {
      "unitNumber": 19,
      "fileName": "الوحدة_19_الاستعفاف_وآثاره.pdf",
      "fileId": "12epjvI69BTFMBzlvlzf6uKUi6hY1j_Yy",
      "previewUrl": "https://drive.google.com/file/d/12epjvI69BTFMBzlvlzf6uKUi6hY1j_Yy/preview",
      "viewUrl": "https://drive.google.com/file/d/12epjvI69BTFMBzlvlzf6uKUi6hY1j_Yy/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=12epjvI69BTFMBzlvlzf6uKUi6hY1j_Yy"
    },
    {
      "unitNumber": 20,
      "fileName": "الوحدة_20_الحوار_ودوره_في_علاج_الغلو_والتطرف.pdf",
      "fileId": "1ezAT-cFjBB0cpD0yXSXjpsL0Fmxa0TA5",
      "previewUrl": "https://drive.google.com/file/d/1ezAT-cFjBB0cpD0yXSXjpsL0Fmxa0TA5/preview",
      "viewUrl": "https://drive.google.com/file/d/1ezAT-cFjBB0cpD0yXSXjpsL0Fmxa0TA5/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1ezAT-cFjBB0cpD0yXSXjpsL0Fmxa0TA5"
    },
    {
      "unitNumber": 21,
      "fileName": "الوحدة_21_الكسب_الحلال.pdf",
      "fileId": "1zjAGmQBrxUQNHG3zQqE1xIXIEBc0jkso",
      "previewUrl": "https://drive.google.com/file/d/1zjAGmQBrxUQNHG3zQqE1xIXIEBc0jkso/preview",
      "viewUrl": "https://drive.google.com/file/d/1zjAGmQBrxUQNHG3zQqE1xIXIEBc0jkso/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1zjAGmQBrxUQNHG3zQqE1xIXIEBc0jkso"
    },
    {
      "unitNumber": 22,
      "fileName": "الوحدة_22_مقدمة_في_علم_السيرة_النبوية.pdf",
      "fileId": "1cQDtSZ3wpEJGhpVPQk7T16MiGJb3c3Er",
      "previewUrl": "https://drive.google.com/file/d/1cQDtSZ3wpEJGhpVPQk7T16MiGJb3c3Er/preview",
      "viewUrl": "https://drive.google.com/file/d/1cQDtSZ3wpEJGhpVPQk7T16MiGJb3c3Er/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1cQDtSZ3wpEJGhpVPQk7T16MiGJb3c3Er"
    },
    {
      "unitNumber": 23,
      "fileName": "الوحدة_23_الرسول_في_مرحلة_شبابه.pdf",
      "fileId": "1wRqM6gQROagksv4TkN11mr-IW0nTXike",
      "previewUrl": "https://drive.google.com/file/d/1wRqM6gQROagksv4TkN11mr-IW0nTXike/preview",
      "viewUrl": "https://drive.google.com/file/d/1wRqM6gQROagksv4TkN11mr-IW0nTXike/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1wRqM6gQROagksv4TkN11mr-IW0nTXike"
    },
    {
      "unitNumber": 24,
      "fileName": "الوحدة_24_الرسول_مع_أهل_بيته.pdf",
      "fileId": "1O7IXZu6wUajYso9wjIVx8dJWkz63n9MP",
      "previewUrl": "https://drive.google.com/file/d/1O7IXZu6wUajYso9wjIVx8dJWkz63n9MP/preview",
      "viewUrl": "https://drive.google.com/file/d/1O7IXZu6wUajYso9wjIVx8dJWkz63n9MP/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1O7IXZu6wUajYso9wjIVx8dJWkz63n9MP"
    }
  ],
  "1AS_SCIENCE": [
    {
      "unitNumber": 1,
      "fileName": "الوحدة_01_قيمة_العلم_والعلماء.pdf",
      "fileId": "1YdOkQJ_Er3bw_rlh67_01ZiWnMZeBXA6",
      "previewUrl": "https://drive.google.com/file/d/1YdOkQJ_Er3bw_rlh67_01ZiWnMZeBXA6/preview",
      "viewUrl": "https://drive.google.com/file/d/1YdOkQJ_Er3bw_rlh67_01ZiWnMZeBXA6/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1YdOkQJ_Er3bw_rlh67_01ZiWnMZeBXA6"
    },
    {
      "unitNumber": 2,
      "fileName": "الوحدة_02_من_مصادر_التشريع_الإسلامي_القرآن_الكريم.pdf",
      "fileId": "1f9voK9ypHrzOQRkEGdxd9rTPGKhw3WAn",
      "previewUrl": "https://drive.google.com/file/d/1f9voK9ypHrzOQRkEGdxd9rTPGKhw3WAn/preview",
      "viewUrl": "https://drive.google.com/file/d/1f9voK9ypHrzOQRkEGdxd9rTPGKhw3WAn/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1f9voK9ypHrzOQRkEGdxd9rTPGKhw3WAn"
    },
    {
      "unitNumber": 3,
      "fileName": "الوحدة_03_من_علوم_القرآن_الكريم_مقدمة_في_علم_التجويد.pdf",
      "fileId": "1aNYxR1sCMXfgcGANvNREXrGPNUxmwIHb",
      "previewUrl": "https://drive.google.com/file/d/1aNYxR1sCMXfgcGANvNREXrGPNUxmwIHb/preview",
      "viewUrl": "https://drive.google.com/file/d/1aNYxR1sCMXfgcGANvNREXrGPNUxmwIHb/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1aNYxR1sCMXfgcGANvNREXrGPNUxmwIHb"
    },
    {
      "unitNumber": 4,
      "fileName": "الوحدة_04_من_علوم_القرآن_الكريم_أحكام_النون_والميم_الساكنتين_والتنوين.pdf",
      "fileId": "10cElzxoSwftBEjF_KweiOkE4KOPV5lwR",
      "previewUrl": "https://drive.google.com/file/d/10cElzxoSwftBEjF_KweiOkE4KOPV5lwR/preview",
      "viewUrl": "https://drive.google.com/file/d/10cElzxoSwftBEjF_KweiOkE4KOPV5lwR/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=10cElzxoSwftBEjF_KweiOkE4KOPV5lwR"
    },
    {
      "unitNumber": 5,
      "fileName": "الوحدة_05_من_دلائل_قدرة_الله_تعالى.pdf",
      "fileId": "15pFf5f6A1ArMOuZJcbZFPhd-3jLjlcZ_",
      "previewUrl": "https://drive.google.com/file/d/15pFf5f6A1ArMOuZJcbZFPhd-3jLjlcZ_/preview",
      "viewUrl": "https://drive.google.com/file/d/15pFf5f6A1ArMOuZJcbZFPhd-3jLjlcZ_/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=15pFf5f6A1ArMOuZJcbZFPhd-3jLjlcZ_"
    },
    {
      "unitNumber": 6,
      "fileName": "الوحدة_06_من_ركائز_الإيمان.pdf",
      "fileId": "10D3BHP2hi-CaHj7AzJIJHjDhP73_xp6T",
      "previewUrl": "https://drive.google.com/file/d/10D3BHP2hi-CaHj7AzJIJHjDhP73_xp6T/preview",
      "viewUrl": "https://drive.google.com/file/d/10D3BHP2hi-CaHj7AzJIJHjDhP73_xp6T/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=10D3BHP2hi-CaHj7AzJIJHjDhP73_xp6T"
    },
    {
      "unitNumber": 7,
      "fileName": "الوحدة_07_من_صفات_عباد_الرحمان.pdf",
      "fileId": "1c9wvL-SYM3Y-uBoOY2zHnOvzz5KgBmyv",
      "previewUrl": "https://drive.google.com/file/d/1c9wvL-SYM3Y-uBoOY2zHnOvzz5KgBmyv/preview",
      "viewUrl": "https://drive.google.com/file/d/1c9wvL-SYM3Y-uBoOY2zHnOvzz5KgBmyv/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1c9wvL-SYM3Y-uBoOY2zHnOvzz5KgBmyv"
    },
    {
      "unitNumber": 8,
      "fileName": "الوحدة_08_الحكم_الشرعي.pdf",
      "fileId": "1IWVCvtxhwA-6xISEkjQzhu9k7_bqRIRa",
      "previewUrl": "https://drive.google.com/file/d/1IWVCvtxhwA-6xISEkjQzhu9k7_bqRIRa/preview",
      "viewUrl": "https://drive.google.com/file/d/1IWVCvtxhwA-6xISEkjQzhu9k7_bqRIRa/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1IWVCvtxhwA-6xISEkjQzhu9k7_bqRIRa"
    },
    {
      "unitNumber": 9,
      "fileName": "الوحدة_09_من_العبادات_الصلاة_عماد_الدين.pdf",
      "fileId": "1VSn6KrsH_8lB443xBf8ntvF1Zi_NlY8t",
      "previewUrl": "https://drive.google.com/file/d/1VSn6KrsH_8lB443xBf8ntvF1Zi_NlY8t/preview",
      "viewUrl": "https://drive.google.com/file/d/1VSn6KrsH_8lB443xBf8ntvF1Zi_NlY8t/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1VSn6KrsH_8lB443xBf8ntvF1Zi_NlY8t"
    },
    {
      "unitNumber": 10,
      "fileName": "الوحدة_10_من_العبادات_الصيام.pdf",
      "fileId": "1JeMATXC1py0ZY-9nEVtsWwPnUfRVoP5a",
      "previewUrl": "https://drive.google.com/file/d/1JeMATXC1py0ZY-9nEVtsWwPnUfRVoP5a/preview",
      "viewUrl": "https://drive.google.com/file/d/1JeMATXC1py0ZY-9nEVtsWwPnUfRVoP5a/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1JeMATXC1py0ZY-9nEVtsWwPnUfRVoP5a"
    },
    {
      "unitNumber": 11,
      "fileName": "الوحدة_11_من_أخلاق_القرآن_الكريم.pdf",
      "fileId": "1K0z0vKRjySoeEglb5nrpouQIZxR_Kex3",
      "previewUrl": "https://drive.google.com/file/d/1K0z0vKRjySoeEglb5nrpouQIZxR_Kex3/preview",
      "viewUrl": "https://drive.google.com/file/d/1K0z0vKRjySoeEglb5nrpouQIZxR_Kex3/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1K0z0vKRjySoeEglb5nrpouQIZxR_Kex3"
    },
    {
      "unitNumber": 12,
      "fileName": "الوحدة_12_الاستعفاف_وآثاره.pdf",
      "fileId": "1yZwjEhmU5OsK840-NrI7TvwoWEL9uPoD",
      "previewUrl": "https://drive.google.com/file/d/1yZwjEhmU5OsK840-NrI7TvwoWEL9uPoD/preview",
      "viewUrl": "https://drive.google.com/file/d/1yZwjEhmU5OsK840-NrI7TvwoWEL9uPoD/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1yZwjEhmU5OsK840-NrI7TvwoWEL9uPoD"
    },
    {
      "unitNumber": 13,
      "fileName": "الوحدة_13_الكسب_الحلال.pdf",
      "fileId": "1OAlSTJI6Ttv7ogkFVqLBOi7O0N9wFNXa",
      "previewUrl": "https://drive.google.com/file/d/1OAlSTJI6Ttv7ogkFVqLBOi7O0N9wFNXa/preview",
      "viewUrl": "https://drive.google.com/file/d/1OAlSTJI6Ttv7ogkFVqLBOi7O0N9wFNXa/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1OAlSTJI6Ttv7ogkFVqLBOi7O0N9wFNXa"
    },
    {
      "unitNumber": 14,
      "fileName": "الوحدة_14_مقدمة_في_علم_السيرة_النبوية.pdf",
      "fileId": "1Z3eGqED6ltZr6rVPFtccH6eoLfHhU3XG",
      "previewUrl": "https://drive.google.com/file/d/1Z3eGqED6ltZr6rVPFtccH6eoLfHhU3XG/preview",
      "viewUrl": "https://drive.google.com/file/d/1Z3eGqED6ltZr6rVPFtccH6eoLfHhU3XG/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1Z3eGqED6ltZr6rVPFtccH6eoLfHhU3XG"
    },
    {
      "unitNumber": 15,
      "fileName": "الوحدة_15_الرسول_في_مرحلة_شبابه.pdf",
      "fileId": "1eVt9Oiwc4uAIyyvkSlyy9rEAaiNrYHfI",
      "previewUrl": "https://drive.google.com/file/d/1eVt9Oiwc4uAIyyvkSlyy9rEAaiNrYHfI/preview",
      "viewUrl": "https://drive.google.com/file/d/1eVt9Oiwc4uAIyyvkSlyy9rEAaiNrYHfI/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1eVt9Oiwc4uAIyyvkSlyy9rEAaiNrYHfI"
    }
  ],
  "2AS": [
    {
      "unitNumber": 1,
      "fileName": "الوحدة_01_من_خصائص_الشريعة_الإسلامية.pdf",
      "fileId": "17Tl9zyNbnYDI0TOe1dQaA-v3O-CQyYR6",
      "previewUrl": "https://drive.google.com/file/d/17Tl9zyNbnYDI0TOe1dQaA-v3O-CQyYR6/preview",
      "viewUrl": "https://drive.google.com/file/d/17Tl9zyNbnYDI0TOe1dQaA-v3O-CQyYR6/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=17Tl9zyNbnYDI0TOe1dQaA-v3O-CQyYR6"
    },
    {
      "unitNumber": 2,
      "fileName": "الوحدة_02_من_علوم_القرآن_الكريم_مدخل_إلى_علم_التفسير.pdf",
      "fileId": "1Z4Mn1ynUKNH4eECXjFnC4f1FoPq6y2eC",
      "previewUrl": "https://drive.google.com/file/d/1Z4Mn1ynUKNH4eECXjFnC4f1FoPq6y2eC/preview",
      "viewUrl": "https://drive.google.com/file/d/1Z4Mn1ynUKNH4eECXjFnC4f1FoPq6y2eC/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1Z4Mn1ynUKNH4eECXjFnC4f1FoPq6y2eC"
    },
    {
      "unitNumber": 3,
      "fileName": "الوحدة_03_من_علوم_القرآن_الكريم_المد_وأحكامه.pdf",
      "fileId": "1TSp9EwF5DiKSjFSXSx0BTenVeDIGZaQB",
      "previewUrl": "https://drive.google.com/file/d/1TSp9EwF5DiKSjFSXSx0BTenVeDIGZaQB/preview",
      "viewUrl": "https://drive.google.com/file/d/1TSp9EwF5DiKSjFSXSx0BTenVeDIGZaQB/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1TSp9EwF5DiKSjFSXSx0BTenVeDIGZaQB"
    },
    {
      "unitNumber": 4,
      "fileName": "الوحدة_04_الفطرة_الإنسانية_في_القرآن_الكريم.pdf",
      "fileId": "1I-JqjHXUoNkhU29jjPevtJfiR7lZ4G_R",
      "previewUrl": "https://drive.google.com/file/d/1I-JqjHXUoNkhU29jjPevtJfiR7lZ4G_R/preview",
      "viewUrl": "https://drive.google.com/file/d/1I-JqjHXUoNkhU29jjPevtJfiR7lZ4G_R/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1I-JqjHXUoNkhU29jjPevtJfiR7lZ4G_R"
    },
    {
      "unitNumber": 5,
      "fileName": "الوحدة_05_الغزو_الثقافي_وخطره.pdf",
      "fileId": "1NE03LJUue67CGogWP3TqN8xtVADnI7-W",
      "previewUrl": "https://drive.google.com/file/d/1NE03LJUue67CGogWP3TqN8xtVADnI7-W/preview",
      "viewUrl": "https://drive.google.com/file/d/1NE03LJUue67CGogWP3TqN8xtVADnI7-W/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1NE03LJUue67CGogWP3TqN8xtVADnI7-W"
    },
    {
      "unitNumber": 6,
      "fileName": "الوحدة_06_من_مصادر_التشريع_الإسلامي_السنة_النبوية_الشريفة.pdf",
      "fileId": "1BzfWaUmhqNG40CWR4jGIpeyVC0fZcdnB",
      "previewUrl": "https://drive.google.com/file/d/1BzfWaUmhqNG40CWR4jGIpeyVC0fZcdnB/preview",
      "viewUrl": "https://drive.google.com/file/d/1BzfWaUmhqNG40CWR4jGIpeyVC0fZcdnB/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1BzfWaUmhqNG40CWR4jGIpeyVC0fZcdnB"
    },
    {
      "unitNumber": 7,
      "fileName": "الوحدة_07_من_العبادات_الزكاة.pdf",
      "fileId": "1Yf1D4MP4haOljYGKKlFnlhLJK8cgIUQ6",
      "previewUrl": "https://drive.google.com/file/d/1Yf1D4MP4haOljYGKKlFnlhLJK8cgIUQ6/preview",
      "viewUrl": "https://drive.google.com/file/d/1Yf1D4MP4haOljYGKKlFnlhLJK8cgIUQ6/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1Yf1D4MP4haOljYGKKlFnlhLJK8cgIUQ6"
    },
    {
      "unitNumber": 8,
      "fileName": "الوحدة_08_من_العبادات_من_أحكام_الزكاة.pdf",
      "fileId": "1t0p_NhXRDjd4G4j06nWnPZUVwBaxdYD7",
      "previewUrl": "https://drive.google.com/file/d/1t0p_NhXRDjd4G4j06nWnPZUVwBaxdYD7/preview",
      "viewUrl": "https://drive.google.com/file/d/1t0p_NhXRDjd4G4j06nWnPZUVwBaxdYD7/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1t0p_NhXRDjd4G4j06nWnPZUVwBaxdYD7"
    },
    {
      "unitNumber": 9,
      "fileName": "الوحدة_09_من_العبادات_الحج_وأحكامه.pdf",
      "fileId": "1cPsEA9GAreDSTk3wBQ0U9V-03nez069g",
      "previewUrl": "https://drive.google.com/file/d/1cPsEA9GAreDSTk3wBQ0U9V-03nez069g/preview",
      "viewUrl": "https://drive.google.com/file/d/1cPsEA9GAreDSTk3wBQ0U9V-03nez069g/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1cPsEA9GAreDSTk3wBQ0U9V-03nez069g"
    },
    {
      "unitNumber": 10,
      "fileName": "الوحدة_10_نعمة_الأمن_في_القرآن_الكريم.pdf",
      "fileId": "1GTmX6fI9-vVFtYh6lGZNI3a_-l5rKBqb",
      "previewUrl": "https://drive.google.com/file/d/1GTmX6fI9-vVFtYh6lGZNI3a_-l5rKBqb/preview",
      "viewUrl": "https://drive.google.com/file/d/1GTmX6fI9-vVFtYh6lGZNI3a_-l5rKBqb/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1GTmX6fI9-vVFtYh6lGZNI3a_-l5rKBqb"
    },
    {
      "unitNumber": 11,
      "fileName": "الوحدة_11_من_أحكام_الأسرة_الزواج_وأحكامه.pdf",
      "fileId": "1Sh50Apar8oJsay-0H-Ifj_XG8OhfBjme",
      "previewUrl": "https://drive.google.com/file/d/1Sh50Apar8oJsay-0H-Ifj_XG8OhfBjme/preview",
      "viewUrl": "https://drive.google.com/file/d/1Sh50Apar8oJsay-0H-Ifj_XG8OhfBjme/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1Sh50Apar8oJsay-0H-Ifj_XG8OhfBjme"
    },
    {
      "unitNumber": 12,
      "fileName": "الوحدة_12_من_أحكام_الأسرة_الأنكحة_الفاسدة.pdf",
      "fileId": "1JNHT_kwiMN7Afa1l75TCOPfozXexb6Kw",
      "previewUrl": "https://drive.google.com/file/d/1JNHT_kwiMN7Afa1l75TCOPfozXexb6Kw/preview",
      "viewUrl": "https://drive.google.com/file/d/1JNHT_kwiMN7Afa1l75TCOPfozXexb6Kw/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1JNHT_kwiMN7Afa1l75TCOPfozXexb6Kw"
    },
    {
      "unitNumber": 13,
      "fileName": "الوحدة_13_من_أحكام_الأسرة_حقوق_الزوجين_وواجباتهما.pdf",
      "fileId": "1heJKYUblVz_0dkkHWhJPdr6iUIgPRgFL",
      "previewUrl": "https://drive.google.com/file/d/1heJKYUblVz_0dkkHWhJPdr6iUIgPRgFL/preview",
      "viewUrl": "https://drive.google.com/file/d/1heJKYUblVz_0dkkHWhJPdr6iUIgPRgFL/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1heJKYUblVz_0dkkHWhJPdr6iUIgPRgFL"
    },
    {
      "unitNumber": 14,
      "fileName": "الوحدة_14_من_أحكام_الأسرة_الصلح_بين_الزوجين.pdf",
      "fileId": "1qQHtN4kSzOZA0n72snL-UCjxoWcN1VGH",
      "previewUrl": "https://drive.google.com/file/d/1qQHtN4kSzOZA0n72snL-UCjxoWcN1VGH/preview",
      "viewUrl": "https://drive.google.com/file/d/1qQHtN4kSzOZA0n72snL-UCjxoWcN1VGH/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1qQHtN4kSzOZA0n72snL-UCjxoWcN1VGH"
    },
    {
      "unitNumber": 15,
      "fileName": "الوحدة_15_من_أحكام_الأسرة_الطلاق.pdf",
      "fileId": "1AdoXQ6NmFL1_ifIZGzGCHesg2XJLh8WJ",
      "previewUrl": "https://drive.google.com/file/d/1AdoXQ6NmFL1_ifIZGzGCHesg2XJLh8WJ/preview",
      "viewUrl": "https://drive.google.com/file/d/1AdoXQ6NmFL1_ifIZGzGCHesg2XJLh8WJ/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1AdoXQ6NmFL1_ifIZGzGCHesg2XJLh8WJ"
    },
    {
      "unitNumber": 16,
      "fileName": "الوحدة_16_من_أحكام_الأسرة_الخلع_وأحكامه.pdf",
      "fileId": "1EuKZZizSEs0ZsLqtGOMcnmCDXUvfhc9E",
      "previewUrl": "https://drive.google.com/file/d/1EuKZZizSEs0ZsLqtGOMcnmCDXUvfhc9E/preview",
      "viewUrl": "https://drive.google.com/file/d/1EuKZZizSEs0ZsLqtGOMcnmCDXUvfhc9E/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1EuKZZizSEs0ZsLqtGOMcnmCDXUvfhc9E"
    },
    {
      "unitNumber": 17,
      "fileName": "الوحدة_17_من_أحكام_الأسرة_العدة_وأحكامها.pdf",
      "fileId": "1sF0TrPd-azLV0aaInkJ7Z03o7grjtngk",
      "previewUrl": "https://drive.google.com/file/d/1sF0TrPd-azLV0aaInkJ7Z03o7grjtngk/preview",
      "viewUrl": "https://drive.google.com/file/d/1sF0TrPd-azLV0aaInkJ7Z03o7grjtngk/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1sF0TrPd-azLV0aaInkJ7Z03o7grjtngk"
    },
    {
      "unitNumber": 18,
      "fileName": "الوحدة_18_من_توجيهات_الرسول_صلة_الآباء_بالأولاد_العدل_في_الهبات.pdf",
      "fileId": "1OmV6Zh04mR4164PndyDjGQmuoxPC8ctq",
      "previewUrl": "https://drive.google.com/file/d/1OmV6Zh04mR4164PndyDjGQmuoxPC8ctq/preview",
      "viewUrl": "https://drive.google.com/file/d/1OmV6Zh04mR4164PndyDjGQmuoxPC8ctq/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1OmV6Zh04mR4164PndyDjGQmuoxPC8ctq"
    },
    {
      "unitNumber": 19,
      "fileName": "الوحدة_19_الحقوق_المدنية_في_القرآن_الكريم.pdf",
      "fileId": "19gA3r9H_3FFOYQYUJ8wZhpFISNBx269z",
      "previewUrl": "https://drive.google.com/file/d/19gA3r9H_3FFOYQYUJ8wZhpFISNBx269z/preview",
      "viewUrl": "https://drive.google.com/file/d/19gA3r9H_3FFOYQYUJ8wZhpFISNBx269z/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=19gA3r9H_3FFOYQYUJ8wZhpFISNBx269z"
    },
    {
      "unitNumber": 20,
      "fileName": "الوحدة_20_الترف_وآثاره.pdf",
      "fileId": "1L79YbsZ2Cfbp5RHbw9ryRwQvQzsY0TEK",
      "previewUrl": "https://drive.google.com/file/d/1L79YbsZ2Cfbp5RHbw9ryRwQvQzsY0TEK/preview",
      "viewUrl": "https://drive.google.com/file/d/1L79YbsZ2Cfbp5RHbw9ryRwQvQzsY0TEK/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1L79YbsZ2Cfbp5RHbw9ryRwQvQzsY0TEK"
    },
    {
      "unitNumber": 21,
      "fileName": "الوحدة_21_الشبهات_وموقف_المسلم_منها.pdf",
      "fileId": "1nTMUiRszl2WhzOli5VxOjeHA6zkVAfMB",
      "previewUrl": "https://drive.google.com/file/d/1nTMUiRszl2WhzOli5VxOjeHA6zkVAfMB/preview",
      "viewUrl": "https://drive.google.com/file/d/1nTMUiRszl2WhzOli5VxOjeHA6zkVAfMB/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1nTMUiRszl2WhzOli5VxOjeHA6zkVAfMB"
    },
    {
      "unitNumber": 22,
      "fileName": "الوحدة_22_المذاهب_الفقهية_وأسباب_اختلافها.pdf",
      "fileId": "1iTH1YZWw-jK6KnJRQ7-Nqa_YSJmz_tjW",
      "previewUrl": "https://drive.google.com/file/d/1iTH1YZWw-jK6KnJRQ7-Nqa_YSJmz_tjW/preview",
      "viewUrl": "https://drive.google.com/file/d/1iTH1YZWw-jK6KnJRQ7-Nqa_YSJmz_tjW/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1iTH1YZWw-jK6KnJRQ7-Nqa_YSJmz_tjW"
    },
    {
      "unitNumber": 23,
      "fileName": "الوحدة_23_رسائل_الرسول_إلى_ملوك_وأمراء_عصره.pdf",
      "fileId": "1HbCDglMApycbsehwlulEvAthhCETTSPw",
      "previewUrl": "https://drive.google.com/file/d/1HbCDglMApycbsehwlulEvAthhCETTSPw/preview",
      "viewUrl": "https://drive.google.com/file/d/1HbCDglMApycbsehwlulEvAthhCETTSPw/view?usp=drivesdk",
      "downloadUrl": "https://drive.google.com/uc?export=download&id=1HbCDglMApycbsehwlulEvAthhCETTSPw"
    }
  ]
};

/**
 * الحصول على معلومات مجلد Google Drive لأي مستوى دراسي
 */
export function getDriveFolderForLevel(level: GradeLevel): DriveFolderInfo {
  return DRIVE_FOLDERS[level] || DRIVE_FOLDERS['3AS'];
}

/**
 * الحصول على ملف المذكرة PDF الخاص بالوحدة حصراً من Google Drive
 */
export function getUnitDriveMetadata(unit: {
  id: string;
  level: GradeLevel;
  unitNumber: number;
  title: string;
}): {
  driveFileId?: string;
  driveFileName?: string;
  drivePreviewUrl?: string;
  driveViewUrl?: string;
  driveDownloadUrl?: string;
} {
  const levelFiles = DRIVE_UNIT_FILES[unit.level] || [];
  
  // 1. المطابقة برقم الوحدة
  let matched = levelFiles.find(f => f.unitNumber === unit.unitNumber);
  
  // 2. أو المطابقة بكلمات من العنوان
  if (!matched && unit.title) {
    const cleanTitle = unit.title.replace(/[\/\?<>\\:\*\|":_\-\s]/g, '');
    matched = levelFiles.find(f => {
      const cleanFileName = f.fileName.replace(/[\/\?<>\\:\*\|":_\-\s]/g, '');
      return cleanFileName.includes(cleanTitle) || cleanTitle.includes(cleanFileName.replace('الوحدة', '').replace('.pdf', ''));
    });
  }

  // حالة خاصة: خطبة حجة الوداع بالسنة الثالثة ثانوي
  if (!matched && unit.level === '3AS' && (unit.unitNumber === 24 || unit.title.includes('حجة الوداع'))) {
    matched = {
      unitNumber: 24,
      fileName: 'الوحدة_24_خطبة_حجة_الوداع.pdf',
      fileId: '1VMaVd7Dk92T2ePBcRUhTVek6u2BaqdiP',
      previewUrl: 'https://drive.google.com/file/d/1VMaVd7Dk92T2ePBcRUhTVek6u2BaqdiP/preview',
      viewUrl: 'https://drive.google.com/file/d/1VMaVd7Dk92T2ePBcRUhTVek6u2BaqdiP/view?usp=drivesdk',
      downloadUrl: 'https://drive.google.com/uc?export=download&id=1VMaVd7Dk92T2ePBcRUhTVek6u2BaqdiP'
    };
  }

  if (matched) {
    return {
      driveFileId: matched.fileId,
      driveFileName: matched.fileName,
      drivePreviewUrl: matched.previewUrl,
      driveViewUrl: matched.viewUrl,
      driveDownloadUrl: matched.downloadUrl
    };
  }

  // في حال عدم العثور على ملف خاص محدد، لا يتم عرض المجلد كاملاً منعاً للخلط
  return {};
}

/**
 * إثراء الوحدات التعليمية بروابط ملفات المذكرات PDF الخاصة بكل وحدة حصراً
 */
export function enrichUnitsWithDriveData(units: CurriculumUnit[]): CurriculumUnit[] {
  return units.map(unit => {
    const meta = getUnitDriveMetadata(unit);
    return {
      ...unit,
      driveFileId: unit.driveFileId || meta.driveFileId,
      driveFileName: unit.driveFileName || meta.driveFileName,
      drivePreviewUrl: unit.drivePreviewUrl || meta.drivePreviewUrl,
      driveViewUrl: unit.driveViewUrl || meta.driveViewUrl,
      driveDownloadUrl: unit.driveDownloadUrl || meta.driveDownloadUrl,
      pdfFileName: unit.pdfFileName || meta.driveFileName
    };
  });
}
