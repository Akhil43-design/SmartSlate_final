/* Firestore Cloud Demo Data Seed Script for SmartSlate Connect */

const demoSeedData = {
  users: [
    {
      uid: "teacher_demo_uid",
      name: "Prof. Sharma",
      email: "teacher@smartslate.edu",
      role: "teacher",
      phone: "+91 98765 43210",
      createdAt: new Date().toISOString()
    },
    {
      uid: "parent_demo_uid",
      name: "Rajesh Mehta",
      email: "parent@smartslate.edu",
      role: "parent",
      phone: "+91 98765 12345",
      createdAt: new Date().toISOString()
    }
  ],
  classes: [
    {
      id: "c101",
      name: "Class 10-A",
      section: "A",
      subject: "Mathematics",
      teacherId: "teacher_demo_uid",
      studentIds: ["s1", "s2", "s3", "s4", "s5"],
      academicYear: "2026"
    },
    {
      id: "c102",
      name: "Class 10-B",
      section: "B",
      subject: "Physics",
      teacherId: "teacher_demo_uid",
      studentIds: ["s6", "s7", "s8"],
      academicYear: "2026"
    }
  ],
  students: [
    { id: "s1", userId: "u_s1", name: "Aarav Mehta", studentCode: "STU-1001", classId: "c101" },
    { id: "s2", userId: "u_s2", name: "Ananya Verma", studentCode: "STU-1002", classId: "c101" },
    { id: "s3", userId: "u_s3", name: "Rohan Gupta", studentCode: "STU-1003", classId: "c101" }
  ],
  assignments: [
    {
      id: "a1",
      classId: "c101",
      className: "Class 10-A",
      teacherId: "teacher_demo_uid",
      title: "Quadratic Equations Problem Set",
      description: "Complete Problems 1 to 15 from Chapter 4.",
      subject: "Mathematics",
      priority: "High",
      dueAtFormatted: "Aug 15, 2026 - 11:59 PM",
      status: "published",
      submissionCount: 4,
      totalStudents: 5
    }
  ],
  parents: [
    {
      userId: "parent_demo_uid",
      name: "Rajesh Mehta",
      email: "parent@smartslate.edu",
      studentIds: ["s1"]
    }
  ]
};

console.log("SmartSlate Cloud Demo Data Schema compiled successfully.");
module.exports = demoSeedData;
