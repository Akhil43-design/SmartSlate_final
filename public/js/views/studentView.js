/* Student Dashboard View Component */

const StudentView = {
    activeTab: 'bookshelf', // 'bookshelf', 'assignments', 'chat', 'exams', 'history', 'search', 'attendance'
    currentBook: null,
    currentNote: null,
    autoSaveTimer: null,

    async render(container) {
        container.innerHTML = `
            <div class="dashboard-header">
                <div>
                    <h1 class="dashboard-title">Student Hub</h1>
                    <p class="dashboard-subtitle">Manage notebooks, assignments, exams, and class chats</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="student-btn-new-book" class="glass-btn glass-btn-primary">
                        <svg class="icon-svg"><use href="#icon-plus"/></svg>
                        <span>New Notebook</span>
                    </button>
                </div>
            </div>

            <!-- Child-Friendly Tab Bar -->
            <div class="tab-bar">
                <button class="tab-btn ${this.activeTab === 'bookshelf' ? 'active' : ''}" data-tab="bookshelf">📚 My Books</button>
                <button class="tab-btn ${this.activeTab === 'assignments' ? 'active' : ''}" data-tab="assignments">📝 Homework Tasks</button>
                <button class="tab-btn ${this.activeTab === 'teacher' ? 'active' : ''}" data-tab="teacher">👩‍🏫 My Teacher</button>
                <button class="tab-btn ${this.activeTab === 'chat' ? 'active' : ''}" data-tab="chat">💬 Class Chat</button>
                <button class="tab-btn ${this.activeTab === 'exams' ? 'active' : ''}" data-tab="exams">🎯 Quizzes & Exams</button>
                <button class="tab-btn ${this.activeTab === 'history' ? 'active' : ''}" data-tab="history">🔍 My Past Pages</button>
                <button class="tab-btn ${this.activeTab === 'search' ? 'active' : ''}" data-tab="search">🌐 Study Search</button>
                <button class="tab-btn ${this.activeTab === 'attendance' ? 'active' : ''}" data-tab="attendance">📅 My Attendance</button>
            </div>

            <!-- Sub View Container -->
            <div id="student-tab-content"></div>
        `;

        this.bindTabEvents(container);
        this.renderTabContent(container.querySelector('#student-tab-content'));
    },

    bindTabEvents(container) {
        container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.activeTab = tab;
                container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.renderTabContent(container.querySelector('#student-tab-content'));
            });
        });

        const newBookBtn = container.querySelector('#student-btn-new-book');
        if (newBookBtn) {
            newBookBtn.addEventListener('click', () => this.showNewBookModal());
        }
    },

    async renderTabContent(contentArea) {
        contentArea.innerHTML = `<div style="text-align: center; padding: 40px;"><div class="spinner" style="margin: 0 auto;"></div></div>`;

        try {
            switch (this.activeTab) {
                case 'bookshelf':
                    await this.renderBookshelf(contentArea);
                    break;
                case 'notebook-detail':
                    await this.renderNotebookDetail(contentArea);
                    break;
                case 'assignments':
                    await this.renderAssignments(contentArea);
                    break;
                case 'teacher':
                    await this.renderMyTeacher(contentArea);
                    break;
                case 'chat':
                    await this.renderChat(contentArea);
                    break;
                case 'exams':
                    await this.renderExams(contentArea);
                    break;
                case 'history':
                    await this.renderNotesHistory(contentArea);
                    break;
                case 'search':
                    await this.renderSearch(contentArea);
                    break;
                case 'attendance':
                    await this.renderAttendance(contentArea);
                    break;
                default:
                    await this.renderBookshelf(contentArea);
            }
        } catch (err) {
            contentArea.innerHTML = `<div class="glass-card" style="color: var(--status-danger);">Error loading tab: ${err.message}</div>`;
        }
    },

    // 8.1 Bookshelf & 3D Cover Flip Animation
    async renderBookshelf(container) {
        const res = await API.getBooks();
        const books = res.books || [];

        if (books.length === 0) {
            container.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 48px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">📚</div>
                    <h3>Your Bookshelf is empty</h3>
                    <p style="color: var(--text-secondary); margin: 8px 0 16px;">Create your first subject notebook to start writing notes.</p>
                    <button class="glass-btn glass-btn-primary" onclick="StudentView.showNewBookModal()">Create Notebook</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="bookshelf-grid">
                ${books.map(b => `
                    <div class="book-container bouncy-btn" data-id="${b.id}">
                        <div class="book-cover ${b.cover_style || 'blue_linen'}">
                            <div class="book-spine"></div>
                            <div class="book-content">
                                <span class="glass-badge" style="background: rgba(255,255,255,0.25); color: white; border: none;">${b.subject || 'General'}</span>
                                <h3 class="book-title">${b.title}</h3>
                                <div class="book-footer">
                                    <span>${b.notes_count || 0} Pages</span>
                                    <span>Open →</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // 3D Cover Flip Animation Trigger on Click
        container.querySelectorAll('.book-container').forEach(card => {
            card.addEventListener('click', (e) => {
                const bookId = e.currentTarget.dataset.id;
                const bookObj = books.find(b => b.id == bookId);

                // Play 3D Cover opening flip animation (<300ms)
                e.currentTarget.classList.add('opening');

                setTimeout(() => {
                    this.currentBook = bookObj;
                    this.activeTab = 'notebook-detail';
                    this.renderTabContent(document.querySelector('#student-tab-content'));
                }, 280);
            });
        });
    },

    // Notebook Detail & Notes Editor with 5 Paper Rule Types & Page Choice Prompt
    async renderNotebookDetail(container) {
        if (!this.currentBook) {
            this.activeTab = 'bookshelf';
            return this.renderTabContent(container);
        }

        // Reset stylus history for the new note
        this.stylusHistory = [];
        this.stylusHistoryIndex = -1;

        const res = await API.getNotes(this.currentBook.id);
        const notes = res.notes || [];

        // Default to first note if not set
        if (!this.currentNote && notes.length > 0) {
            this.currentNote = notes[0];
        }

        const activePageIndex = notes.findIndex(n => n.id == (this.currentNote ? this.currentNote.id : 0)) + 1 || (notes.length > 0 ? 1 : 0);

        container.innerHTML = `
            <div style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div>
                    <button id="btn-back-bookshelf" class="glass-btn glass-btn-sm" style="margin-bottom: 8px;">← Back to My Books</button>
                    <h2 style="font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span>${this.currentBook.title}</span>
                        <span class="glass-badge glass-badge-accent">${this.currentBook.subject}</span>
                        <span id="note-page-number-badge" class="glass-badge glass-badge-success" style="font-size: 13px; font-weight: 700; border-color: rgba(46, 204, 113, 0.3);">Page ${activePageIndex} of ${notes.length || 1}</span>
                    </h2>
                </div>
                <button id="btn-create-note-top" class="glass-btn glass-btn-primary bouncy-btn">
                    <svg class="icon-svg"><use href="#icon-plus"/></svg>
                    <span>+ Add New Page</span>
                </button>
            </div>

            <!-- TOP PAGES NAVIGATION BAR -->
            <div class="glass-panel" style="padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; overflow-x: auto; scrollbar-width: none;">
                <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; white-space: nowrap;">PAGES (${notes.length}):</span>
                <div id="top-pages-tab-strip" style="display: flex; align-items: center; gap: 8px; flex: 1;">
                    ${notes.length === 0 ? '<p style="font-size: 13px; color: var(--text-muted);">No pages created yet. Click "+ Add New Page".</p>' : ''}
                    ${notes.map((n, idx) => `
                        <button class="glass-btn glass-btn-sm note-top-tab-item ${this.currentNote && this.currentNote.id == n.id ? 'glass-btn-primary' : 'glass-btn-secondary'}" data-id="${n.id}" style="white-space: nowrap; gap: 6px; touch-action: manipulation;">
                            <span>📄 Page ${idx + 1}: ${n.title || 'Untitled'}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Full-Width Note Editor Surface -->
            <div id="note-editor-container" style="width: 100%;">
                ${this.currentNote ? this.renderNoteEditorHTML(this.currentNote) : '<div class="glass-card" style="text-align: center; padding: 60px;"><p style="color: var(--text-secondary);">Select a page from the top menu or click "Add New Page".</p></div>'}
            </div>
        `;

        container.querySelector('#btn-back-bookshelf').addEventListener('click', () => {
            this.activeTab = 'bookshelf';
            this.renderTabContent(document.querySelector('#student-tab-content'));
        });

        const showNewPageChoiceModal = () => {
            App.showModal(`
                <div class="modal-card" style="max-width: 480px; text-align: center;">
                    <div class="modal-header">
                        <h3 class="modal-title">Create New Page</h3>
                        <button class="modal-close" onclick="App.closeModal()">✕</button>
                    </div>
                    <p style="color: var(--text-secondary); margin: 12px 0 20px;">Choose how you want your new page to start:</p>
                    <div style="display: flex; flex-direction: column; gap: 14px;">
                        <button id="btn-choice-blank" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 16px; font-weight: 700;">
                            📄 Start a New Blank Page
                        </button>
                        <button id="btn-choice-preserve" class="glass-btn glass-btn-secondary bouncy-btn" style="padding: 16px; font-weight: 700;">
                            📋 Continue / Preserve Previous Page's Content
                        </button>
                    </div>
                </div>
            `);

            const modal = document.getElementById('modal-container');
            modal.querySelector('#btn-choice-blank').addEventListener('click', async () => {
                App.closeModal();
                const newRes = await API.createNote(this.currentBook.id, `Page ${notes.length + 1}`, 'ruled', '');
                this.currentNote = newRes.note;
                this.renderNotebookDetail(container);
            });

            modal.querySelector('#btn-choice-preserve').addEventListener('click', async () => {
                App.closeModal();
                const prevContent = this.currentNote ? this.currentNote.content : '';
                const newRes = await API.createNote(this.currentBook.id, `Page ${notes.length + 1}`, this.currentNote ? this.currentNote.rule_type : 'ruled', prevContent);
                this.currentNote = newRes.note;
                this.renderNotebookDetail(container);
            });
        };

        const createNoteBtn = container.querySelector('#btn-create-note-top');
        if (createNoteBtn) {
            createNoteBtn.addEventListener('click', showNewPageChoiceModal);
        }

        container.querySelectorAll('.note-top-tab-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const noteId = e.currentTarget.dataset.id;
                this.currentNote = notes.find(n => n.id == noteId);
                this.renderNotebookDetail(container);
            });
        });

        if (this.currentNote) {
            this.bindEditorEvents(container);
        }
    },

    renderNoteEditorHTML(note) {
        let textContent = note.content || '';
        let canvasData = null;

        try {
            if (note.content && note.content.startsWith('{')) {
                const parsed = JSON.parse(note.content);
                if (parsed.type === 'smartslate_note_v2') {
                    textContent = parsed.text || '';
                    canvasData = parsed.canvasData || null;
                }
            }
        } catch (e) {}

        return `
            <div class="glass-card" style="padding: 20px; width: 100%;">
                <!-- Header Toolbar -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 12px;">
                    <input type="text" id="note-title-input" class="glass-input" value="${note.title}" style="max-width: 280px; font-weight: 700; font-size: 18px;" placeholder="Page Title...">

                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <!-- Full Screen Writing Mode Toggle -->
                        <button id="btn-fullscreen-note" class="glass-btn glass-btn-secondary glass-btn-sm" title="Toggle Full Screen Writing Mode">
                            <svg class="icon-svg"><use href="#icon-menu"/></svg>
                            <span id="fullscreen-btn-label">Full Screen</span>
                        </button>

                        <!-- 5 Rule Types Selector -->
                        <select id="note-ruletype-select" class="glass-select" style="width: auto;">
                            <option value="ruled" ${note.rule_type === 'ruled' ? 'selected' : ''}>📏 Single Ruled</option>
                            <option value="double_ruled" ${note.rule_type === 'double_ruled' ? 'selected' : ''}>📏 Double Ruled</option>
                            <option value="four_ruled" ${note.rule_type === 'four_ruled' ? 'selected' : ''}>✍️ Four Ruled (Handwriting)</option>
                            <option value="half_ruled" ${note.rule_type === 'half_ruled' ? 'selected' : ''}>🖼️ Half Ruled (Diagram)</option>
                            <option value="plain" ${note.rule_type === 'plain' ? 'selected' : ''}>📄 Plain White</option>
                        </select>

                        <!-- Share Note Button -->
                        <button id="btn-share-note" class="glass-btn glass-btn-secondary glass-btn-sm" title="Share with Classmate">
                            <svg class="icon-svg"><use href="#icon-share"/></svg>
                            <span>Share</span>
                        </button>

                        <button id="btn-delete-note" class="glass-btn glass-btn-sm" style="color: var(--status-danger);" title="Delete Page">Delete</button>

                        <!-- Auto Save Status Indicator -->
                        <span id="auto-save-status" class="glass-badge glass-badge-success" style="font-size: 12px;">Saved ✓</span>
                    </div>
                </div>

                <!-- STYLUS / PAINT TOOLBAR -->
                <div class="stylus-toolbar" style="flex-direction: column; gap: 8px; width: 100%;">
                    <!-- Row 1: Drawing Tools -->
                    <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; width: 100%;">
                        <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; min-width: 40px;">TOOLS</span>
                        <div class="stylus-tool-group">
                            <button class="stylus-tool-btn active" data-tool="select" title="Select & Edit Text/Components">👆 Select Text</button>
                            <button class="stylus-tool-btn" data-tool="pen" title="Pen">✏️ Pen</button>
                            <button class="stylus-tool-btn" data-tool="highlighter" title="Highlighter">🖊️ Highlight</button>
                            <button class="stylus-tool-btn" data-tool="eraser" title="Eraser">🧹 Eraser</button>
                            <button class="stylus-tool-btn" data-tool="fill" title="Fill / Bucket">🪣 Fill</button>
                            <button class="stylus-tool-btn" data-tool="text_canvas" title="Text on Canvas">🔤 Canvas Text</button>
                            <button class="stylus-tool-btn" data-tool="line" title="Straight Line">╱ Line</button>
                            <button class="stylus-tool-btn" data-tool="rect" title="Rectangle">▭ Rect</button>
                            <button class="stylus-tool-btn" data-tool="circle" title="Circle/Ellipse">◯ Circle</button>
                            <button class="stylus-tool-btn" data-tool="arrow" title="Arrow">↗ Arrow</button>
                        </div>
                    </div>
                    <!-- Row 2: Colors, Sizes, Actions -->
                    <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; width: 100%;">
                        <div class="stylus-tool-group">
                            <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">INK</span>
                            <div class="color-swatch active" data-color="#1A365D" style="background: #1A365D;" title="Navy Ink"></div>
                            <div class="color-swatch" data-color="#1A202C" style="background: #1A202C;" title="Pencil Black"></div>
                            <div class="color-swatch" data-color="#E53E3E" style="background: #E53E3E;" title="Red Pen"></div>
                            <div class="color-swatch" data-color="#2F855A" style="background: #2F855A;" title="Green Pen"></div>
                            <div class="color-swatch" data-color="#3182CE" style="background: #3182CE;" title="Blue Pen"></div>
                            <div class="color-swatch" data-color="#805AD5" style="background: #805AD5;" title="Purple"></div>
                            <div class="color-swatch" data-color="#DD6B20" style="background: #DD6B20;" title="Orange"></div>
                            <div class="color-swatch" data-color="#FFFFFF" style="background: #FFFFFF; border: 1px solid #ccc;" title="White (Eraser-paint)"></div>
                            <div class="color-swatch" data-color="rgba(255,235,59,0.5)" style="background: #ECC94B;" title="Yellow Highlight"></div>
                        </div>
                        <div class="stylus-tool-group">
                            <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">SIZE</span>
                            <button class="stroke-size-btn" data-size="1.5" title="Fine">1</button>
                            <button class="stroke-size-btn active" data-size="3" title="Medium">2</button>
                            <button class="stroke-size-btn" data-size="6" title="Bold">3</button>
                            <button class="stroke-size-btn" data-size="14" title="Broad">4</button>
                        </div>
                        <div class="stylus-tool-group">
                            <button class="stylus-tool-btn" id="btn-undo-stroke" title="Undo">↩️ Undo</button>
                            <button class="stylus-tool-btn" id="btn-redo-stroke" title="Redo">↪️ Redo</button>
                            <button class="stylus-tool-btn" id="btn-clear-canvas" style="color: var(--status-danger);" title="Clear All Ink">🧼 Clear</button>
                        </div>
                    </div>
                </div>

                <!-- Paper Sheet Container matching chosen Rule Type -->
                <div id="paper-sheet-element" class="paper-sheet ${note.rule_type}" style="position: relative; width: 100%;">
                    <textarea id="note-content-textarea" class="note-editor-textarea" placeholder="Start writing with your stylus or type notes...">${textContent}</textarea>
                    <canvas id="stylus-canvas" class="stylus-canvas pointer-events-none"></canvas>
                </div>

                <!-- Add Page Button - Fixed at bottom center, expands canvas -->
                <div style="display: flex; justify-content: center; padding: 18px 0 6px 0;">
                    <button id="btn-add-page" class="glass-btn glass-btn-secondary" style="gap: 8px; padding: 12px 28px; font-size: 14px; font-weight: 700; border-radius: 50px; box-shadow: 0 4px 16px rgba(107,143,216,0.18);">
                        <span style="font-size: 20px; line-height:1;">+</span>
                        <span>Add Page</span>
                    </button>
                </div>
            </div>
        `;
    },

    bindEditorEvents(container) {
        const titleInput = container.querySelector('#note-title-input');
        const ruleSelect = container.querySelector('#note-ruletype-select');
        const contentTextarea = container.querySelector('#note-content-textarea');
        const paperSheet = container.querySelector('#paper-sheet-element');

        // Full Screen Writing Mode Toggle
        const fullscreenBtn = container.querySelector('#btn-fullscreen-note');
        const editorContainer = container.querySelector('#note-editor-container');
        if (fullscreenBtn && editorContainer) {
            fullscreenBtn.addEventListener('click', () => {
                const isFullscreen = editorContainer.classList.toggle('fullscreen-note-mode');
                fullscreenBtn.classList.toggle('glass-btn-primary', isFullscreen);
                const label = fullscreenBtn.querySelector('#fullscreen-btn-label');
                if (label) label.textContent = isFullscreen ? 'Exit Full Screen' : 'Full Screen';
                App.toast(isFullscreen ? 'Entered Full Screen Writing Mode 📺' : 'Exited Full Screen Mode');

                setTimeout(() => {
                    if (this.initCanvasSizeRef) {
                        this.initCanvasSizeRef();
                    }
                }, 100);
            });
        }

        // Rule Type change updates CSS background instantly
        ruleSelect.addEventListener('change', (e) => {
            const newRule = e.target.value;
            paperSheet.className = `paper-sheet ${newRule}`;
            this.triggerAutoSave(container);
        });

        titleInput.addEventListener('input', () => this.triggerAutoSave(container));
        contentTextarea.addEventListener('input', () => this.triggerAutoSave(container));

        // Initialize Canvas Stylus Engine
        this.initStylusEngine(container);

        // Share note button
        container.querySelector('#btn-share-note').addEventListener('click', () => {
            this.showShareNoteModal(this.currentNote.id);
        });

        // Delete note button
        container.querySelector('#btn-delete-note').addEventListener('click', async () => {
            if (confirm('Delete this page permanently?')) {
                await API.deleteNote(this.currentNote.id);
                this.currentNote = null;
                App.showToast('Note deleted.');
                this.renderNotebookDetail(container);
            }
        });

        // Add Page (expand canvas) button
        const addPageBtn = container.querySelector('#btn-add-page');
        if (addPageBtn) {
            addPageBtn.addEventListener('click', () => {
                const canvas = container.querySelector('#stylus-canvas');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const oldHeight = canvas.height;
                const expandBy = 1122; // A4-equivalent height

                // Snapshot existing content
                const snapshot = ctx.getImageData(0, 0, canvas.width, oldHeight);

                // Expand canvas (this wipes it)
                canvas.height = oldHeight + expandBy;

                // Restore content at top
                ctx.putImageData(snapshot, 0, 0);

                // Also expand the textarea so both scroll together
                const textarea = container.querySelector('#note-content-textarea');
                if (textarea) {
                    const currentPx = parseInt(window.getComputedStyle(textarea).height) || oldHeight;
                    textarea.style.minHeight = (currentPx + expandBy) + 'px';
                }

                // Also expand the paper sheet container
                paperSheet.style.minHeight = canvas.height + 'px';

                // Sync history with the new larger canvas
                this.saveCanvasHistory(canvas);
                this.triggerAutoSave(container);

                // Smooth-scroll to the new blank area
                canvas.scrollIntoView({ behavior: 'smooth', block: 'end' });

                App.toast('New page added! ✨', 'success');
            });
        }
    },

    initStylusEngine(container) {
        const canvas = container.querySelector('#stylus-canvas');
        const textarea = container.querySelector('#note-content-textarea');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Canvas must be sized AFTER the DOM paints so getBoundingClientRect is accurate
        const initCanvasSize = () => {
            const paperSheet = canvas.parentElement;
            if (!paperSheet) return;
            const rect = paperSheet.getBoundingClientRect();
            const textarea = container.querySelector('#note-content-textarea');

            if (rect.width > 0) {
                let savedHeight = 520;

                // Load saved drawing & height after sizing
                if (this.currentNote && this.currentNote.content && this.currentNote.content.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(this.currentNote.content);
                        if (parsed.canvasHeight && parsed.canvasHeight > savedHeight) {
                            savedHeight = parsed.canvasHeight;
                        }

                        if (parsed.canvasData) {
                            const img = new Image();
                            img.onload = () => {
                                const finalHeight = Math.max(rect.height, savedHeight, img.naturalHeight || 520);
                                canvas.width = rect.width;
                                canvas.height = finalHeight;
                                paperSheet.style.minHeight = finalHeight + 'px';
                                if (textarea) textarea.style.minHeight = finalHeight + 'px';

                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0); // 1:1 ratio painting prevents compression and overlapping
                                this.saveCanvasHistory(canvas);
                            };
                            img.src = parsed.canvasData;
                            return; // don't call saveHistory twice
                        }
                    } catch (e) {}
                }

                const finalHeight = Math.max(rect.height, savedHeight);
                canvas.width = rect.width;
                canvas.height = finalHeight;
                paperSheet.style.minHeight = finalHeight + 'px';
                if (textarea) textarea.style.minHeight = finalHeight + 'px';
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.saveCanvasHistory(canvas);
            }
        };

        this.initCanvasSizeRef = initCanvasSize;

        // Use requestAnimationFrame to ensure layout is complete before measuring
        requestAnimationFrame(() => setTimeout(initCanvasSize, 0));

        // State variables — Default to select tool so text can be selected fast
        let isDrawing = false;
        let tool = 'select';
        let color = '#1A365D';
        let width = 3;
        let lastX = 0, lastY = 0;
        let startX = 0, startY = 0;
        let snapshotBeforeShape = null; // for shape preview

        // Tool button click
        container.querySelectorAll('.stylus-tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.stylus-tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                tool = btn.dataset.tool;

                if (tool === 'select' || tool === 'text') {
                    // Select Text & Keyboard mode: enable textarea text selection and editing
                    canvas.classList.add('pointer-events-none');
                    if (textarea) {
                        textarea.style.pointerEvents = 'auto';
                        textarea.focus();
                    }
                } else {
                    canvas.classList.remove('pointer-events-none');
                    if (textarea) {
                        textarea.style.pointerEvents = 'none';
                    }
                }

                if (tool === 'highlighter') { color = 'rgba(255,235,59,0.5)'; width = 14; }
                else if (tool === 'eraser') { /* keep color */ }
                else if (['fill', 'line', 'rect', 'circle', 'arrow'].includes(tool)) { canvas.style.cursor = 'crosshair'; }
                else { canvas.style.cursor = 'default'; }
            });
        });

        // Color swatches
        container.querySelectorAll('.color-swatch').forEach(sw => {
            sw.addEventListener('click', () => {
                container.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                sw.classList.add('active');
                color = sw.dataset.color;
                if (tool === 'text' || tool === 'eraser') {
                    tool = 'pen';
                    container.querySelectorAll('.stylus-tool-btn[data-tool]').forEach(b => b.classList.toggle('active', b.dataset.tool === 'pen'));
                    canvas.classList.remove('pointer-events-none');
                }
            });
        });

        // Stroke size buttons
        container.querySelectorAll('.stroke-size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.stroke-size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                width = parseFloat(btn.dataset.size);
            });
        });

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure > 0 ? e.pressure : 0.5 };
        };

        // ─── Fill tool (flood fill) ────────────────────────────────────────────
        const hexToRgb = (c) => {
            if (c.startsWith('rgba')) {
                const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                return m ? [+m[1],+m[2],+m[3],255] : [0,0,0,255];
            }
            const hex = c.replace('#','');
            const num = parseInt(hex, 16);
            return [(num>>16)&255,(num>>8)&255,num&255,255];
        };
        const floodFill = (x, y, fillColor) => {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const fillRgb = hexToRgb(fillColor);
            const idx = (Math.round(y) * canvas.width + Math.round(x)) * 4;
            const target = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
            if (target.every((v,i) => v === fillRgb[i])) return;
            const stack = [[Math.round(x), Math.round(y)]];
            const match = (i) => data[i]===target[0] && data[i+1]===target[1] && data[i+2]===target[2] && data[i+3]===target[3];
            const set = (i) => { data[i]=fillRgb[0]; data[i+1]=fillRgb[1]; data[i+2]=fillRgb[2]; data[i+3]=fillRgb[3]; };
            while (stack.length) {
                const [fx, fy] = stack.pop();
                if (fx<0||fy<0||fx>=canvas.width||fy>=canvas.height) continue;
                const i = (fy*canvas.width+fx)*4;
                if (!match(i)) continue;
                set(i);
                stack.push([fx+1,fy],[fx-1,fy],[fx,fy+1],[fx,fy-1]);
            }
            ctx.putImageData(imgData, 0, 0);
        };

        // ─── Draw shape preview ─────────────────────────────────────────────────
        const drawShapePreview = (pos) => {
            ctx.putImageData(snapshotBeforeShape, 0, 0);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.globalCompositeOperation = 'source-over';

            if (tool === 'line') {
                ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
            } else if (tool === 'rect') {
                ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
            } else if (tool === 'circle') {
                const rx = Math.abs(pos.x - startX) / 2, ry = Math.abs(pos.y - startY) / 2;
                ctx.ellipse(startX + (pos.x-startX)/2, startY + (pos.y-startY)/2, rx, ry, 0, 0, Math.PI*2);
                ctx.stroke();
            } else if (tool === 'arrow') {
                const dx = pos.x - startX, dy = pos.y - startY;
                const angle = Math.atan2(dy, dx);
                const headLen = Math.max(12, width * 4);
                ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen*Math.cos(angle-Math.PI/6), pos.y - headLen*Math.sin(angle-Math.PI/6));
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen*Math.cos(angle+Math.PI/6), pos.y - headLen*Math.sin(angle+Math.PI/6));
                ctx.stroke();
            } else if (tool === 'select') {
                ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                ctx.setLineDash([]);
            }
        };

        // ─── Text on canvas tool ────────────────────────────────────────────────
        const placeTextInput = (x, y) => {
            if (textInput) textInput.remove();
            textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.placeholder = 'Type text, press Enter';
            textInput.style.cssText = `
                position: absolute;
                left: ${x}px; top: ${y - 20}px;
                font-size: ${Math.max(14, width * 3)}px;
                color: ${color};
                background: rgba(255,255,255,0.85);
                border: 2px dashed ${color};
                border-radius: 4px;
                padding: 4px 8px;
                min-width: 120px;
                z-index: 100;
                outline: none;
            `;
            const canvasParent = canvas.parentElement;
            canvasParent.style.position = 'relative';
            canvasParent.appendChild(textInput);
            textInput.focus();

            textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const text = textInput.value.trim();
                    if (text) {
                        ctx.font = `${Math.max(16, width * 3)}px "Inter", sans-serif`;
                        ctx.fillStyle = color;
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillText(text, x, y);
                    }
                    textInput.remove(); textInput = null;
                    this.saveCanvasHistory(canvas);
                    this.triggerAutoSave(container);
                } else if (e.key === 'Escape') {
                    textInput.remove(); textInput = null;
                }
            });
        };

        // ─── Pointer Events ─────────────────────────────────────────────────────
        canvas.addEventListener('pointerdown', (e) => {
            if (tool === 'text') return;
            const pos = getPos(e);

            if (tool === 'fill') {
                floodFill(pos.x, pos.y, color);
                this.saveCanvasHistory(canvas);
                this.triggerAutoSave(container);
                return;
            }

            if (tool === 'text_canvas') {
                placeTextInput(pos.x, pos.y);
                return;
            }

            if (tool === 'select') {
                if (floatingSelection) {
                    const { x, y, w, h } = floatingSelection;
                    if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
                        // Clicked inside active selection -> start dragging it
                        isDraggingSelection = true;
                        dragOffsetX = pos.x - x;
                        dragOffsetY = pos.y - y;
                        return;
                    } else {
                        // Clicked outside -> commit current selection
                        ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                        floatingSelection = null;
                        this.saveCanvasHistory(canvas);
                        this.triggerAutoSave(container);
                    }
                }
            }

            isDrawing = true;
            startX = pos.x; startY = pos.y;
            lastX = pos.x; lastY = pos.y;

            if (['line','rect','circle','arrow','select'].includes(tool)) {
                snapshotBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
            } else {
                ctx.beginPath(); ctx.moveTo(lastX, lastY);
            }
        });

        canvas.addEventListener('pointermove', (e) => {
            if (tool === 'text' || tool === 'fill' || tool === 'text_canvas') return;
            e.preventDefault();
            const pos = getPos(e);

            if (tool === 'select' && isDraggingSelection && floatingSelection) {
                // Restore snapshot (hole where selection was cut)
                ctx.putImageData(snapshotBeforeShape, 0, 0);
                floatingSelection.x = pos.x - dragOffsetX;
                floatingSelection.y = pos.y - dragOffsetY;
                
                // Draw selection image
                ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                
                // Draw dashed border
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)';
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = 1;
                ctx.strokeRect(floatingSelection.x, floatingSelection.y, floatingSelection.w, floatingSelection.h);
                ctx.setLineDash([]);
                return;
            }

            if (!isDrawing) return;

            if (['line','rect','circle','arrow','select'].includes(tool)) {
                drawShapePreview(pos);
                return;
            }

            // Freehand draw
            ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(pos.x, pos.y);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = tool === 'eraser' ? width * 4 : (pos.pressure ? width * pos.pressure * 1.6 : width);
            ctx.stroke();
            lastX = pos.x; lastY = pos.y;
        });

        canvas.addEventListener('pointerup', (e) => {
            if (tool === 'select' && isDraggingSelection) {
                isDraggingSelection = false;
                this.triggerAutoSave(container);
                return; // Keep it floating
            }

            if (!isDrawing) return;

            if (['line','rect','circle','arrow'].includes(tool)) {
                drawShapePreview(getPos(e));
            } else if (tool === 'select') {
                const pos = getPos(e);
                const rx = Math.min(startX, pos.x);
                const ry = Math.min(startY, pos.y);
                const rw = Math.abs(pos.x - startX);
                const rh = Math.abs(pos.y - startY);

                if (rw > 5 && rh > 5) { // Minimum selection size
                    // Restore snapshot to remove the dashed preview lines
                    ctx.putImageData(snapshotBeforeShape, 0, 0);
                    
                    // Capture image data
                    const imgData = ctx.getImageData(rx, ry, rw, rh);
                    
                    // Clear the selected area (punch hole)
                    ctx.clearRect(rx, ry, rw, rh);
                    
                    // Save new baseline with hole
                    snapshotBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    floatingSelection = { x: rx, y: ry, w: rw, h: rh, imgData };
                    
                    // Draw dashed border around the new floating selection
                    ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)';
                    ctx.setLineDash([5, 5]);
                    ctx.lineWidth = 1;
                    ctx.strokeRect(floatingSelection.x, floatingSelection.y, floatingSelection.w, floatingSelection.h);
                    ctx.setLineDash([]);
                }
            }

            isDrawing = false;
            
            // Only save history if we are not actively holding a floating selection 
            // (we save history when it's committed)
            if (tool !== 'select') {
                this.saveCanvasHistory(canvas);
                this.triggerAutoSave(container);
            }
        });

        canvas.addEventListener('pointerleave', () => {
            if (isDrawing) {
                isDrawing = false;
                this.saveCanvasHistory(canvas);
                this.triggerAutoSave(container);
            }
        });

        // Action buttons
        const undoBtn = container.querySelector('#btn-undo-stroke');
        const redoBtn = container.querySelector('#btn-redo-stroke');
        const clearBtn = container.querySelector('#btn-clear-canvas');
        if (undoBtn) undoBtn.addEventListener('click', () => this.undoCanvas(canvas, container));
        if (redoBtn) redoBtn.addEventListener('click', () => this.redoCanvas(canvas, container));
        if (clearBtn) clearBtn.addEventListener('click', () => {
            if (confirm('Clear all drawings on this page?')) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                this.saveCanvasHistory(canvas);
                this.triggerAutoSave(container);
            }
        });
    },

    saveCanvasHistory(canvas) {
        if (!this.stylusHistory) this.stylusHistory = [];
        if (this.stylusHistoryIndex === undefined) this.stylusHistoryIndex = -1;

        if (this.stylusHistoryIndex < this.stylusHistory.length - 1) {
            this.stylusHistory = this.stylusHistory.slice(0, this.stylusHistoryIndex + 1);
        }

        const ctx = canvas.getContext('2d');
        if (canvas.width > 0 && canvas.height > 0) {
            this.stylusHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            this.stylusHistoryIndex = this.stylusHistory.length - 1;
        }
    },

    undoCanvas(canvas, container) {
        if (this.stylusHistory && this.stylusHistoryIndex > 0) {
            this.stylusHistoryIndex--;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(this.stylusHistory[this.stylusHistoryIndex], 0, 0);
            this.triggerAutoSave(container);
        }
    },

    redoCanvas(canvas, container) {
        if (this.stylusHistory && this.stylusHistoryIndex < this.stylusHistory.length - 1) {
            this.stylusHistoryIndex++;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(this.stylusHistory[this.stylusHistoryIndex], 0, 0);
            this.triggerAutoSave(container);
        }
    },

    async flushPendingAutoSave(container) {
        if (this.autoSaveTimer && this.currentNote) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
            try {
                const titleInput = container.querySelector('#note-title-input');
                const ruleSelect = container.querySelector('#note-ruletype-select');
                const textInput = container.querySelector('#note-content-textarea');
                const canvas = container.querySelector('#stylus-canvas');

                if (titleInput && textInput && this.currentNote) {
                    const title = titleInput.value;
                    const rule_type = ruleSelect ? ruleSelect.value : 'ruled';
                    const textContent = textInput.value;
                    let canvasData = null;
                    if (canvas && canvas.width > 0 && canvas.height > 0) {
                        canvasData = canvas.toDataURL('image/png');
                    }
                    const contentData = JSON.stringify({
                        type: 'smartslate_note_v2',
                        canvasWidth: canvas ? canvas.width : null,
                        canvasHeight: canvas ? canvas.height : null,
                        canvasData,
                        text: textContent
                    });
                    await API.updateNote(this.currentNote.id, title, rule_type, contentData);
                    this.currentNote.content = contentData;
                }
            } catch (e) {}
        }
    },

    triggerAutoSave(container) {
        if (!this.currentNote) return;
        const noteIdToSave = this.currentNote.id;

        const saveStatus = container.querySelector('#auto-save-status');
        if (saveStatus) {
            saveStatus.textContent = 'Saving...';
            saveStatus.className = 'glass-badge glass-badge-warning';
        }

        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(async () => {
            try {
                const titleInput = container.querySelector('#note-title-input');
                const ruleSelect = container.querySelector('#note-ruletype-select');
                const textInput = container.querySelector('#note-content-textarea');
                const canvas = container.querySelector('#stylus-canvas');

                if (!titleInput || !textInput) return;

                const title = titleInput.value;
                const rule_type = ruleSelect ? ruleSelect.value : 'ruled';
                const textContent = textInput.value;

                let canvasData = null;
                if (canvas && canvas.width > 0 && canvas.height > 0) {
                    canvasData = canvas.toDataURL('image/png');
                }

                const contentData = JSON.stringify({
                    type: 'smartslate_note_v2',
                    canvasWidth: canvas ? canvas.width : null,
                    canvasHeight: canvas ? canvas.height : null,
                    canvasData,
                    text: textContent
                });

                await API.updateNote(noteIdToSave, title, rule_type, contentData);
                if (this.currentNote && this.currentNote.id === noteIdToSave) {
                    this.currentNote.title = title;
                    this.currentNote.rule_type = rule_type;
                    this.currentNote.content = contentData;
                }

                if (saveStatus) {
                    saveStatus.textContent = 'Saved ✓';
                    saveStatus.className = 'glass-badge glass-badge-success';
                }
            } catch (err) {
                if (saveStatus) {
                    saveStatus.textContent = 'Offline - Retrying';
                    saveStatus.className = 'glass-badge glass-badge-danger';
                }
            }
        }, 600);
    },

    // 8.2 Assignments Section
    // 8.2 Homework Tasks Section (Clean Summary Cards + Dedicated Notebook Workspace)
    async renderAssignments(container) {
        const res = await API.getAssignments();
        const assignments = res.assignments || [];

        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                <div>
                    <h3 style="font-size: 22px; font-weight: 800; color: var(--text-primary);">📝 Homework Tasks</h3>
                    <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">Click any task card to open the notebook workspace, write your notes, and submit to your teacher.</p>
                </div>
                <span class="glass-badge glass-badge-accent" style="font-size: 14px; font-weight: 700; padding: 6px 16px;">${assignments.length} Tasks Assigned</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 18px;">
                ${assignments.length === 0 ? '<div class="glass-card" style="text-align: center; padding: 48px; color: var(--text-muted);">🎉 All caught up! No pending homework tasks.</div>' : ''}
                ${assignments.map(a => {
                    const isSubmitted = a.submission_status === 'submitted' || a.submission_status === 'graded';
                    let submittedText = '';
                    try {
                        const parsed = JSON.parse(a.submission_content || '{}');
                        submittedText = parsed.text || a.submission_content || '';
                    } catch (e) {
                        submittedText = a.submission_content || '';
                    }

                    return `
                        <div class="glass-card homework-summary-card" style="padding: 24px; border-left: 6px solid ${isSubmitted ? 'var(--status-success)' : 'var(--accent-blue)'};">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
                                <div>
                                    <h4 style="font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">${a.title}</h4>
                                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                                        <span class="glass-badge glass-badge-accent">Due: ${new Date(a.due_at).toLocaleDateString()}</span>
                                        <span class="glass-badge" style="background: rgba(0,0,0,0.05);">Teacher: ${a.teacher_name || 'Prof. Sarah Lin'}</span>
                                    </div>
                                </div>
                                <span class="glass-badge ${isSubmitted ? 'glass-badge-success' : 'glass-badge-warning'}" style="font-size: 13px; font-weight: 700; padding: 6px 14px;">
                                    ${a.submission_status === 'graded' ? 'Graded ✓' : isSubmitted ? 'Submitted ✓' : '⏳ Pending'}
                                </span>
                            </div>

                            <p style="color: var(--text-secondary); font-size: 15px; margin-bottom: 18px; line-height: 1.5;">${a.description || 'No additional instructions provided.'}</p>

                            ${a.grade ? `<div style="padding: 10px 14px; background: rgba(82, 154, 114, 0.12); border-radius: var(--radius-sm); color: var(--status-success); font-weight: 700; margin-bottom: 16px; display: inline-block;">Grade & Remarks: ${a.grade}</div>` : ''}

                            ${isSubmitted && submittedText ? `
                                <details style="margin-bottom: 16px; background: rgba(0,0,0,0.02); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                                    <summary style="font-size: 13px; font-weight: 700; cursor: pointer; color: var(--accent-blue);">👁️ View Submitted Notes Response</summary>
                                    <p style="margin-top: 10px; font-size: 14px; color: var(--text-primary); white-space: pre-wrap;">${submittedText}</p>
                                </details>
                            ` : ''}

                            <div style="display: flex; gap: 12px;">
                                <button class="glass-btn ${isSubmitted ? 'glass-btn-secondary' : 'glass-btn-primary'} bouncy-btn btn-open-hw-workspace" data-id="${a.id}" style="padding: 12px 20px; font-weight: 700;">
                                    <img src="/assets/icons/icon-assignment.svg" style="width: 20px; height: 20px;" alt="Edit">
                                    <span>${isSubmitted ? '✏️ View & Edit Notebook Response' : '✏️ Open Notebook to Write & Submit'}</span>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.querySelectorAll('.btn-open-hw-workspace').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const assignId = e.currentTarget.dataset.id;
                const assignObj = assignments.find(a => a.id == assignId);
                this.showHomeworkWorkspaceModal(container, assignObj);
            });
        });
    },

    showHomeworkWorkspaceModal(container, assignment) {
        let existingText = '';
        if (assignment.submission_content) {
            try {
                const parsed = JSON.parse(assignment.submission_content);
                existingText = parsed.text || '';
            } catch (e) {
                existingText = assignment.submission_content;
            }
        }

        App.showModal(`
            <div class="modal-card" id="hw-workspace-modal-card" style="max-width: 900px; width: 95vw; max-height: 90vh; overflow-y: auto; transition: all 250ms ease;">
                <div class="modal-header">
                    <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
                        <img src="/assets/icons/icon-assignment.svg" style="width: 24px; height: 24px;" alt="HW">
                        <span>Notebook Workspace: ${assignment.title}</span>
                    </h3>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button id="btn-toggle-hw-fullscreen" class="glass-btn glass-btn-sm bouncy-btn" title="Toggle Full Screen Mode">
                            <span>🖥️ Full Screen</span>
                        </button>
                        <button class="modal-close" onclick="App.closeModal()">✕</button>
                    </div>
                </div>

                <div style="margin: 12px 0 20px; padding: 14px; background: var(--accent-light); border-radius: var(--radius-sm); border-left: 4px solid var(--accent-blue);">
                    <div style="font-size: 12px; font-weight: 800; color: var(--accent-blue); text-transform: uppercase; margin-bottom: 4px;">Teacher Instructions:</div>
                    <div style="font-size: 15px; color: var(--text-primary);">${assignment.description || 'Complete the assignment notes below.'}</div>
                </div>

                <!-- Full Stylus & Text Notebook Editor Surface -->
                <div style="width: 100%; flex: 1; display: flex; flex-direction: column;">
                    <div class="stylus-toolbar" style="flex-direction: column; gap: 8px; margin-bottom: 12px;">
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center; width: 100%;">
                            <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">TOOLS:</span>
                            <div class="stylus-tool-group">
                                <button class="stylus-tool-btn active assign-tool-btn" data-tool="pen" data-for="${assignment.id}" title="Pen">✏️ Pen</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="highlighter" data-for="${assignment.id}" title="Highlighter">🖊️ Highlight</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="eraser" data-for="${assignment.id}" title="Eraser">🧹 Eraser</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="select" data-for="${assignment.id}" title="Select">⬚ Select</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="fill" data-for="${assignment.id}" title="Fill">🪣 Fill</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="text_canvas" data-for="${assignment.id}" title="Text">🔤 Text</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="line" data-for="${assignment.id}" title="Line">╱ Line</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="rect" data-for="${assignment.id}" title="Rect">▭ Rect</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="circle" data-for="${assignment.id}" title="Circle">◯ Circle</button>
                                <button class="stylus-tool-btn assign-tool-btn" data-tool="arrow" data-for="${assignment.id}" title="Arrow">↗ Arrow</button>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center; width: 100%;">
                            <div class="stylus-tool-group">
                                <span style="font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">INK:</span>
                                <div class="color-swatch active assign-color" data-color="#1A365D" data-for="${assignment.id}" style="background: #1A365D;"></div>
                                <div class="color-swatch assign-color" data-color="#1A202C" data-for="${assignment.id}" style="background: #1A202C;"></div>
                                <div class="color-swatch assign-color" data-color="#E53E3E" data-for="${assignment.id}" style="background: #E53E3E;"></div>
                                <div class="color-swatch assign-color" data-color="#2F855A" data-for="${assignment.id}" style="background: #2F855A;"></div>
                                <div class="color-swatch assign-color" data-color="#3182CE" data-for="${assignment.id}" style="background: #3182CE;"></div>
                                <div class="color-swatch assign-color" data-color="rgba(255,235,59,0.5)" data-for="${assignment.id}" style="background: #ECC94B;"></div>
                            </div>
                            <div class="stylus-tool-group">
                                <button class="stylus-tool-btn assign-undo-btn" data-for="${assignment.id}">↩️ Undo</button>
                                <button class="stylus-tool-btn assign-redo-btn" data-for="${assignment.id}">↪️ Redo</button>
                                <button class="stylus-tool-btn assign-clear-btn" data-for="${assignment.id}" style="color: var(--status-danger);">🧼 Clear</button>
                            </div>
                        </div>
                    </div>

                    <div class="paper-sheet ruled" style="position: relative; min-height: 380px; flex: 1; margin-bottom: 20px;">
                        <textarea id="assign-text-${assignment.id}" class="note-editor-textarea" placeholder="Type your homework response..." style="min-height: 360px;">${existingText}</textarea>
                        <canvas id="assign-canvas-${assignment.id}" class="stylus-canvas"></canvas>
                    </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="glass-btn glass-btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button id="btn-submit-hw-modal" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 14px 28px; font-weight: 800;">
                        🚀 Submit Homework to Teacher
                    </button>
                </div>
            </div>
        `);

        const modal = document.getElementById('modal-container');
        this.initAssignmentCanvas(modal, assignment.id, assignment.submission_content);

        // Full Screen Mode Toggle Button Listener
        const fullscreenBtn = modal.querySelector('#btn-toggle-hw-fullscreen');
        const modalCard = modal.querySelector('#hw-workspace-modal-card');
        if (fullscreenBtn && modalCard) {
            fullscreenBtn.addEventListener('click', () => {
                const isFS = modalCard.classList.toggle('fullscreen-hw-mode');
                if (isFS) {
                    modalCard.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; border-radius: 0; z-index: 99999; margin: 0; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; background: var(--paper-bg-primary);';
                    fullscreenBtn.innerHTML = '<span>🗗 Exit Full Screen</span>';
                    fullscreenBtn.classList.add('glass-btn-primary');
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(() => {});
                    }
                } else {
                    modalCard.style.cssText = 'max-width: 900px; width: 95vw; max-height: 90vh; overflow-y: auto; transition: all 250ms ease;';
                    fullscreenBtn.innerHTML = '<span>🖥️ Full Screen</span>';
                    fullscreenBtn.classList.remove('glass-btn-primary');
                    if (document.exitFullscreen && document.fullscreenElement) {
                        document.exitFullscreen().catch(() => {});
                    }
                }
            });
        }

        modal.querySelector('#btn-submit-hw-modal').addEventListener('click', async () => {
            const textContent = modal.querySelector(`#assign-text-${assignment.id}`)?.value || '';
            const canvas = modal.querySelector(`#assign-canvas-${assignment.id}`);
            let canvasData = null;
            if (canvas && canvas.width > 0 && canvas.height > 0) {
                canvasData = canvas.toDataURL('image/png');
            }
            const contentData = JSON.stringify({
                type: 'smartslate_note_v2',
                canvasHeight: canvas ? canvas.height : 380,
                canvasData,
                text: textContent
            });

            try {
                await API.submitAssignment(assignment.id, contentData);
                App.closeModal();
                App.toast('Homework submitted successfully to your teacher! 🎉', 'success');
                this.renderAssignments(container);
            } catch (err) {
                App.toast(err.message || 'Error submitting homework', 'danger');
            }
        });
    },

    initAssignmentCanvas(container, assignId, savedContent) {
        const canvas = container.querySelector(`#assign-canvas-${assignId}`);
        const textarea = container.querySelector(`#assign-text-${assignId}`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // We need local history for assignments
        let history = [];
        let historyIndex = -1;

        const saveHistory = () => {
            if (historyIndex < history.length - 1) {
                history = history.slice(0, historyIndex + 1);
            }
            if (canvas.width > 0 && canvas.height > 0) {
                history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                historyIndex = history.length - 1;
            }
        };

        const initCanvasSize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            if (savedContent) {
                try {
                    const p = JSON.parse(savedContent);
                    if (p.canvasData) {
                        const img = new Image();
                        img.onload = () => { ctx.drawImage(img, 0, 0); saveHistory(); };
                        img.src = p.canvasData;
                        return; // return early so we don't save blank history immediately
                    }
                } catch (e) {}
            }
            saveHistory();
        };

        requestAnimationFrame(() => setTimeout(initCanvasSize, 0));

        let isDrawing = false, tool = 'pen', color = '#1A365D', width = 3;
        let lastX = 0, lastY = 0, startX = 0, startY = 0;
        let snapshotBeforeShape = null;
        let floatingSelection = null;
        let isDraggingSelection = false;
        let dragOffsetX = 0, dragOffsetY = 0;
        let textInput = null;

        // Bind tool buttons scoped to this assignment
        container.querySelectorAll(`.assign-tool-btn[data-for="${assignId}"]`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (floatingSelection) {
                    ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                    floatingSelection = null;
                    saveHistory();
                }

                container.querySelectorAll(`.assign-tool-btn[data-for="${assignId}"]`).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                tool = btn.dataset.tool;
                if (tool === 'text') { canvas.classList.add('pointer-events-none'); textarea.focus(); }
                else { canvas.classList.remove('pointer-events-none'); }

                if (tool === 'highlighter') { color = 'rgba(255,235,59,0.5)'; width = 14; }
                else if (tool === 'eraser') { }
                else if (tool === 'fill' || ['line','rect','circle','arrow'].includes(tool)) { canvas.style.cursor = 'crosshair'; }
                else { canvas.style.cursor = 'default'; }
            });
        });

        container.querySelectorAll(`.assign-color[data-for="${assignId}"]`).forEach(sw => {
            sw.addEventListener('click', (e) => {
                container.querySelectorAll(`.assign-color[data-for="${assignId}"]`).forEach(s => s.classList.remove('active'));
                sw.classList.add('active');
                color = sw.dataset.color;
                if (tool === 'text' || tool === 'eraser') {
                    tool = 'pen';
                    container.querySelectorAll(`.assign-tool-btn[data-for="${assignId}"]`).forEach(b => b.classList.toggle('active', b.dataset.tool === 'pen'));
                    canvas.classList.remove('pointer-events-none');
                }
            });
        });

        container.querySelectorAll(`.stroke-size-btn[data-for="${assignId}"]`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll(`.stroke-size-btn[data-for="${assignId}"]`).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                width = parseFloat(btn.dataset.size);
            });
        });

        const undoBtn = container.querySelector(`.assign-undo-btn[data-for="${assignId}"]`);
        const redoBtn = container.querySelector(`.assign-redo-btn[data-for="${assignId}"]`);
        const clearBtn = container.querySelector(`.assign-clear-btn[data-for="${assignId}"]`);

        if (undoBtn) undoBtn.addEventListener('click', () => {
            if (historyIndex > 0) {
                historyIndex--;
                ctx.putImageData(history[historyIndex], 0, 0);
            }
        });
        if (redoBtn) redoBtn.addEventListener('click', () => {
            if (historyIndex < history.length - 1) {
                historyIndex++;
                ctx.putImageData(history[historyIndex], 0, 0);
            }
        });
        if (clearBtn) clearBtn.addEventListener('click', () => { 
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
            saveHistory(); 
        });

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top, pressure: e.pressure > 0 ? e.pressure : 0.5 };
        };

        const hexToRgb = (c) => {
            if (c.startsWith('rgba')) {
                const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                return m ? [+m[1],+m[2],+m[3],255] : [0,0,0,255];
            }
            const hex = c.replace('#','');
            const num = parseInt(hex, 16);
            return [(num>>16)&255,(num>>8)&255,num&255,255];
        };

        const floodFill = (x, y, fillColor) => {
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const fillRgb = hexToRgb(fillColor);
            const idx = (Math.round(y) * canvas.width + Math.round(x)) * 4;
            const target = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
            if (target.every((v,i) => v === fillRgb[i])) return;
            const stack = [[Math.round(x), Math.round(y)]];
            const match = (i) => data[i]===target[0] && data[i+1]===target[1] && data[i+2]===target[2] && data[i+3]===target[3];
            const set = (i) => { data[i]=fillRgb[0]; data[i+1]=fillRgb[1]; data[i+2]=fillRgb[2]; data[i+3]=fillRgb[3]; };
            while (stack.length) {
                const [fx, fy] = stack.pop();
                if (fx<0||fy<0||fx>=canvas.width||fy>=canvas.height) continue;
                const i = (fy*canvas.width+fx)*4;
                if (!match(i)) continue;
                set(i);
                stack.push([fx+1,fy],[fx-1,fy],[fx,fy+1],[fx,fy-1]);
            }
            ctx.putImageData(imgData, 0, 0);
        };

        const drawShapePreview = (pos) => {
            ctx.putImageData(snapshotBeforeShape, 0, 0);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.globalCompositeOperation = 'source-over';

            if (tool === 'line') {
                ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
            } else if (tool === 'rect') {
                ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
            } else if (tool === 'circle') {
                const rx = Math.abs(pos.x - startX) / 2, ry = Math.abs(pos.y - startY) / 2;
                ctx.ellipse(startX + (pos.x-startX)/2, startY + (pos.y-startY)/2, rx, ry, 0, 0, Math.PI*2);
                ctx.stroke();
            } else if (tool === 'arrow') {
                const dx = pos.x - startX, dy = pos.y - startY;
                const angle = Math.atan2(dy, dx);
                const headLen = Math.max(12, width * 4);
                ctx.moveTo(startX, startY); ctx.lineTo(pos.x, pos.y); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen*Math.cos(angle-Math.PI/6), pos.y - headLen*Math.sin(angle-Math.PI/6));
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x - headLen*Math.cos(angle+Math.PI/6), pos.y - headLen*Math.sin(angle+Math.PI/6));
                ctx.stroke();
            } else if (tool === 'select') {
                ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)';
                ctx.lineWidth = 1;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                ctx.setLineDash([]);
            }
        };

        const placeTextInput = (x, y) => {
            if (textInput) textInput.remove();
            textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.placeholder = 'Type text, press Enter';
            textInput.style.cssText = `
                position: absolute; left: ${x}px; top: ${y - 20}px;
                font-size: ${Math.max(14, width * 3)}px; color: ${color};
                background: rgba(255,255,255,0.85); border: 2px dashed ${color};
                border-radius: 4px; padding: 4px 8px; min-width: 120px; z-index: 100; outline: none;
            `;
            const canvasParent = canvas.parentElement;
            canvasParent.style.position = 'relative';
            canvasParent.appendChild(textInput);
            textInput.focus();

            textInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const text = textInput.value.trim();
                    if (text) {
                        ctx.font = `${Math.max(16, width * 3)}px "Inter", sans-serif`;
                        ctx.fillStyle = color;
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.fillText(text, x, y);
                    }
                    textInput.remove(); textInput = null;
                    saveHistory();
                } else if (e.key === 'Escape') {
                    textInput.remove(); textInput = null;
                }
            });
        };

        canvas.addEventListener('pointerdown', (e) => {
            if (tool === 'text') return;
            const pos = getPos(e);
            
            if (tool === 'fill') { floodFill(pos.x, pos.y, color); saveHistory(); return; }
            if (tool === 'text_canvas') { placeTextInput(pos.x, pos.y); return; }

            if (tool === 'select') {
                if (floatingSelection) {
                    const { x, y, w, h } = floatingSelection;
                    if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
                        isDraggingSelection = true; dragOffsetX = pos.x - x; dragOffsetY = pos.y - y;
                        return;
                    } else {
                        ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                        floatingSelection = null;
                        saveHistory();
                    }
                }
            }

            isDrawing = true; startX = pos.x; startY = pos.y; lastX = pos.x; lastY = pos.y;
            if (['line','rect','circle','arrow','select'].includes(tool)) {
                snapshotBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
            } else {
                ctx.beginPath(); ctx.moveTo(lastX, lastY);
            }
        });

        canvas.addEventListener('pointermove', (e) => {
            if (tool === 'text' || tool === 'fill' || tool === 'text_canvas') return;
            e.preventDefault();
            const pos = getPos(e);

            if (tool === 'select' && isDraggingSelection && floatingSelection) {
                ctx.putImageData(snapshotBeforeShape, 0, 0);
                floatingSelection.x = pos.x - dragOffsetX;
                floatingSelection.y = pos.y - dragOffsetY;
                ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)';
                ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
                ctx.strokeRect(floatingSelection.x, floatingSelection.y, floatingSelection.w, floatingSelection.h);
                ctx.setLineDash([]);
                return;
            }

            if (!isDrawing) return;
            if (['line','rect','circle','arrow','select'].includes(tool)) { drawShapePreview(pos); return; }

            ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(pos.x, pos.y);
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = tool === 'eraser' ? width * 4 : (pos.pressure ? width * pos.pressure * 1.6 : width);
            ctx.stroke();
            lastX = pos.x; lastY = pos.y;
        });

        canvas.addEventListener('pointerup', (e) => {
            if (tool === 'select' && isDraggingSelection) { isDraggingSelection = false; return; }
            if (!isDrawing) return;

            if (['line','rect','circle','arrow'].includes(tool)) {
                drawShapePreview(getPos(e));
            } else if (tool === 'select') {
                const pos = getPos(e);
                const rx = Math.min(startX, pos.x), ry = Math.min(startY, pos.y);
                const rw = Math.abs(pos.x - startX), rh = Math.abs(pos.y - startY);
                if (rw > 5 && rh > 5) {
                    ctx.putImageData(snapshotBeforeShape, 0, 0);
                    const imgData = ctx.getImageData(rx, ry, rw, rh);
                    ctx.clearRect(rx, ry, rw, rh);
                    snapshotBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    floatingSelection = { x: rx, y: ry, w: rw, h: rh, imgData };
                    ctx.putImageData(floatingSelection.imgData, floatingSelection.x, floatingSelection.y);
                    ctx.beginPath(); ctx.strokeStyle = 'rgba(107, 143, 216, 0.8)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
                    ctx.strokeRect(floatingSelection.x, floatingSelection.y, floatingSelection.w, floatingSelection.h);
                    ctx.setLineDash([]);
                }
            }
            isDrawing = false;
            if (tool !== 'select') saveHistory();
        });

        canvas.addEventListener('pointerleave', () => {
            if (isDrawing) { isDrawing = false; if (tool !== 'select') saveHistory(); }
        });
    },

    // 8.3 Class Real-time Socket.IO Chat
    async renderChat(container) {
        const groupsRes = await API.getChatGroups();
        const groups = groupsRes.groups || [];
        const activeGroup = groups[0] || { id: 1, name: 'Grade 5 Alpha General' };

        const msgRes = await API.getChatMessages(activeGroup.id);
        const messages = msgRes.messages || [];

        container.innerHTML = `
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div style="font-weight: 700; margin-bottom: 12px; color: var(--text-secondary); font-size: 13px;">GROUPS & CHATS</div>
                    ${groups.map(g => `
                        <div class="chat-contact-item active" style="font-weight: 600;">
                            💬 ${g.name}
                        </div>
                    `).join('')}
                </div>

                <div class="chat-main">
                    <div class="chat-header">💬 ${activeGroup.name}</div>
                    <div id="chat-messages-container" class="chat-messages-list">
                        ${messages.map(m => `
                            <div class="chat-bubble ${m.sender_id == App.currentUser.id ? 'mine' : 'other'}">
                                <div style="font-size: 11px; font-weight: 700; opacity: 0.8; margin-bottom: 2px;">${m.sender_name} (${m.sender_role})</div>
                                <div>${m.content}</div>
                            </div>
                        `).join('')}
                    </div>
                    <form id="chat-send-form" class="chat-input-bar">
                        <input type="text" id="chat-input-text" class="glass-input" placeholder="Type a message to your class..." required autocomplete="off">
                        <button type="submit" class="glass-btn glass-btn-primary">Send</button>
                    </form>
                </div>
            </div>
        `;

        const msgContainer = container.querySelector('#chat-messages-container');
        msgContainer.scrollTop = msgContainer.scrollHeight;

        // Join Socket Room
        SocketManager.joinGroup(activeGroup.id);
        SocketManager.on('message', (msg) => {
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${msg.sender_id == App.currentUser.id ? 'mine' : 'other'}`;
            bubble.innerHTML = `
                <div style="font-size: 11px; font-weight: 700; opacity: 0.8; margin-bottom: 2px;">${msg.sender_name} (${msg.sender_role})</div>
                <div>${msg.content}</div>
            `;
            msgContainer.appendChild(bubble);
            msgContainer.scrollTop = msgContainer.scrollHeight;
        });

        container.querySelector('#chat-send-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = container.querySelector('#chat-input-text');
            const text = input.value;
            if (!text.trim()) return;

            try {
                await SocketManager.sendGroupMessage(activeGroup.id, text.trim());
                input.value = '';
            } catch (err) {
                App.showToast('Failed to send message: ' + err.message, 'danger');
            }
        });
    },

    // 8.4 Time-Boxed Exam Taking UI
    async renderExams(container) {
        const res = await API.getExams();
        const exams = res.exams || [];
        const now = new Date();

        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Exams & Strict Assessments</h3>
                <p style="color: var(--text-secondary); font-size: 14px;">Time-limited strict exams with live countdown timer, start/end access windows, and full-screen anti-cheat protection</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                ${exams.length === 0 ? '<div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 40px;">No exams scheduled.</div>' : ''}
                ${exams.map(e => {
                    const isStarted = !e.start_time || now >= new Date(e.start_time);
                    const isEnded = e.end_time && now > new Date(e.end_time);
                    let statusBadge = '';
                    let canStart = false;

                    if (e.result_id) {
                        statusBadge = `<div style="padding: 10px; background: rgba(82, 154, 114, 0.12); border-radius: var(--radius-sm); color: var(--status-success); font-weight: 700; text-align: center;">Completed: ${e.score} / ${e.total_points} (${Math.round((e.score/e.total_points)*100)}%)</div>`;
                    } else if (isEnded) {
                        statusBadge = `<div style="padding: 10px; background: rgba(231, 76, 60, 0.12); border-radius: var(--radius-sm); color: var(--status-danger); font-weight: 700; text-align: center;">Exam Closed (Ended at ${new Date(e.end_time).toLocaleTimeString()})</div>`;
                    } else if (!isStarted) {
                        statusBadge = `<div style="padding: 10px; background: rgba(243, 156, 18, 0.12); border-radius: var(--radius-sm); color: var(--status-warning); font-weight: 700; text-align: center;">Upcoming (Opens at ${new Date(e.start_time).toLocaleString()})</div>`;
                    } else {
                        canStart = true;
                    }

                    return `
                        <div class="glass-card bouncy-btn" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid var(--accent-coral);">
                            <div>
                                <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                                    <span class="glass-badge glass-badge-accent" style="display: inline-flex; align-items: center; gap: 4px;">
                                        <img src="/assets/icons/icon-timer.svg" style="width: 14px; height: 14px;" alt="Timer"> ${e.duration_minutes} Mins
                                    </span>
                                    <span class="glass-badge glass-badge-warning" style="display: inline-flex; align-items: center; gap: 4px;">
                                        <img src="/assets/icons/icon-strict-mode.svg" style="width: 14px; height: 14px;" alt="Strict"> Strict Fullscreen
                                    </span>
                                </div>
                                <h4 style="font-size: 18px; font-weight: 700; margin-top: 4px;">${e.title}</h4>
                                ${e.start_time ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Window: ${new Date(e.start_time).toLocaleDateString()} ${new Date(e.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – ${new Date(e.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>` : ''}
                            </div>
                            <div style="margin-top: 20px;">
                                ${canStart ? `
                                    <button class="glass-btn glass-btn-primary btn-take-exam bouncy-btn" data-id="${e.id}" style="width: 100%;">Start Exam Now</button>
                                ` : statusBadge}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.querySelectorAll('.btn-take-exam').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                // Request browser full screen
                try {
                    if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                    }
                } catch (err) {}
                this.startExamSession(container, id);
            });
        });
    },

    async startExamSession(container, examId) {
        const res = await API.getExamDetail(examId);
        const exam = res.exam;
        const questions = exam.questions || [];

        let currentQ = 0;
        const answers = {};

        // Timer calculation
        let secondsLeft = (exam.duration_minutes || 20) * 60;
        let timerInterval = null;

        // Strict lockdown violation handler
        const handleLockdownViolation = async (reason) => {
            App.toast(`🚨 Strict Mode Alert: ${reason}`, 'danger');
            try {
                await API.post(`/api/exams/${examId}/fraud-alert`, { reason });
            } catch (err) {}
        };

        const onBlur = () => handleLockdownViolation('Window lost focus during strict exam mode!');
        const onVisibilityChange = () => {
            if (document.hidden) handleLockdownViolation('Switched tabs during strict exam mode!');
        };

        window.addEventListener('blur', onBlur);
        document.addEventListener('visibilitychange', onVisibilityChange);

        const stopLockdown = () => {
            if (timerInterval) clearInterval(timerInterval);
            window.removeEventListener('blur', onBlur);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            try {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
            } catch (e) {}
        };

        const renderQuestion = () => {
            const q = questions[currentQ];
            const mins = Math.floor(secondsLeft / 60);
            const secs = secondsLeft % 60;
            const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

            container.innerHTML = `
                <div class="fullscreen-exam-overlay" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 99999; background: var(--paper-bg-primary); padding: 32px; overflow-y: auto;">
                    <div class="glass-card" style="max-width: 720px; margin: 0 auto; padding: 32px; border: 2px solid var(--accent-coral);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                            <div>
                                <span style="font-weight: 800; font-size: 20px;">${exam.title}</span>
                                <div style="font-size: 12px; color: var(--status-danger); font-weight: 700; margin-top: 2px;">🔒 FULL-TAB STRICT LOCKDOWN MODE ACTIVE</div>
                            </div>
                            <div class="glass-badge glass-badge-danger" style="font-size: 18px; padding: 8px 16px; font-weight: 800;">
                                ⏳ ${timeStr}
                            </div>
                        </div>

                        <div style="margin-bottom: 16px;">
                            <span class="glass-badge glass-badge-warning">Question ${currentQ + 1} of ${questions.length}</span>
                        </div>

                        <h3 style="font-size: 22px; font-weight: 700; margin-bottom: 24px; color: var(--text-primary);">${q.text}</h3>

                        ${q.type === 'mcq' ? `
                            <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 28px;">
                                ${(q.options || []).map(opt => `
                                    <label class="glass-card interactive" style="padding: 16px 20px; display: flex; align-items: center; gap: 12px; cursor: pointer;">
                                        <input type="radio" name="mcq-option" value="${opt}" ${answers[q.id] === opt ? 'checked' : ''}>
                                        <span style="font-size: 16px; font-weight: 600;">${opt}</span>
                                    </label>
                                `).join('')}
                            </div>
                        ` : `
                            <textarea id="short-answer-input" class="glass-textarea" style="min-height: 120px; margin-bottom: 28px;" placeholder="Type your answer here...">${answers[q.id] || ''}</textarea>
                        `}

                        <div style="display: flex; justify-content: space-between;">
                            <button id="btn-prev-q" class="glass-btn" ${currentQ === 0 ? 'disabled' : ''}>Previous</button>
                            ${currentQ === questions.length - 1 ? `
                                <button id="btn-submit-exam" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 12px 28px; font-weight: 700;">Submit Exam</button>
                            ` : `
                                <button id="btn-next-q" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 12px 28px; font-weight: 700;">Next Question →</button>
                            `}
                        </div>
                    </div>
                </div>
            `;

            // Bind option choices
            if (q.type === 'mcq') {
                container.querySelectorAll('input[name="mcq-option"]').forEach(r => {
                    r.addEventListener('change', (e) => answers[q.id] = e.target.value);
                });
            } else {
                const ta = container.querySelector('#short-answer-input');
                if (ta) ta.addEventListener('input', (e) => answers[q.id] = e.target.value);
            }

            const prevBtn = container.querySelector('#btn-prev-q');
            if (prevBtn) prevBtn.addEventListener('click', () => { currentQ--; renderQuestion(); });

            const nextBtn = container.querySelector('#btn-next-q');
            if (nextBtn) nextBtn.addEventListener('click', () => { currentQ++; renderQuestion(); });

            const submitBtn = container.querySelector('#btn-submit-exam');
            if (submitBtn) submitBtn.addEventListener('click', async () => {
                stopLockdown();
                try {
                    const result = await API.submitExam(examId, answers);
                    App.showToast(`Exam completed! Score: ${result.percentage}% 🎉`, 'success');
                    this.renderExams(container);
                } catch (err) {
                    App.showToast(err.message, 'danger');
                }
            });
        };

        // Start Live Timer Interval
        timerInterval = setInterval(() => {
            secondsLeft--;
            const timerBadge = container.querySelector('.glass-badge-danger');
            if (timerBadge) {
                const mins = Math.floor(secondsLeft / 60);
                const secs = secondsLeft % 60;
                timerBadge.textContent = `⏳ ${mins}:${secs < 10 ? '0' : ''}${secs}`;
            }
            if (secondsLeft <= 0) {
                stopLockdown();
                App.toast('Time is up! Submitting exam automatically.', 'warning');
                API.submitExam(examId, answers).then(() => this.renderExams(container));
            }
        }, 1000);

        renderQuestion();
    },

    // 8.5 Past Notes Search & History
    async renderNotesHistory(container) {
        const res = await API.getNotesHistory();
        const sharedRes = await API.getSharedNotes();
        const notes = res.notes || [];
        const sharedNotes = sharedRes.notes || [];

        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 12px;">Past Notes & Search</h3>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <input type="text" id="notes-search-input" class="glass-input" placeholder="Search across all notebooks..." style="flex: 1;">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
                ${notes.map(n => {
                    let preview = n.content || '';
                    let hasCanvas = false;
                    try {
                        const p = JSON.parse(n.content);
                        if (p.type === 'smartslate_note_v2') {
                            preview = p.text || '(handwritten note)';
                            hasCanvas = !!p.canvasData;
                        }
                    } catch(e) {}
                    return `
                    <div class="glass-card interactive past-note-card" data-book-id="${n.book_id}" data-note-id="${n.id}" data-note-title="${n.title}" data-note-rule="${n.rule_type}" style="padding: 20px; cursor: pointer;">
                        <span class="glass-badge glass-badge-accent">${n.book_subject}</span>
                        ${hasCanvas ? '<span class="glass-badge" style="margin-left:6px; background: rgba(107,143,216,0.15); color: var(--accent-primary);">✏️ Stylus</span>' : ''}
                        <h4 style="font-size: 18px; font-weight: 700; margin: 8px 0 4px;">${n.title}</h4>
                        <p style="color: var(--text-secondary); font-size: 14px; max-height: 60px; overflow: hidden; margin-bottom: 12px;">${preview || 'Empty page'}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="font-size: 12px; color: var(--text-muted);">From: ${n.book_title}</div>
                            <span class="glass-badge" style="background: rgba(107,143,216,0.1); color: var(--accent-primary); font-size: 11px;">Click to open →</span>
                        </div>
                    </div>`;
                }).join('')}

                ${sharedNotes.map(sn => {
                    let preview = sn.content || '';
                    let hasCanvas = false;
                    try {
                        const p = JSON.parse(sn.content);
                        if (p.type === 'smartslate_note_v2') { preview = p.text || '(handwritten note)'; hasCanvas = !!p.canvasData; }
                    } catch(e) {}
                    return `
                    <div class="glass-card past-note-card" data-book-id="${sn.book_id}" data-note-id="${sn.id}" data-note-title="${sn.title}" data-note-rule="${sn.rule_type || 'ruled'}" style="padding: 20px; cursor: pointer; border-color: rgba(107, 143, 216, 0.5);">
                        <span class="glass-badge glass-badge-success">Shared by ${sn.owner_name}</span>
                        ${hasCanvas ? '<span class="glass-badge" style="margin-left:6px; background: rgba(107,143,216,0.15); color: var(--accent-primary);">✏️ Stylus</span>' : ''}
                        <h4 style="font-size: 18px; font-weight: 700; margin: 8px 0 4px;">${sn.title}</h4>
                        <p style="color: var(--text-secondary); font-size: 14px;">${preview || 'Empty note'}</p>
                        <div style="margin-top: 8px; text-align: right;">
                            <span class="glass-badge" style="background: rgba(107,143,216,0.1); color: var(--accent-primary); font-size: 11px;">Click to open →</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;

        // Add click handlers to open notes
        container.querySelectorAll('.past-note-card').forEach(card => {
            card.addEventListener('click', async () => {
                const bookId = parseInt(card.dataset.bookId);
                const noteId = parseInt(card.dataset.noteId);
                const noteTitle = card.dataset.noteTitle;
                const noteRule = card.dataset.noteRule;

                // Fetch the note content from API
                try {
                    const notesRes = await API.getNotes(bookId);
                    const allNotes = notesRes.notes || [];
                    const targetNote = allNotes.find(n => n.id == noteId);

                    this.currentBook = { id: bookId };
                    this.currentNote = targetNote || { id: noteId, title: noteTitle, rule_type: noteRule, content: '' };
                    this.activeTab = 'bookshelf';

                    // Re-render the tab bar to show bookshelf active
                    const tabBtns = document.querySelectorAll('.tab-btn');
                    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'bookshelf'));

                    const tabContent = document.querySelector('#student-tab-content');
                    if (tabContent) {
                        this.renderNotebookDetail(tabContent);
                    }
                } catch(err) {
                    App.toast('Could not open note: ' + err.message, 'danger');
                }
            });
        });
    },

    // 8.7 Safe Web Search
    async renderSearch(container) {
        container.innerHTML = `
            <div style="max-width: 800px; margin: 0 auto;">
                <div class="glass-card" style="padding: 32px; margin-bottom: 24px;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🌐</div>
                        <h2 style="font-size: 26px; font-weight: 800;">SmartSlate Safe Web Search</h2>
                        <p style="color: var(--text-secondary); font-size: 15px; margin-top: 4px;">Educational search filtered for students — no inappropriate content</p>
                    </div>

                    <form id="safe-search-form" style="display: flex; gap: 12px; margin-bottom: 0;">
                        <input type="text" id="safe-search-query" class="glass-input" 
                            placeholder="Search: photosynthesis, silk road, solar system, fractions..." 
                            style="flex: 1; font-size: 16px;" required autocomplete="off">
                        <button type="submit" class="glass-btn glass-btn-primary" style="padding: 12px 24px;">
                            🔍 Search
                        </button>
                    </form>
                </div>

                <!-- Search Results -->
                <div id="search-results-list" style="display: flex; flex-direction: column; gap: 16px;"></div>
            </div>
        `;

        const form = container.querySelector('#safe-search-form');
        const resultsList = container.querySelector('#search-results-list');
        const queryInput = container.querySelector('#safe-search-query');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const q = queryInput.value.trim();
            if (!q) return;

            resultsList.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px;">
                    <div class="spinner" style="margin: 0 auto 16px;"></div>
                    <p style="color: var(--text-secondary);">Searching educational resources...</p>
                </div>`;

            try {
                const res = await API.searchWeb(q);

                // UNSAFE CONTENT — show danger modal
                if (!res.safe) {
                    queryInput.value = '';
                    resultsList.innerHTML = '';
                    this.showUnsafeSearchAlert(q, res.message);
                    return;
                }

                // Safe results — render inline (no new tab)
                if (!res.results || res.results.length === 0) {
                    resultsList.innerHTML = `<div class="glass-card" style="text-align: center; padding: 40px; color: var(--text-muted);">No results found for "${q}". Try a different topic.</div>`;
                    return;
                }

                resultsList.innerHTML = `
                    <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">
                        Found ${res.results.length} educational resources for "<strong>${q}</strong>"
                    </div>
                    ${res.results.map((r, idx) => `
                        <div class="glass-card" style="padding: 24px; transition: transform 0.2s;" 
                             onmouseenter="this.style.transform='translateY(-2px)'" 
                             onmouseleave="this.style.transform=''">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                                <span class="glass-badge glass-badge-accent">${r.category || 'Educational'}</span>
                                <span style="font-size: 12px; color: var(--text-muted);">Result ${idx + 1}</span>
                            </div>
                            <h4 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary);">${r.title}</h4>
                            <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin-bottom: 16px;">${r.snippet}</p>
                            
                            <!-- Inline preview section (no new tab!) -->
                            <div id="preview-${idx}" style="display: none; background: rgba(0,0,0,0.03); border-radius: var(--radius-sm); padding: 16px; margin-bottom: 12px; border-left: 3px solid var(--accent-primary);">
                                <div id="preview-content-${idx}" style="font-size: 14px; line-height: 1.7; color: var(--text-primary);"></div>
                            </div>

                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="glass-btn glass-btn-sm btn-preview-result" 
                                    data-url="${r.url}" data-idx="${idx}" 
                                    style="font-size: 13px;">
                                    📄 Read Summary
                                </button>
                                <span style="font-size: 12px; color: var(--text-muted); align-self: center;">Source: ${new URL(r.url).hostname}</span>
                            </div>
                        </div>
                    `).join('')}
                `;

                // Bind preview buttons — show content inline
                container.querySelectorAll('.btn-preview-result').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const idx = btn.dataset.idx;
                        const url = btn.dataset.url;
                        const previewBox = container.querySelector(`#preview-${idx}`);
                        const previewContent = container.querySelector(`#preview-content-${idx}`);

                        if (previewBox.style.display !== 'none') {
                            previewBox.style.display = 'none';
                            btn.textContent = '📄 Read Summary';
                            return;
                        }

                        btn.textContent = '⏳ Loading...';
                        btn.disabled = true;

                        // Find the matching result
                        const matchResult = res.results[idx];
                        
                        // Show the pre-built snippet as inline preview (no external fetch needed)
                        previewContent.innerHTML = `
                            <div style="font-weight: 700; margin-bottom: 8px; color: var(--accent-primary);">📖 Summary</div>
                            <p style="margin: 0 0 12px;">${matchResult.snippet}</p>
                            <div style="font-weight: 700; margin-bottom: 6px;">💡 Study Tips</div>
                            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                                <li>Take notes while reading this topic</li>
                                <li>Look for key vocabulary and definitions</li>
                                <li>Try to summarize in your own words</li>
                                <li>Create a diagram or mind map</li>
                            </ul>
                            <div style="margin-top: 12px; padding: 8px 12px; background: var(--accent-light); border-radius: var(--radius-sm); font-size: 13px; color: var(--accent-primary);">
                                🔗 <strong>Full source:</strong> ${url}
                                <em style="color: var(--text-muted); margin-left: 8px;">(Ask your teacher to view the full page)</em>
                            </div>
                        `;

                        previewBox.style.display = 'block';
                        btn.textContent = '🔽 Hide Summary';
                        btn.disabled = false;
                    });
                });

            } catch (err) {
                resultsList.innerHTML = `
                    <div class="glass-card" style="padding: 24px; color: var(--status-danger); text-align: center;">
                        ⚠️ Error connecting to search service. Please try again.
                    </div>`;
            }
        });
    },

    showUnsafeSearchAlert(query, message) {
        // Create full-screen danger overlay
        const overlay = document.createElement('div');
        overlay.id = 'unsafe-search-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(220, 38, 38, 0.95);
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        overlay.innerHTML = `
            <div style="
                background: #1a0000;
                border: 2px solid rgba(255,100,100,0.5);
                border-radius: 20px;
                padding: 48px;
                max-width: 500px;
                text-align: center;
                color: white;
                box-shadow: 0 0 60px rgba(220,38,38,0.6);
                animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            ">
                <div style="font-size: 80px; margin-bottom: 16px; animation: shake 0.5s ease;">🚨</div>
                <h2 style="font-size: 28px; font-weight: 900; margin-bottom: 12px; color: #FF6B6B;">
                    ACCESS BLOCKED
                </h2>
                <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.85); margin-bottom: 20px;">
                    Your search for <strong style="color: #FF6B6B;">"${query}"</strong> has been blocked by SmartSlate's safety filter.
                </p>
                <div style="
                    background: rgba(255,100,100,0.15);
                    border: 1px solid rgba(255,100,100,0.3);
                    border-radius: 10px;
                    padding: 14px 18px;
                    margin-bottom: 24px;
                    font-size: 14px;
                    color: rgba(255,255,255,0.7);
                    text-align: left;
                ">
                    ⚠️ Your parents and teacher have been automatically notified about this search attempt.
                </div>
                <p style="font-size: 14px; color: rgba(255,255,255,0.6); margin-bottom: 28px;">
                    SmartSlate is an educational platform. Please only search for topics related to your studies.
                </p>
                <button id="unsafe-dismiss-btn" style="
                    background: white;
                    color: #DC2626;
                    border: none;
                    border-radius: 10px;
                    padding: 14px 32px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: transform 0.2s;
                ">I Understand — Go Back</button>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('#unsafe-dismiss-btn').addEventListener('click', () => {
            overlay.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => overlay.remove(), 300);
        });

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (document.getElementById('unsafe-search-overlay')) {
                overlay.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => overlay.remove(), 300);
            }
        }, 10000);
    },

    // 8.9 My Teacher Section
    async renderMyTeacher(container) {
        let teacherInfo = { name: 'Prof. Sarah Lin', email: 'teacher@smartslate.local', className: 'Grade 5 Alpha', code: 'CLASS-101' };
        try {
            const meRes = await API.get('/api/auth/me');
            if (meRes.user && meRes.user.class_name) {
                teacherInfo.className = meRes.user.class_name;
            }
        } catch(e) {}

        container.innerHTML = `
            <div class="glass-card" style="padding: 28px; margin-bottom: 24px; border-top: 4px solid var(--accent-blue);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
                    <div style="display: flex; gap: 20px; align-items: center;">
                        <div style="font-size: 64px;">👩‍🏫</div>
                        <div>
                            <span class="glass-badge glass-badge-accent" style="margin-bottom: 6px;">CLASS TEACHER</span>
                            <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary); margin-top: 2px;">${teacherInfo.name}</h2>
                            <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">Class: <strong>${teacherInfo.className}</strong> | Email: ${teacherInfo.email}</p>
                        </div>
                    </div>
                    <button id="btn-chat-with-teacher" class="glass-btn glass-btn-primary bouncy-btn" style="padding: 12px 24px;">
                        <img src="/assets/icons/icon-chat-teacher.svg" style="width: 20px; height: 20px;" alt="Chat">
                        <span>Send Direct Message</span>
                    </button>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                <div class="glass-card" style="padding: 20px;">
                    <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--accent-primary);">📢 Class Announcements</h4>
                    <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">"Welcome students! Please make sure to complete your Science assignment on Plant Ecosystems by Friday."</p>
                </div>

                <div class="glass-card" style="padding: 20px;">
                    <h4 style="font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--status-success);">⏰ Teacher Office Hours</h4>
                    <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6;">Monday & Wednesday: 3:00 PM – 4:30 PM<br>Ask questions via Direct Chat or during class.</p>
                </div>
            </div>
        `;

        container.querySelector('#btn-chat-with-teacher').addEventListener('click', () => {
            this.activeTab = 'chat';
            document.querySelectorAll('.tab-bar .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'chat'));
            this.renderTabContent(document.querySelector('#student-tab-content'));
        });
    },

    // 8.8 Attendance View
    async renderAttendance(container) {
        const res = await API.getAttendance();
        const records = res.attendance || [];

        container.innerHTML = `
            <div class="glass-card" style="margin-bottom: 24px;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">My Attendance History</h3>
                <p style="color: var(--text-secondary); font-size: 14px;">Record of present, absent, and late marks by date</p>
            </div>

            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${records.length === 0 ? '<div class="glass-card" style="padding: 20px;">No attendance records found.</div>' : ''}
                ${records.map(r => `
                    <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;">
                        <div>
                            <span style="font-weight: 700; font-size: 16px;">${r.date}</span>
                            <div style="font-size: 13px; color: var(--text-secondary);">${r.class_name || 'Grade 5 Alpha'}</div>
                        </div>
                        <span class="glass-badge ${r.status === 'present' ? 'glass-badge-success' : r.status === 'late' ? 'glass-badge-warning' : 'glass-badge-danger'}">
                            ${r.status.toUpperCase()}
                        </span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Modals
    showNewBookModal() {
        const modalContainer = document.querySelector('#modal-container');
        modalContainer.innerHTML = `
            <div class="modal-overlay active">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Create New Notebook</h3>
                        <button class="modal-close" onclick="document.querySelector('#modal-container').innerHTML=''">×</button>
                    </div>
                    <form id="form-create-book" style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Notebook Title</label>
                            <input type="text" id="new-book-title" class="glass-input" placeholder="e.g. Science & Discovery" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Subject Category</label>
                            <input type="text" id="new-book-subject" class="glass-input" placeholder="e.g. Science" required>
                        </div>
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Cover Theme</label>
                            <select id="new-book-style" class="glass-select">
                                <option value="blue_linen">📘 Blue Linen</option>
                                <option value="sage_paper">📗 Sage Paper</option>
                                <option value="terracotta_leather">📙 Terracotta</option>
                                <option value="plum_velvet">📓 Plum Velvet</option>
                                <option value="amber_gold">📒 Amber Gold</option>
                            </select>
                        </div>
                        <button type="submit" class="glass-btn glass-btn-primary" style="margin-top: 12px;">Create Notebook</button>
                    </form>
                </div>
            </div>
        `;

        modalContainer.querySelector('#form-create-book').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = modalContainer.querySelector('#new-book-title').value;
            const subject = modalContainer.querySelector('#new-book-subject').value;
            const cover_style = modalContainer.querySelector('#new-book-style').value;

            try {
                await API.createBook(title, subject, cover_style);
                modalContainer.innerHTML = '';
                App.showToast('Notebook created successfully!');
                this.activeTab = 'bookshelf';
                this.renderTabContent(document.querySelector('#student-tab-content'));
            } catch (err) {
                App.showToast(err.message, 'danger');
            }
        });
    },

    showShareNoteModal(noteId) {
        const modalContainer = document.querySelector('#modal-container');
        modalContainer.innerHTML = `
            <div class="modal-overlay active">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 class="modal-title">Share Note Page</h3>
                        <button class="modal-close" onclick="document.querySelector('#modal-container').innerHTML=''">×</button>
                    </div>
                    <form id="form-share-note" style="display: flex; flex-direction: column; gap: 16px;">
                        <div>
                            <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 6px;">Enter Classmate Student Code</label>
                            <input type="text" id="share-target-code" class="glass-input" placeholder="e.g. STU-102" required>
                        </div>
                        <button type="submit" class="glass-btn glass-btn-primary">Share Note</button>
                    </form>
                </div>
            </div>
        `;

        modalContainer.querySelector('#form-share-note').addEventListener('submit', async (e) => {
            e.preventDefault();
            const code = modalContainer.querySelector('#share-target-code').value;
            try {
                await API.shareNote(noteId, code);
                modalContainer.innerHTML = '';
                App.showToast(`Note shared with ${code}!`);
            } catch (err) {
                App.showToast(err.message, 'danger');
            }
        });
    }
};
