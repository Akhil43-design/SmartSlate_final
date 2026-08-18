/* Test Failure Isolation in Parent Dashboard with Native Node */
const fs = require('fs');
const path = require('path');

// Simple DOM element mock
class MockElement {
    constructor(tagName = 'div') {
        this.tagName = tagName;
        this._innerHTML = '';
        this.children = [];
        this.dataset = {};
        this.style = {};
        this.classList = {
            _classes: new Set(),
            add: (c) => this.classList._classes.add(c),
            remove: (c) => this.classList._classes.delete(c),
            contains: (c) => this.classList._classes.has(c)
        };
        this._eventListeners = {};
    }

    get innerHTML() {
        return this._innerHTML;
    }

    set innerHTML(val) {
        this._innerHTML = val;
    }

    get textContent() {
        return this._innerHTML.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    addEventListener(evt, fn) {
        if (!this._eventListeners[evt]) this._eventListeners[evt] = [];
        this._eventListeners[evt].push(fn);
    }

    querySelector(sel) {
        if (sel === '#parent-children-switcher-container') return new MockElement('div');
        if (sel === '#parent-child-hero-card') return new MockElement('div');
        if (sel === '#parent-active-tab-content') return this._activeTabContent || (this._activeTabContent = new MockElement('div'));
        if (sel === '#active-child-status-badge') return new MockElement('div');
        if (sel.includes('.btn-retry-current-tab') || sel.includes('btn-retry')) {
            return this._innerHTML.includes('btn-retry-current-tab') ? new MockElement('button') : null;
        }
        return new MockElement('div');
    }

    querySelectorAll(sel) {
        return [];
    }
}

async function testFailureIsolation() {
    console.log("===============================================================");
    console.log("🧪 TESTING FAILURE ISOLATION & TIMEOUT RESILIENCE");
    console.log("===============================================================");

    const parentViewCode = fs.readFileSync(path.join(__dirname, '../parent-teacher/public/js/views/parentView.js'), 'utf8');

    // Global mock setup
    global.window = global;
    global.App = {
        currentUser: { id: 'parent_ramesh_01', uid: 'kExI0Vtkw4Rka2mmobnSGxmKYjy1', name: 'Ramesh Kumar', role: 'parent' },
        showModal: () => {},
        closeModal: () => {},
        toast: (msg, type) => console.log(`[Toast ${type}]: ${msg}`)
    };

    global.API = {
        getChildren: async () => ({
            children: [{
                student_id: '5005',
                student_uid: 'stu_101',
                student_code: 'STU-101',
                student_name: 'Akhil',
                name: 'Akhil',
                class_name: '10th Class — Section A',
                section: 'A',
                education_level: 'High School',
                school_name: 'SmartSlate Academy'
            }]
        }),
        // Simulate Exams FAILING with network error
        getChildExams: async () => { throw new Error("Network timeout 504"); },
        getChildOverview: async () => ({
            student: { name: 'Akhil', student_code: 'STU-101' },
            kpis: { overallProgress: 88, examAverage: 90, examsCompleted: 4, assignmentsCompleted: 6, totalAssignments: 8, attendancePercentage: 95 }
        }),
        getChildNotes: async () => ({ notes: [{ id: 1, title: 'Science Notes', subject: 'Physics' }] }),
        getChildSearches: async () => ({ activity: [] }),
        getChildAssignments: async () => ({ assignments: [] }),
        getChildAttendance: async () => ({ presentDays: 42, absentDays: 3, totalDays: 45, percentage: 93.3 }),
        getChildAnnouncements: async () => ({ announcements: [] })
    };

    global.firebaseAuthService = {
        auth: { currentUser: { uid: 'kExI0Vtkw4Rka2mmobnSGxmKYjy1' } },
        getParentChildren: async () => [],
        getStudentExamSubmissions: async () => { throw new Error("Firestore permission denied"); },
        getStudentNotes: async () => [],
        getStudentProgress: async () => null
    };

    eval(parentViewCode);

    const container = new MockElement('div');
    await ParentView.render(container);

    console.log("\n--- Verification 1: Children Loaded Successfully ---");
    console.log(`Children Count: ${ParentView.children.length}`);
    if (ParentView.children.length === 1 && ParentView.children[0].student_name === 'Akhil') {
        console.log("✅ [PASS] Connected Child card rendered immediately despite downstream section errors!");
    } else {
        console.error("❌ Failed to render child card!");
        process.exit(1);
    }

    console.log("\n--- Verification 2: Active Tab Switching to Failing Exams Tab ---");
    ParentView.activeTab = 'exams';
    const contentArea = new MockElement('div');
    await ParentView.renderActiveTabContent(contentArea);

    console.log("Rendered HTML in Failing Exams Tab:\n", contentArea.innerHTML);
    if (contentArea.innerHTML.includes('Unable to load this information') && contentArea.innerHTML.includes('btn-retry-current-tab')) {
        console.log("✅ [PASS] Section failure properly caught and isolated with dedicated [ 🔄 Retry ] button!");
    } else {
        console.error("❌ Section failure was not properly isolated with retry button!");
        process.exit(1);
    }

    console.log("\n--- Verification 3: Switch to Working Notes Tab ---");
    ParentView.activeTab = 'notes';
    await ParentView.renderActiveTabContent(contentArea);
    console.log("Rendered HTML in Notes Tab:\n", contentArea.innerHTML.substring(0, 200) + '...');
    if (contentArea.innerHTML.includes('Science Notes')) {
        console.log("✅ [PASS] Other dashboard tabs continue functioning without being blocked by the failed section!");
    } else {
        console.error("❌ Notes tab failed to render!");
        process.exit(1);
    }

    console.log("\n===============================================================");
    console.log("🎉 ALL FAILURE ISOLATION & RETRY TESTS PASSED 100%");
    console.log("===============================================================");
}

testFailureIsolation().catch(err => {
    console.error("Fatal test error:", err);
    process.exit(1);
});
