<template>
  <div class="flex min-h-screen items-center justify-center  px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-md space-y-8 bg-white/90 p-6 rounded-lg shadow">
      <div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign up
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your account credentials
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">

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
                <p v-else class="text-sm text-gray-500">Drag & drop your photo here, or click to select</p>

                <img v-if="previewUrl" :src="previewUrl" alt="Preview" class="mt-4 max-h-32 rounded-md object-cover" />

                <div v-if="previewUrl" class="mt-2">
                  <a href="#" @click.stop.prevent="removeFile" class="text-red-600 text-sm hover:underline">
                    Remove Photo
                  </a>
                </div>

                <button type="button" @click.stop.prevent="openDropzone"
                  class="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500">
                  Select File
                </button>

              </div>
            </Card>
          </div>
        </div>

        <!-- Password input -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <Input id="password" v-model="formData.password" type="password" autocomplete="current-password" required
            placeholder="••••••••" />
        </div>

        <!-- Nickname input -->
        <div>
          <label for="nickname" class="block text-sm font-medium text-gray-700 mb-1">
            Nickname
          </label>
          <Input id="nickname" v-model="formData.nickname" type="text" autocomplete="name" required />
        </div>


        <!-- Submit button -->
        <div>
          <Button type="submit" class="w-full"> Sign up </Button>
        </div>

        <!-- Sign up link -->
        <div class="text-center text-sm">
          <span class="text-gray-600">Already have an account? </span>
          <RouterLink to="/login">Sign in</RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card/index.js'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { extractErrorMessage } from '@/utils/errorHandler.js'

// Vue3 Dropzone composable
import { useDropzone } from 'vue3-dropzone'

const authStore = useAuthStore()
const router = useRouter()

const formData = ref({
  email: '',
  name: '',
  nickname: '',
  password: '',
  photo: null
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
  previewUrl.value = null
  files.value = []
}

// Handle form submit
const handleSubmit = async () => {
  // Show loading toast
  const toastId = toast.loading('Creating account...')
  try {
    // Call register
    await authStore.register(formData.value)

    // Update loading toast to success
    toast.success('Account created successfully!', { id: toastId })

    // Redirect to login
    await router.push('/')
  } catch (error) {
    const errorMessage = extractErrorMessage(error)
    toast.dismiss(toastId)
    toast.error(errorMessage)
    console.error(error)
  }
}
</script>

<style scoped>
img {
  max-width: 100%;
  border-radius: 0.5rem;
}
</style>
