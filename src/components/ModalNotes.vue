<script setup>
import { Folder, FolderUp } from 'lucide-vue-next'
import { formatDate } from '../utils/datetime'

const props = defineProps({
  showModal: Boolean,
  selectedSymbol: String,
  notesList: Array,
  isDescending: Boolean,
  action: String,
  title: String,
  content: String,
  filePaths: Array,
  selectedFiles: Array,
  isEditing: Boolean,
  editingId: [String, Number]
})

const emit = defineEmits([
  'update:isDescending',
  'update:title',
  'update:content',
  'update:selectedFiles',
  'update:showModal',
  'startEditingNote',
  'deleteNote',
  'saveNote',
  'updateNote',
  'resetNoteForm',
  'previewFile',
  'deleteFile'
])

const handleFileChange = (event) => {
  emit('update:selectedFiles', Array.from(event.target.files))
}
</script>

<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
  >
    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-xl border border-gray-600">
      <h3 class="text-lg font-semibold text-white mb-4">
        Notes for {{ selectedSymbol }}
      </h3>
      <div class="mb-4 max-h-60 overflow-y-auto">
        <div class="mb-2">
          <label class="block text-sm text-gray-400 mb-1">Order</label>
          <select
            :value="isDescending"
            @change="$emit('update:isDescending', $event.target.value === 'true')"
            class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
          >
            <option :value="false">Ascending</option>
            <option :value="true">Descending</option>
          </select>
        </div>
        
        <ul v-if="notesList.length" class="space-y-2">
          <li
            v-for="note in notesList"
            :key="note.id"
            class="bg-gray-700 p-3 rounded flex justify-between items-start gap-2"
          >
            <div>
              <p class="font-bold text-white">{{ note.title }}</p>
              <p class="text-gray-300 text-sm">{{ note.content }}</p>
              <p class="text-[10px] text-gray-400 mt-2">{{ formatDate(note.createdOn) }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="$emit('startEditingNote', note.id, 'view')" class="text-gray-400 hover:text-gray-300 text-sm">View</button>
              <button @click="$emit('startEditingNote', note.id, 'edit')" class="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
              <button @click="$emit('deleteNote', note.id)" class="text-red-400 hover:text-red-300 text-sm">Delete</button>
            </div>
          </li>
        </ul>
        <p v-else class="text-gray-400 text-sm">No notes found for this stock.</p>
      </div>
      
      <!-- Add Note Form -->
      <h3 class="text-lg font-semibold text-white mb-2">
        {{ action === 'view' ? 'View' : (isEditing ? 'Edit' : 'Add') }} Note
      </h3>
      <div class="flex flex-col gap-3">
        <input
          :value="title"
          @input="$emit('update:title', $event.target.value)"
          type="text"
          placeholder="Title"
          class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none"
          :readonly="action === 'view'"
        />
        <textarea
          :value="content"
          @input="$emit('update:content', $event.target.value)"
          placeholder="Notes"
          rows="4"
          class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none resize-none"
          :readonly="action === 'view'"
        ></textarea>
      </div>

      <div class="flex flex-col gap-3 mt-3">
        <label class="text-gray-400 text-sm">{{action === 'view' ? 'Uploaded' : 'Upload'}} File</label>
        <label
          v-if="action !== 'view'"
          for="fileInput"
          class="flex items-center cursor-pointer bg-gray-700 text-gray-200 px-4 py-2 rounded border border-gray-600 hover:bg-gray-600 transition-colors"
        >
          <FolderUp class="w-5 h-5 mr-2" /> Choose Files {{ selectedFiles.length ? `(${selectedFiles.length})` : '' }}
        </label>

        <input
          id="fileInput"
          type="file"
          multiple
          @change="handleFileChange"
          class="hidden"
          :disabled="action === 'view'"
        />

        <div v-if="filePaths.length" class="text-sm text-gray-200 space-y-2">
          <div class="font-semibold mb-1">Files:</div>
          <ul class="pl-4 space-y-1">
            <li
              v-for="(file, index) in filePaths"
              :key="file"
              class="flex items-center justify-between group"
            >
              <div
                @click="$emit('previewFile', file)"
                class="flex cursor-pointer text-blue-400 underline hover:text-blue-300 transition"
              >
                <Folder class="w-5 h-5 mr-2" /> File ke-{{ index + 1 }}
              </div>
              <button
                v-if="action === 'edit'"
                @click.stop="$emit('deleteFile', file)"
                class="text-red-400 text-xs opacity-0 group-hover:opacity-100 hover:text-red-300 transition"
              >
                Delete
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <button
          @click="$emit('resetNoteForm')"
          class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          v-if="action !== 'view'"
          @click="isEditing ? $emit('updateNote') : $emit('saveNote')"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
        >
          {{ isEditing ? 'Update' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>