/**
 * Predefined extraction used by the demonstration mode of POST /api/parse-resume.
 * The shape matches what DeepSeek is asked to return, so both modes travel through
 * the same validation, mapping and persistence path.
 */
const sample = {
  personalInfo: {
    fullName: 'Aina Rahman',
    email: 'aina.rahman@example.my',
    phone: '+60 12-345 6789',
    location: 'Shah Alam, Selangor',
    headline: 'IT diploma graduate seeking a junior data analyst role'
  },
  education: [
    {
      institution: 'Kolej Technologi MARA Shah Alam',
      qualification: 'Diploma',
      fieldOfStudy: 'Information Technology',
      startYear: 2022,
      endYear: 2024,
      detail: 'CGPA 3.52, Dean\'s List 2023'
    },
    {
      institution: 'SMK Bukit Jelutong',
      qualification: 'Sijil Pelajaran Malaysia',
      fieldOfStudy: 'Science stream',
      startYear: 2019,
      endYear: 2021,
      detail: 'Credits in Mathematics and Add Mathematics'
    }
  ],
  experience: [
    {
      organisation: 'Syarikat Maju Digital Sdn Bhd',
      role: 'IT Intern',
      location: 'Petaling Jaya, Selangor',
      period: 'Mar 2024 - Aug 2024',
      startYear: 2024,
      endYear: 2024,
      highlights: [
        'Consolidated weekly sales records in Excel and prepared the monthly management report.',
        'Wrote SQL queries to pull customer activity from the company reporting database.',
        'Automated a folder cleanup and file-naming task with a Python script.'
      ]
    },
    {
      organisation: 'Kelab Teknologi Kolej',
      role: 'Treasurer (part-time)',
      location: 'Shah Alam, Selangor',
      period: '2023 - 2024',
      startYear: 2023,
      endYear: 2024,
      highlights: [
        'Maintained the membership spreadsheet and tracked event spending for 120 members.',
        'Briefed the committee on attendance and budget status each month.'
      ]
    }
  ],
  technicalSkills: [
    { name: 'Microsoft Excel', evidence: 'Weekly sales records and monthly management reports during an internship at Syarikat Maju Digital' },
    { name: 'SQL', evidence: 'Reporting database queries during internship' },
    { name: 'Python', evidence: 'Automation script and coursework' },
    { name: 'HTML and CSS', evidence: 'Built the club website' },
    { name: 'Power BI', evidence: 'Attendance dashboard coursework project' },
    { name: 'Microsoft Word', evidence: 'Documented service procedures' }
  ],
  softSkills: [
    { name: 'Communication', evidence: 'Monthly briefings to the college committee' },
    { name: 'Teamwork', evidence: 'Worked with the reporting team during the internship' },
    { name: 'Problem solving', evidence: 'Traced and fixed recurring spreadsheet errors' }
  ],
  projects: [
    {
      name: 'Campus attendance tracker',
      description: 'Spreadsheet system that records attendance and exports a summary report per programme.',
      link: null,
      period: '2023'
    },
    {
      name: 'Kolej club website',
      description: 'Responsive three-page site built with HTML and CSS for event announcements.',
      link: 'https://example.my/kelab-teknologi',
      period: '2024'
    }
  ],
  certifications: [
    { name: 'Microsoft Office Specialist: Excel Associate', issuer: 'Microsoft', year: 2023 },
    { name: 'Google Data Analytics Certificate', issuer: 'Google', year: 2024 }
  ],
  languages: [
    { name: 'Bahasa Melayu', proficiency: 'Native' },
    { name: 'English', proficiency: 'Professional' },
    { name: 'Mandarin', proficiency: 'Intermediate' }
  ]
};

export function sampleResume() {
  return structuredClone(sample);
}
