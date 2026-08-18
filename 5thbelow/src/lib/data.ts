import type { Tone } from "@/components/kit";
import {
  Calculator,
  FlaskConical,
  BookOpen,
  Globe2,
  Laptop,
  Palette,
  type LucideIcon,
} from "lucide-react";

export type Subject = {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  icon: LucideIcon;
  color: Tone;
  notes: number;
};

export const subjects: Subject[] = [
  { id: "maths", name: "Mathematics", desc: "Numbers, Shapes & Puzzles", emoji: "🔢", icon: Calculator, color: "blue", notes: 4 },
  { id: "science", name: "Science", desc: "Plants, Animals & Space", emoji: "🔬", icon: FlaskConical, color: "green", notes: 3 },
  { id: "english", name: "English", desc: "Stories, Words & Writing", emoji: "📖", icon: BookOpen, color: "purple", notes: 5 },
  { id: "social", name: "EVS / Social", desc: "Our Earth & Neighborhood", emoji: "🌎", icon: Globe2, color: "orange", notes: 2 },
  { id: "art", name: "Art & Creativity", desc: "Colors, Shapes & Doodles", emoji: "🎨", icon: Palette, color: "pink", notes: 6 },
];

export const kids = [
  { id: "aarav", name: "Aarav", grade: "Grade 3", section: "Alpha", emoji: "🦊", color: "orange" as Tone, stars: 120, badges: 8, streak: 5, progressPercent: 80 },
  { id: "ananya", name: "Ananya", grade: "Grade 3", section: "Alpha", emoji: "🌸", color: "pink" as Tone, stars: 110, badges: 7, streak: 4, progressPercent: 75 },
  { id: "vihaan", name: "Vihaan", grade: "Grade 2", section: "Butterflies", emoji: "🐼", color: "blue" as Tone, stars: 95, badges: 6, streak: 3, progressPercent: 65 },
  { id: "aditya", name: "Aditya", grade: "Grade 4", section: "Dolphins", emoji: "🦁", color: "yellow" as Tone, stars: 140, badges: 10, streak: 7, progressPercent: 90 },
  { id: "kavya", name: "Kavya", grade: "Grade 1", section: "Sunflowers", emoji: "🐝", color: "green" as Tone, stars: 70, badges: 4, streak: 2, progressPercent: 50 },
];

export type HomeworkItem = {
  id: string;
  subject: string;
  emoji: string;
  title: string;
  description: string;
  questions: string[];
  due: string;
  color: Tone;
  status: "To Do" | "In Progress" | "Completed";
  submission?: string;
};

export const initialHomework: HomeworkItem[] = [
  {
    id: "hw-1",
    subject: "Mathematics",
    emoji: "🔢",
    title: "Math Addition & Subtraction",
    description: "Solve the 3 addition problems in your notebook or write your answers below.",
    questions: ["1. What is 25 + 17?", "2. What is 50 - 18?", "3. If you have 12 apples and pick 8 more, how many do you have?"],
    due: "Due Today",
    color: "blue",
    status: "To Do",
  },
  {
    id: "hw-2",
    subject: "Science",
    emoji: "🔬",
    title: "Draw and Label a Plant",
    description: "Open your Science notebook and draw the 4 main parts of a plant (Roots, Stem, Leaves, Flower).",
    questions: ["1. Name the part of the plant under the ground.", "2. Which part makes food for the plant?"],
    due: "Due Tomorrow",
    color: "green",
    status: "In Progress",
  },
  {
    id: "hw-3",
    subject: "English",
    emoji: "📖",
    title: "Read Chapter 2 & Write 3 Words",
    description: "Read 'The Panchatantra Tales' and write three new words you learned.",
    questions: ["1. What was the lesson from the story?", "2. Write 3 new words and their meanings."],
    due: "Due Friday",
    color: "purple",
    status: "To Do",
  },
  {
    id: "hw-4",
    subject: "Art & Creativity",
    emoji: "🎨",
    title: "Color the Indian Peacock",
    description: "Use crayons or brush in your Art notebook to color a beautiful national bird peacock.",
    questions: ["1. Color the peacock page in your Art book."],
    due: "Completed",
    color: "pink",
    status: "Completed",
    submission: "I finished coloring the peacock using royal blue, emerald green, and yellow crayons!",
  },
];

export const quiz = [
  { id: "q1", q: "HOW MANY APPLES ARE HERE?", visual: "🍎 🍎 🍎 🍎 🍎", options: ["4", "5", "6"], answer: "5", subject: "Maths" },
  { id: "q2", q: "HOW MANY STARS ARE SHINING?", visual: "⭐ ⭐ ⭐", options: ["2", "3", "5"], answer: "3", subject: "Maths" },
  { id: "q3", q: "WHICH ANIMAL IS LARGER?", visual: "🐘   🐁", options: ["🐘 Elephant", "🐁 Mouse"], answer: "🐘 Elephant", subject: "Science" },
  { id: "q4", q: "WHAT IS THE COLOR OF THE SUN?", visual: "☀️", options: ["Blue", "Yellow", "Purple"], answer: "Yellow", subject: "Science" },
];

export const badges = [
  { id: "b1", title: "Math Explorer", emoji: "🏅", desc: "Solved 50 Math Puzzles", color: "blue" as Tone, unlocked: true },
  { id: "b2", title: "Reading Champion", emoji: "📚", desc: "Read 10 Storybooks", color: "purple" as Tone, unlocked: true },
  { id: "b3", title: "Science Detective", emoji: "🔬", desc: "Completed 5 Science Labs", color: "green" as Tone, unlocked: true },
  { id: "b4", title: "Homework Hero", emoji: "✏️", desc: "Finished 5 Assignments on Time", color: "orange" as Tone, unlocked: true },
  { id: "b5", title: "Curious Learner", emoji: "💡", desc: "Explored 20 New Topics", color: "yellow" as Tone, unlocked: true },
  { id: "b6", title: "Creative Artist", emoji: "🎨", desc: "Drew 15 Masterpieces", color: "pink" as Tone, unlocked: true },
  { id: "b7", title: "Star Collector", emoji: "⭐", desc: "Collected 100 Stars", color: "yellow" as Tone, unlocked: true },
  { id: "b8", title: "Streak Master", emoji: "🔥", desc: "5 Days Learning Streak", color: "orange" as Tone, unlocked: true },
];

export const notebookThemes = [
  { id: "default", name: "Classic Slate", emoji: "📜", bgStyle: "repeating-linear-gradient(to bottom, transparent 0 39px, rgba(23,37,84,0.10) 39px 40px)" },
  { id: "rainbow", name: "Rainbow", emoji: "🌈", bgStyle: "linear-gradient(135deg, rgba(255,220,230,0.4) 0%, rgba(220,240,255,0.4) 50%, rgba(220,255,230,0.4) 100%), repeating-linear-gradient(to bottom, transparent 0 39px, rgba(140,80,220,0.12) 39px 40px)" },
  { id: "space", name: "Space", emoji: "🚀", bgStyle: "radial-gradient(circle at 10% 20%, rgba(15,23,42,0.06) 0%, transparent 40%), repeating-linear-gradient(to bottom, transparent 0 39px, rgba(59,130,246,0.12) 39px 40px)" },
  { id: "ocean", name: "Ocean", emoji: "🌊", bgStyle: "linear-gradient(180deg, rgba(224,242,254,0.5) 0%, rgba(186,230,253,0.3) 100%), repeating-linear-gradient(to bottom, transparent 0 39px, rgba(14,116,144,0.12) 39px 40px)" },
  { id: "nature", name: "Nature", emoji: "🌳", bgStyle: "linear-gradient(180deg, rgba(220,252,231,0.5) 0%, rgba(187,247,208,0.3) 100%), repeating-linear-gradient(to bottom, transparent 0 39px, rgba(21,128,61,0.12) 39px 40px)" },
  { id: "dinosaur", name: "Dinosaur", emoji: "🦖", bgStyle: "linear-gradient(135deg, rgba(254,243,199,0.5) 0%, rgba(253,230,138,0.3) 100%), repeating-linear-gradient(to bottom, transparent 0 39px, rgba(180,83,9,0.12) 39px 40px)" },
  { id: "butterfly", name: "Butterfly", emoji: "🦋", bgStyle: "linear-gradient(135deg, rgba(243,232,255,0.5) 0%, rgba(233,213,255,0.3) 100%), repeating-linear-gradient(to bottom, transparent 0 39px, rgba(126,34,206,0.12) 39px 40px)" },
];

export const attendanceDays = [
  { date: "Mon, Aug 4", status: "present", day: "Mon" },
  { date: "Tue, Aug 5", status: "present", day: "Tue" },
  { date: "Wed, Aug 6", status: "present", day: "Wed" },
  { date: "Thu, Aug 7", status: "present", day: "Thu" },
  { date: "Fri, Aug 8", status: "present", day: "Fri" },
  { date: "Mon, Aug 11", status: "present", day: "Mon" },
  { date: "Tue, Aug 12", status: "late", day: "Tue" },
  { date: "Wed, Aug 13", status: "present", day: "Wed" },
  { date: "Thu, Aug 14", status: "present", day: "Thu" },
  { date: "Fri, Aug 15", status: "absent", day: "Fri" },
];

export const exploreArticles = [
  { id: "e1", title: "Why do plants need sunlight?", subject: "Science", emoji: "🌱", summary: "Plants use sunlight to make their own food through a process called photosynthesis!", tags: ["Plants", "Nature"] },
  { id: "e2", title: "How big is the Moon?", subject: "Science", emoji: "🌙", summary: "The Moon is about one-fourth the size of Earth. It is our planet's closest space neighbor!", tags: ["Space", "Moon"] },
  { id: "e3", title: "Fun with 3D Shapes", subject: "Mathematics", emoji: "🧊", summary: "Cubes, spheres, cones, and cylinders are all around us in real life objects!", tags: ["Geometry", "Shapes"] },
  { id: "e4", title: "What makes a good story?", subject: "English", emoji: "📖", summary: "Every great story has friendly characters, a fun setting, and an exciting adventure!", tags: ["Stories", "Reading"] },
];

export const teacherInfo = {
  name: "Ms. Priya Sharma",
  role: "Class 3 Alpha Teacher",
  avatar: "👩‍🏫",
  email: "priya.sharma@smartslate.edu.in",
  announcements: [
    { id: "a1", emoji: "🔬", title: "Science Leaf Activity", body: "Bring 2 fresh green leaves for tomorrow's Science class!", date: "Today" },
    { id: "a2", emoji: "🎨", title: "Drawing Day on Friday", body: "Don't forget your watercolors and drawing notebooks on Friday morning.", date: "Yesterday" },
    { id: "a3", emoji: "🏃", title: "Sports Hour Uniform", body: "Wear white sports shoes for physical education class on Wednesday.", date: "Aug 8" },
  ],
};

export const classmates = [
  { name: "Aarav", emoji: "🦊" },
  { name: "Ananya", emoji: "🌸" },
  { name: "Aditya", emoji: "🦁" },
  { name: "Kavya", emoji: "🐝" },
  { name: "Rahul", emoji: "🐼" },
  { name: "Priya", emoji: "🦋" },
  { name: "Arjun", emoji: "🐨" },
  { name: "Sneha", emoji: "🐧" },
  { name: "Riya", emoji: "🐰" },
  { name: "Sai", emoji: "🐸" },
  { name: "Harsha", emoji: "🐬" },
  { name: "Lakshmi", emoji: "🦄" },
];

export const homework = initialHomework;
export const announcements = teacherInfo.announcements;
