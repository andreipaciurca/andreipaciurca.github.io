/*
 * Single source of truth for profile data.
 * Keep content in English; app.js handles automatic runtime translation.
 */
window.profileData = {
  availabilityMode: "notice", // "immediate" or "notice"
  birthDateIso: "1998-05-07",
  candidateName: "Andrei-Alexandru Paciurca",
  profilePictureUrl: "profile-photo.jpg", // Put your uploaded photo in repo root with this file name
  profileInitials: "AP",
  location: "Iasi, Romania",
  jobType: "Full-time / Remote",
  driversLicense: "Category B",
  role: "Senior Software Engineer focused on backend and distributed data-intensive systems.",
  statusLine: "ACTIVE CANDIDATE · OPEN TO WORK",
  summary:
    "I build production systems that stay reliable under scale, complexity, and real business pressure. My work spans Java backend engineering, cloud data platforms, and low-level software foundations.",
  activityMessages: [
    "Analyzing production constraints and engineering trade-offs...",
    "Compiling a concise impact report for distributed data pipelines...",
    "Optimizing backend architecture for reliability, scale, and maintainability..."
  ],
  topBar: {
    firstVisitMessage: "Welcome to my 127.0.0.1",
    commandMessage: "$ code session --agent=viewer --profile=andrei",
    commandCursor: "|",
    buttonLabels: {
      close: "x",
      minimize: "-",
      maximize: "+"
    },
    launcherSpeechText: "Pss! Please open and hire me!",
    launcherIconClass: "fa-solid fa-robot"
  },
  contact: {
    email: "andreipaciurca@icloud.com",
    phone: "+40748376161",
    linkedinUrl: "https://www.linkedin.com/in/andreipaciurca",
    githubUrl: "https://github.com/andreipaciurca"
  },
  skillGroups: [
    {
      id: "backend",
      label: "Backend Engineering",
      items: [
        { iconClass: "fa-brands fa-java", label: "Java" },
        { iconClass: "fa-solid fa-code-branch", label: "Scala" },
        { iconClass: "fa-brands fa-python", label: "Python" },
        { iconClass: "fa-solid fa-seedling", label: "Spring Boot" },
        { iconClass: "fa-solid fa-leaf", label: "Micronaut" },
        { iconClass: "fa-solid fa-database", label: "SQL" }
      ]
    },
    {
      id: "data",
      label: "Data and Streaming",
      items: [
        { iconClass: "fa-solid fa-stream", label: "Kafka" },
        { iconClass: "fa-solid fa-bolt", label: "Spark" },
        { iconClass: "fa-solid fa-chart-line", label: "Data Pipelines" },
        { iconClass: "fa-solid fa-network-wired", label: "Distributed Systems" }
      ]
    },
    {
      id: "cloud",
      label: "Cloud and Infrastructure",
      items: [
        { iconClass: "fa-brands fa-aws", label: "AWS" },
        { iconClass: "fa-solid fa-cubes-stacked", label: "Terraform" },
        { iconClass: "fa-brands fa-docker", label: "Docker" },
        { iconClass: "fa-solid fa-dharmachakra", label: "Kubernetes" }
      ]
    },
    {
      id: "process",
      label: "Delivery and Engineering Process",
      items: [
        { iconClass: "fa-solid fa-gears", label: "CI/CD" },
        { iconClass: "fa-brands fa-git-alt", label: "Git" },
        { iconClass: "fa-solid fa-people-group", label: "Mentoring" },
        { iconClass: "fa-solid fa-shield-halved", label: "Production Reliability" }
      ]
    }
  ],
  experiences: [
    {
      title: "Senior Java Software Engineer",
      company: "Deloitte",
      period: "May 2024 - Present",
      location: "Remote",
      bullets: [
        "Design and maintain distributed data pipelines processing millions of daily events for a major banking institution in Norway.",
        "Build end-to-end data flows using Kafka, AWS Glue, and Spark with complex financial business logic at scale.",
        "Drive reliability, performance, and code quality improvements for production-critical systems."
      ]
    },
    {
      title: "Java Software Engineer",
      company: "Deloitte",
      period: "August 2022 - May 2024",
      location: "Remote",
      bullets: [
        "Developed software for UK public sector projects, including NHS and Home Office initiatives.",
        "Worked with Java 17, Micronaut, Scala, Python, Groovy, and Bash in cross-functional teams.",
        "Contributed to platform enhancements and continuous improvement in production environments."
      ]
    },
    {
      title: "Embedded C Junior Software Developer",
      company: "Vitesco Technologies",
      period: "July 2021 - July 2022",
      location: "Iasi, Romania",
      bullets: [
        "Developed embedded C software for automotive ECUs following AUTOSAR and MISRA C 2012 standards.",
        "Worked with multicore microcontrollers, RTOS environments, and safety-focused engineering workflows.",
        "Performed unit testing and contributed to quality-focused automotive software delivery."
      ]
    },
    {
      title: "C++ Intern Software Developer",
      company: "Continental",
      period: "July 2020 - July 2021",
      location: "Iasi, Romania",
      bullets: [
        "Built internship projects with Raspberry Pi, Flask, C/C++, and practical test-driven software tasks.",
        "Worked on HTTP server functionality, automation scripts, and engineering problem solving."
      ]
    }
  ],
  education: [
    {
      iconClass: "fa-solid fa-graduation-cap",
      title: "B.Sc. in Computer Science and Engineering",
      details:
        "Faculty of Automatic Control and Computer Engineering, Iasi | 2017 - 2021 | GPA 9.25",
      extra: "Thesis: Real-Time Traffic Sign Recognition using Deep Learning and CNNs."
    },
    {
      iconClass: "fa-solid fa-school",
      title: "Assistant Programmer",
      details: "Colegiul National Grigore Moisil Onesti | 2013 - 2017",
      extra: ""
    }
  ],
  certifications: [
    {
      iconClass: "fa-solid fa-database",
      title: "Oracle Certified Associate, Java SE 8 Programmer",
      issuer: "Oracle",
      issued: "Issued Feb 2025",
      skills: ["Java 8", "Core Java"],
      credentialId: ""
    },
    {
      iconClass: "fa-brands fa-aws",
      title: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services (AWS)",
      issued: "Issued Oct 2022",
      expires: "Expires Oct 2025",
      credentialId: "Credential ID VLWXF4D1R1BQQ2K1"
    },
    {
      iconClass: "fa-solid fa-database",
      title: "Database Design and Programming with SQL",
      issuer: "Oracle",
      issued: "Issued May 2017",
      credentialId: ""
    },
    {
      iconClass: "fa-solid fa-id-card",
      title: "European Computer Driving Licence",
      issuer: "ICDL Certification",
      issued: "Issued Nov 2014",
      credentialId: "Credential ID RO-C 4290"
    }
  ],
  printResume: {
    language: "en", // "en" recommended for ATS parsing, optional: "ro"
    maxBulletsPerExperience: 2
  }
};
