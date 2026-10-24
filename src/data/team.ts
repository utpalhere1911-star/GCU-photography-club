export interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: "Leadership" | "Faculty" | "Core Member";
  initials: string;
  department?: string;
  photoUrl?: string;
  objectPosition?: string;
}

/**
 * Official Club Leadership and Committee
 * Source: Official ShutterScape Club Details Document (GCU, Guwahati)
 */
export const teamMembers: TeamMember[] = [
  {
    id: "dr-sangeeta",
    name: "Dr. Sangeeta Das",
    role: "Faculty Coordinator",
    category: "Faculty",
    initials: "SD",
    department: "Dept. of Mechanical Engineering",
    photoUrl: "/team/dr_sangeeta_das.png",
    objectPosition: "center 25%",
  },
  {
    id: "dr-barsha",
    name: "Dr. Barsha Chhetri",
    role: "Faculty Co-Coordinator",
    category: "Faculty",
    initials: "BC",
    department: "Dept. of Education",
    photoUrl: "/team/dr_barsha_chhetri.jpeg",
    objectPosition: "center 25%",
  },
  {
    id: "uttama",
    name: "Uttama Purkayastha",
    role: "President",
    category: "Leadership",
    initials: "UP",
    photoUrl: "/team/uttama_purkayastha.jpeg",
    objectPosition: "center 18%",
  },
  {
    id: "ikhyt",
    name: "Ikhyt De Neog",
    role: "Vice-President",
    category: "Leadership",
    initials: "IN",
    photoUrl: "/team/ikhyt_de_neog.jpeg",
    objectPosition: "center 22%",
  },
  {
    id: "richita",
    name: "Richita Sarma",
    role: "Secretary",
    category: "Leadership",
    initials: "RS",
    photoUrl: "/team/richita_sarma.jpeg",
    objectPosition: "center 25%",
  },
  {
    id: "sohaib",
    name: "Sohaib Hussain",
    role: "Core Member",
    category: "Core Member",
    initials: "SH",
    photoUrl: "/team/sohaib_hussain.png",
    objectPosition: "center 20%",
  },
  {
    id: "mahadananda",
    name: "Mahadananda Dutta",
    role: "Core Member",
    category: "Core Member",
    initials: "MD",
    photoUrl: "/team/mahadananda_dutta.jpeg",
    objectPosition: "center 25%",
  },
  {
    id: "manash",
    name: "Manash Pratim Sarma",
    role: "Core Member",
    category: "Core Member",
    initials: "MS",
    photoUrl: "/team/manash_pratim_sarma.jpeg",
    objectPosition: "center 20%",
  },
  {
    id: "mubina",
    name: "Mubina Ahmed",
    role: "Core Member",
    category: "Core Member",
    initials: "MA",
    photoUrl: "/team/mubina_ahmed.jpeg",
    objectPosition: "center 20%",
  },
  {
    id: "pratyush",
    name: "Pratyush Bikash Choudhury",
    role: "Core Member",
    category: "Core Member",
    initials: "PC",
    photoUrl: "/team/pratyush_bikash_choudhury.jpeg",
    objectPosition: "center 52%",
  },
  {
    id: "hiya",
    name: "Hiya Das",
    role: "Core Member",
    category: "Core Member",
    initials: "HD",
    photoUrl: "/team/hiya_das.png",
    objectPosition: "center 20%",
  },
];

