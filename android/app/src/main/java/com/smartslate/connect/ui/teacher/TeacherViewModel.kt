package com.smartslate.connect.ui.teacher

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartslate.connect.data.model.*
import com.smartslate.connect.data.repository.TeacherRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TeacherUiState(
    val isLoading: Boolean = false,
    val classes: List<ClassItem> = emptyList(),
    val selectedClass: ClassItem? = null,
    val students: List<Student> = emptyList(),
    val assignments: List<Assignment> = emptyList(),
    val selectedAssignment: Assignment? = null,
    val submissions: List<Submission> = emptyList(),
    val message: String? = null
)

class TeacherViewModel(
    private val repository: TeacherRepository = TeacherRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(TeacherUiState())
    val uiState: StateFlow<TeacherUiState> = _uiState.asStateFlow()

    fun loadTeacherData(teacherId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val classes = repository.getTeacherClasses(teacherId)
            val assignments = repository.getTeacherAssignments(teacherId)
            
            val activeClass = classes.firstOrNull()
            val students = if (activeClass != null) repository.getClassStudents(activeClass.id) else emptyList()

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                classes = classes,
                selectedClass = activeClass,
                students = students,
                assignments = assignments
            )
        }
    }

    fun selectClass(classItem: ClassItem) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, selectedClass = classItem)
            val students = repository.getClassStudents(classItem.id)
            _uiState.value = _uiState.value.copy(isLoading = false, students = students)
        }
    }

    fun selectAssignment(assignment: Assignment) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, selectedAssignment = assignment)
            val subs = repository.getAssignmentSubmissions(assignment.id)
            _uiState.value = _uiState.value.copy(isLoading = false, submissions = subs)
        }
    }

    fun createAssignment(
        teacherId: String,
        title: String,
        description: String,
        subject: String,
        classId: String,
        className: String,
        dueDate: String,
        priority: String,
        onComplete: (Boolean) -> Unit
    ) {
        viewModelScope.launch {
            val newAssignment = Assignment(
                classId = classId,
                className = className,
                teacherId = teacherId,
                title = title,
                description = description,
                subject = subject,
                priority = priority,
                dueAtFormatted = dueDate,
                status = "published"
            )
            val success = repository.createAssignment(newAssignment)
            if (success) {
                loadTeacherData(teacherId)
            }
            onComplete(success)
        }
    }

    fun gradeSubmission(submissionId: String, grade: Double, feedback: String, onComplete: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = repository.gradeSubmission(submissionId, grade, feedback)
            if (success && _uiState.value.selectedAssignment != null) {
                val updatedSubs = repository.getAssignmentSubmissions(_uiState.value.selectedAssignment!!.id)
                _uiState.value = _uiState.value.copy(submissions = updatedSubs)
            }
            onComplete(success)
        }
    }

    fun saveAttendance(classId: String, className: String, teacherId: String, date: String, attendanceMap: Map<String, String>, onComplete: (Boolean) -> Unit) {
        viewModelScope.launch {
            val records = attendanceMap.map { (studentId, status) -> Pair(studentId, status) }
            val success = repository.saveAttendance(classId, className, teacherId, date, records)
            onComplete(success)
        }
    }

    fun createAnnouncement(teacherId: String, teacherName: String, classId: String, className: String, title: String, message: String, priority: String, onComplete: (Boolean) -> Unit) {
        viewModelScope.launch {
            val anc = Announcement(
                teacherId = teacherId,
                teacherName = teacherName,
                classId = classId,
                className = className,
                title = title,
                message = message,
                priority = priority
            )
            val success = repository.createAnnouncement(anc)
            onComplete(success)
        }
    }

    fun clearMessage() {
        _uiState.value = _uiState.value.copy(message = null)
    }
}
