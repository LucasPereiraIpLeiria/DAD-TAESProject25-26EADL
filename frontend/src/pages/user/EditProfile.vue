<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Edit profile
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
                <Input id="email" v-model="formData.email" type="email" required
                       placeholder="you@example.com" />
              </div>

              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                  Full name
                </label>
                <Input id="name" v-model="formData.name" type="text" required />
              </div>
            </div>

            <!-- Right side: file upload -->
            <div>
              <Card class="h-full p-4 flex flex-col items-center justify-center">
                <div v-bind="dropzoneRootProps"
                     class="flex flex-col items-center justify-center h-full w-full text-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input v-bind="dropzoneInputProps" />
                  <p v-if="isDragActive" class="text-sm text-gray-500">Drop the file here…</p>
                  <p v-else class="text-sm text-gray-500">Drag & drop your photo here, or click to select</p>

                  <img
                    v-if="previewUrl"
                    :src="previewUrl"
                    alt="Preview"
                    class="mt-4 max-h-32 rounded-md object-cover"
                  />

                  <div v-if="previewUrl" class="mt-2">
                    <a href="#" @click.prevent="removeFile" class="text-red-600 text-sm hover:underline">
                      Remove Photo
                    </a>
                  </div>

                  <button type="button" @click="openDropzone"
                          class="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500">
                    Select File
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
            <Input id="nickname" v-model="formData.nickname" type="text" required />
          </div>

          <!-- Change password section -->
          <div class="pt-4 border-t border-gray-200">
            <h3 class="text-sm font-medium text-gray-700 mb-4">Change password (optional)</h3>

            <div class="space-y-4">
              <div>
                <label for="currentPassword" class="block text-sm font-medium text-gray-700 mb-1">
                  Current password
                </label>
                <Input id="currentPassword" v-model="formData.currentPassword" type="password"
                       placeholder="••••••••" />
              </div>

              <div>
                <label for="newPassword" class="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <Input id="newPassword" v-model="formData.newPassword" type="password"
                       placeholder="••••••••" />
              </div>

              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
                  Confirm new password
                </label>
                <Input id="confirmPassword" v-model="formData.confirmPassword" type="password"
                       placeholder="••••••••" />
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-3">
          <Button type="submit" class="flex-1">Save changes</Button>
          <RouterLink to="/profile"
                      class="flex-1 text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            Cancel
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card/index.js'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { extractErrorMessage } from '@/utils/errorHandler.js'
import { useDropzone } from 'vue3-dropzone'
import {useAPIStore} from '@/stores/api.js'

const apiStore = useAPIStore()

const authStore = useAuthStore()
const router = useRouter()

const formData = ref({
  email: '',
  name: '',
  nickname: '',
  photo: null,
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const previewUrl = ref(null)

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

      const reader = new FileReader()
      reader.onload = e => previewUrl.value = e.target.result
      reader.readAsDataURL(file)
    } else {
      removeFile()
    }
  }
})

const dropzoneRootProps = getRootProps()
const dropzoneInputProps = getInputProps()

const removeFile = () => {
  formData.value.photo = null
  previewUrl.value = null
  files.value = []
}

onMounted(() => {
  if (authStore.currentUser) {
    formData.value.email = authStore.currentUser.email
    formData.value.name = authStore.currentUser.name
    formData.value.nickname = authStore.currentUser.nickname
    previewUrl.value = authStore.currentUser.photo
  }
})

const handleSubmit = async () => {
  // Validate passwords match if provided
  if (formData.value.newPassword && formData.value.newPassword !== formData.value.confirmPassword) {
    toast.error('Passwords do not match')
    return
  }

  const toastId = toast.loading('Updating profile...')
  try {
    const response = await apiStore.updateProfile(formData.value)

    console.log('API Response:', response)

    // Update auth store - check if currentUser is a ref or regular object
    if (response.data && response.data.user) {
      if (authStore.currentUser && typeof authStore.currentUser === 'object') {
        // If it's a regular object
        Object.assign(authStore.currentUser, response.data.user)
      } else if (authStore.currentUser?.value) {
        // If it's a ref
        Object.assign(authStore.currentUser.value, response.data.user)
      }

      localStorage.setItem('logged_user', JSON.stringify(response.data.user))
    }

    toast.success('Profile updated successfully!', { id: toastId })
    await router.push('/profile')
  } catch (error) {
    const errorMessage = extractErrorMessage(error)
    toast.dismiss(toastId)
    toast.error(errorMessage)
    console.error('Full error:', error)
  }
}
watch(() => authStore.isLoggedIn, (newValue) => {
  console.log('isLoggedIn changed:', newValue)
  if (!newValue) {
    router.push('/')
  }
})

</script>

<style scoped>
img {
  max-width: 100%;
  border-radius: 0.5rem;
}
</style>
