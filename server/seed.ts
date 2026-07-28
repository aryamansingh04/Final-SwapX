import bcrypt from "bcryptjs";
import { db } from "./db.js";

const DEMO_USERS = [
  {
    id: "235673797",
    email: "demo@swapx.com",
    password: "Demo@123",
    name: "Alex Demo",
    username: "alexdemo",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=AlexDemo",
    bio: "Frontend developer exploring skill swaps. I teach React and TypeScript.",
    location: "San Francisco, CA",
    occupation: "Frontend Developer",
    skills: ["React", "TypeScript", "UI Design"],
    skillsToLearn: ["Python", "Data Science"],
    rating: 4.8,
  },
  {
    id: "159115001",
    email: "demo2@swapx.com",
    password: "Demo2@456",
    name: "Jordan Demo",
    username: "jordandemo",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JordanDemo",
    bio: "Backend engineer ready to swap Python skills for frontend tips.",
    location: "Austin, TX",
    occupation: "Backend Engineer",
    skills: ["Python", "Django", "PostgreSQL"],
    skillsToLearn: ["React", "UI Design"],
    rating: 4.7,
  },
];

export function seedDatabase() {
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, name)
    VALUES (?, ?, ?, ?)
  `);

  const insertProfile = db.prepare(`
    INSERT OR IGNORE INTO profiles (
      id, username, full_name, avatar_url, bio, skills, skills_to_learn, desired_skills, rating
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const demo of DEMO_USERS) {
    const hash = bcrypt.hashSync(demo.password, 10);
    insertUser.run(demo.id, demo.email.toLowerCase(), hash, demo.name);
    insertProfile.run(
      demo.id,
      demo.username,
      demo.name,
      demo.avatar,
      demo.bio,
      JSON.stringify(demo.skills),
      JSON.stringify(demo.skillsToLearn),
      JSON.stringify(demo.skillsToLearn),
      demo.rating
    );
  }

  console.log("Database seeded with demo accounts");
}
