package com.smartslate.connect.ui.parent

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.smartslate.connect.data.model.*
import com.smartslate.connect.data.repository.ParentRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ParentUiState(
    val isLoading: Boolean = false,
    val children: List<Student> = emptyList(),
    val selectedChild: Student? = null,
    val attendanceList: List<Attendance> = emptyList(),
    val submissionsList: List<Submission> = emptyList(),
    val progress: StudentProgress? = null,
    val announcements: List<Announcement> = emptyList()
)

class ParentViewModel(
    private val repository: ParentRepository = ParentRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow(ParentUiState())
    val uiState: StateFlow<ParentUiState> = _uiState.asStateFlow()

    fun loadParentData(parentUserId: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val children = repository.getParentChildren(parentUserId)
            val activeChild = children.firstOrNull()

            if (activeChild != null) {
                loadChildDetails(activeChild, children)
            } else {
                _uiState.value = _uiState.value.copy(isLoading = false, children = children)
            }
        }
    }

    fun selectChild(student: Student) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, selectedChild = student)
            loadChildDetails(student, _uiState.value.children)
        }
    }

    private suspend fun loadChildDetails(student: Student, childrenList: List<Student>) {
        val att = repository.getChildAttendance(student.id)
        val subs = repository.getChildSubmissions(student.id)
        val prog = repository.getChildProgress(student.id)
        val ancs = repository.getAnnouncementsForClass(student.classId)

        _uiState.value = _uiState.value.copy(
            isLoading = false,
            children = childrenList,
            selectedChild = student,
            attendanceList = att,
            submissionsList = subs,
            progress = prog,
            announcements = ancs
        )
    }
}
