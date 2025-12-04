<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Profile Settings
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Update your account information
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4 rounded-md shadow-sm">
          <!-- Grid for inputs and file upload -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Left side inputs -->
            <div class="space-y-4">
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <Input id="email" v-model="formData.email" type="email" autocomplete="email" required
                       placeholder="you@example.com" />
              </div>

              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input id="name" v-model="formData.name" type="text" autocomplete="name" required />
              </div>
            </div>

            <!-- Right side: file upload -->
            <div>
              <Card class="h-full p-4 flex flex-col items-center justify-center">
                <div v-bind="dropzoneRootProps"
                     class="flex flex-col items-center justify-center h-full w-full text-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input v-bind="dropzoneInputProps" />
                  <p v-if="isDragActive" class="text-sm text-gray-500">Drop the file here…</p>
                  <p v-else-if="!previewUrl" class="text-sm text-gray-500">Drag & drop your photo here, or click to select</p>

                  <img
                    v-if="previewUrl"
                    :src="previewUrl"
                    alt="Preview"
                    class="mt-2 max-h-32 rounded-md object-cover"
                  />

                  <div v-if="previewUrl" class="mt-2">
                    <a href="#" @click.prevent="removeFile" class="text-red-600 text-sm hover:underline">
                      Remove Photo
                    </a>
                  </div>

                  <button type="button" @click="openDropzone"
                          class="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500">
                    {{ previewUrl ? 'Change Photo' : 'Select File' }}
                  </button>
                </div>
              </Card>
            </div>
          </div>

          <!-- Nickname input -->
          <div>
            <label for="nickname" class="block text-sm font-medium text-gray-700 mb-1">
              Nickname
            </label>
            <Input id="nickname" v-model="formData.nickname" type="text" autocomplete="nickname" />
          </div>

          <!-- Password input (optional for update) -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              New Password (leave blank to keep current)
            </label>
            <Input id="password" v-model="formData.password" type="password" autocomplete="new-password"
                   placeholder="••••••••" />
          </div>
        </div>

        <!-- Submit button -->
        <div class="flex gap-3">
          <Button type="submit" class="w-full">Update Profile</Button>
          <Button type="button" variant="outline" class="w-full" @click="cancelEdit">Cancel</Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card/index.js'

// Auth store and router
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import axios from 'axios'

// Vue3 Dropzone composable
import { useDropzone } from 'vue3-dropzone'

const authStore = useAuthStore()
const router = useRouter()
const API_BASE_URL = inject('apiBaseURL')

const formData = ref({
  email: '',
  name: '',
  nickname: '',
  password: '',
  photo: null
})

const previewUrl = ref(null)
const currentAvatarFilename = ref(null)

// Setup dropzone
const files = ref([])
const { getRootProps, getInputProps, open: openDropzone, isDragActive } = useDropzone({
  accept: ['image/*'],
  maxFiles: 1,
  onDrop: (acceptedFiles) => {
    if (acceptedFiles.length) {
      const file = acceptedFiles[0]
      formData.value.photo = file
      files.value = [file]

      // Generate preview
      const reader = new FileReader()
      reader.onload = e => previewUrl.value = e.target.result
      reader.readAsDataURL(file)
    } else {
      removeFile()
    }
  }
})

// Spread props for template
const dropzoneRootProps = getRootProps()
const dropzoneInputProps = getInputProps()

// Remove selected file
const removeFile = () => {
  formData.value.photo = null
  previewUrl.value = currentAvatarFilename.value 
    ? `http://127.0.0.1:8000/storage/photos_avatars/${currentAvatarFilename.value}`
    : null
  files.value = []
}

// Load current user data
const loadUserData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/me`)
    const userData = response.data
    
    formData.value.email = userData.email
    formData.value.name = userData.name
    formData.value.nickname = userData.nickname
    currentAvatarFilename.value = userData.photo_avatar_filename
    
    // Set preview to current avatar if exists
    if (userData.photo_avatar_filename) {
      previewUrl.value = `${API_BASE_URL}/storage/photos_avatars/${userData.photo_avatar_filename}`
    }
  } catch (error) {
    console.error('Failed to load user data:', error)
    toast.error('Failed to load profile data')
  }
}

// Handle form submit
const handleSubmit = async () => {
  try {
    const updateData = new FormData()
    updateData.append('email', formData.value.email)
    updateData.append('name', formData.value.name)
    updateData.append('nickname', formData.value.nickname)
    
    // Only append password if it's filled
    if (formData.value.password) {
      updateData.append('password', formData.value.password)
    }
    
    // Only append photo if a new one was selected
    if (formData.value.photo) {
      updateData.append('photo', formData.value.photo)
    }

    await toast.promise(
      axios.post(`${API_BASE_URL}/users/me`, updateData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }),
      {
        loading: 'Updating profile...',
        success: () => {
          // Refresh auth store
          authStore.fetchUser()
          return 'Profile updated successfully!'
        },
        error: (err) => `Error: ${err?.response?.data?.message || err.message}`,
      }
    )
  } catch (error) {
    console.error('Profile update error:', error)
  }
}

// Cancel edit and go back
const cancelEdit = () => {
  router.back()
}

onMounted(() => {
  loadUserData()
})
</script>

<style scoped>
img {
  max-width: 100%;
  border-radius: 0.5rem;
}
</style>