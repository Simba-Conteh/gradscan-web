export const UNIVERSITIES = [
  "Manchester Metropolitan University", "University of Manchester", "University of Salford",
  "University of Oxford", "University of Cambridge", "Imperial College London", "UCL",
  "King's College London", "LSE", "Queen Mary University of London", "City, University of London",
  "University of Edinburgh", "University of Glasgow", "University of Strathclyde",
  "University of Birmingham", "Aston University", "Birmingham City University",
  "University of Leeds", "Leeds Beckett University", "University of Sheffield",
  "Sheffield Hallam University", "University of Liverpool", "Liverpool John Moores University",
  "University of Nottingham", "Nottingham Trent University", "University of Bristol",
  "UWE Bristol", "University of Warwick", "Coventry University", "University of Southampton",
  "University of York", "Durham University", "Newcastle University", "Northumbria University",
  "Lancaster University", "University of Bath", "University of Exeter", "Cardiff University",
  "Swansea University", "Queen's University Belfast", "Ulster University",
  "University of Leicester", "De Montfort University", "Loughborough University",
  "University of Surrey", "University of Sussex", "University of Kent", "University of Reading",
  "Brunel University", "University of Hertfordshire", "Middlesex University",
  "University of Westminster", "Kingston University", "University of Greenwich",
  "University of East Anglia", "University of Essex", "University of Hull",
  "University of Bradford", "Keele University", "Staffordshire University",
  "University of Central Lancashire", "Edge Hill University", "University of Huddersfield",
  "University of Portsmouth", "Bournemouth University", "Oxford Brookes University",
  "University of Plymouth", "University of Derby", "Teesside University",
  "Heriot-Watt University", "University of Aberdeen", "University of Dundee",
  "University of Stirling", "Other UK university",
];

export const SECTORS = [
  "Technology", "Consulting", "Finance - Tech", "Banking & Finance", "Data & Analytics",
  "Engineering", "Marketing & Media", "Public Sector", "Law", "Retail & FMCG",
];

export const TRAITS = [
  "Creativity", "Leadership", "Teamwork", "Communication", "Analytical", "Resilience",
  "Attention to detail", "Commercial awareness", "Curiosity", "Problem solving",
];

export const GRADES = ["First", "2:1", "2:2", "Third", "Predicted First", "Predicted 2:1", "Predicted 2:2"];

export const CV_KEYWORDS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Vue", "Angular", "Node.js", "C#", ".NET",
  "ASP.NET", "Java", "Python", "SQL", "PostgreSQL", "MySQL", "SQL Server", "SQLite", "MongoDB",
  "Prisma", "Tailwind", "HTML", "CSS", "Git", "GitHub", "Docker", "AWS", "Azure", "GCP",
  "Vercel", "CI/CD", "REST", "GraphQL", "API", "JWT", "Figma", "Power BI", "Excel", "Tableau",
  "Agile", "Scrum", "Linux", "Kotlin", "Swift", "PHP", "Ruby", "Go", "Rust", "C++",
  "Machine Learning", "Data Analysis", "DaVinci Resolve", "Photoshop", "Premiere", "Unity",
  "Firebase", "Supabase", "Kubernetes", "Terraform", "Jira", "Salesforce",
];

export const GRADE_RANK: Record<string, number> = {
  First: 4, "Predicted First": 4,
  "2:1": 3, "Predicted 2:1": 3,
  "2:2": 2, "Predicted 2:2": 2,
  Third: 1, Pass: 1,
};
