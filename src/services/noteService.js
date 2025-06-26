// src/services/noteService.js
import axios from 'axios'

export async function loadNotes(state, token) {
    if (!state.notes.selectedSymbol) return

    try {
        const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/comment?` +
            `Symbol=${encodeURIComponent(state.notes.selectedSymbol)}` +
            `&IsDecsending=${state.notes.isDescending}`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        state.notes.list = response.data || []
    } catch (err) {
        console.error("Failed to load notes:", err.response?.data?.message || err.message)
        state.notes.list = []
    }
}

export async function startEditingNote(state, token, noteId, action) {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/comment/${noteId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const note = response.data

        state.notes.action = action
        state.notes.title = note.title
        state.notes.content = note.content
        state.notes.filePaths = note.filePaths || []
        state.notes.editingId = noteId
        state.notes.isEditing = true
        state.notes.showModal = true
    } catch (error) {
        console.error('Failed to fetch note:', error)
        alert('Error fetching note for editing.')
    }
}

export async function saveNote(state, token) {
    state.portfolio.loading = true
    try {
        await uploadFile(state, token)

        const payload = {
            title: state.notes.title,
            content: state.notes.content,
            filePath: state.preview.url
        }

        await axios.post(
            `${import.meta.env.VITE_API_URL}/api/comment/${encodeURIComponent(state.notes.selectedSymbol)}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        )

        alert("Note saved successfully.")
        await loadNotes(state, token)
        resetNoteForm(state)
    } catch (err) {
        console.error("Error saving note:", err)
        alert(err.response?.data?.message || "Failed to save note.")
    } finally {
        state.portfolio.loading = false
    }
}

export async function updateNote(state, token) {
    state.portfolio.loading = true
    try {
        await uploadFile(state, token)

        const payload = {
            title: state.notes.title,
            content: state.notes.content,
            filePath: state.preview.url
        }

        await axios.put(
            `${import.meta.env.VITE_API_URL}/api/comment/${state.notes.editingId}`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        )

        const index = state.notes.list.findIndex(n => n.id === state.notes.editingId)
        if (index !== -1) {
            state.notes.list[index].title = state.notes.title
            state.notes.list[index].content = state.notes.content
        }

        alert('Note updated successfully.')
        resetNoteForm(state)
    } catch (err) {
        console.error(err)
        alert('Error updating note.')
    } finally {
        state.portfolio.loading = false
    }
}

export async function deleteNote(state, token, noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return
    state.portfolio.loading = true
    try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/comment/${noteId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        state.notes.filePaths = data.filePaths || []

        if (state.notes.filePaths.length) {
            for (const file of state.notes.filePaths) {
                await deleteFile(state, file)
            }
        }

        await axios.delete(`${import.meta.env.VITE_API_URL}/api/comment/${noteId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        state.notes.list = state.notes.list.filter(note => note.id !== noteId)
        resetNoteForm(state)
    } catch (error) {
        console.error(error)
        alert('Error deleting note.')
    } finally {
        state.portfolio.loading = false
    }
}

export function resetNoteForm(state) {
    state.notes.title = ''
    state.notes.content = ''
    state.notes.filePaths = []
    state.notes.selectedFiles = []
    state.notes.isEditing = false
    state.notes.editingId = null
    state.notes.showModal = false
}

export async function uploadFile(state, token) {
    if (!state.notes.selectedFiles.length) return
    state.portfolio.loading = true

    const formData = new FormData()
    state.notes.selectedFiles.forEach(file => {
        formData.append("files[]", file)
    })

    try {
        const { data } = await axios.post("http://localhost:8080/upload", formData, {
            headers: { Authorization: `Bearer ${token}` }
        })
        state.preview.url = (data.files || []).join(",")
        state.notes.selectedFiles = []
    } catch (error) {
        console.error("Error uploading files:", error)
        alert("Error uploading files.")
    } finally {
        state.portfolio.loading = false
    }
}

export async function deleteFile(state, file) {
    try {
        await axios.delete(`http://localhost:8080/delete/${file}`)
    } catch (error) {
        console.error("Error deleting file:", error)
        alert("Error deleting file.")
    }
}