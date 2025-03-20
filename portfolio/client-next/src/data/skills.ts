export type Skill = {
  id: number;
  name: string;
  category: string;
  level: number; // 1-5
};

export const skills: Skill[] = [
  // AI & Machine Learning
  { id: 1, name: "Python", category: "AI", level: 4 },
  { id: 3, name: "PyTorch", category: "AI", level: 3 },
  { id: 4, name: "Scikit-learn", category: "AI", level: 4 },
  { id: 5, name: "Natural Language Processing", category: "AI", level: 3 },
  { id: 7, name: "Deep Learning", category: "AI", level: 3 },
  { id: 8, name: "Machine Learning", category: "AI", level: 4 },

  // DevOps
  { id: 9, name: "Docker", category: "DevOps", level: 4 },
  { id: 12, name: "AWS", category: "DevOps", level: 4 },
  { id: 13, name: "Terraform", category: "DevOps", level: 3 },
  { id: 14, name: "CI/CD", category: "DevOps", level: 4 },
  { id: 15, name: "Git", category: "DevOps", level: 5 },
  { id: 16, name: "Monitoring & Logging", category: "DevOps", level: 3 },

  // CyberSecurity
  { id: 17, name: "Network Security", category: "CyberSecurity", level: 4 },
  { id: 18, name: "Penetration Testing", category: "CyberSecurity", level: 3 },
  { id: 19, name: "Security Auditing", category: "CyberSecurity", level: 3 },
  { id: 21, name: "Security Tools", category: "CyberSecurity", level: 4 },
  { id: 22, name: "Incident Response", category: "CyberSecurity", level: 3 },
  { id: 23, name: "Threat Analysis", category: "CyberSecurity", level: 3 },
  { id: 24, name: "Security Compliance", category: "CyberSecurity", level: 4 },
];
