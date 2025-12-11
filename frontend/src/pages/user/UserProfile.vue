<template>
  <div class="flex min-h-screen bg-gray-200 px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-2xl mx-auto">
      <div class="bg-white rounded-lg shadow-md p-8">
        <!-- Header -->
        <div class="flex items-start justify-between mb-8">
          <div>
            <h2 class="text-3xl font-bold tracking-tight text-gray-900">
              Profile
            </h2>
            <p class="mt-2 text-sm text-gray-600">
              View and manage your account information
            </p>
          </div>
        </div>

        <!-- Profile Card -->
        <div class="space-y-6">
          <!-- Avatar Section -->
          <div class="flex items-center space-x-6">
            <div class="flex-shrink-0">
              <img
                :src="selectedAvatarImage"
                alt="Profile"
                class="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
            <div>
              <h3 class="text-2xl font-bold text-gray-900">{{ authStore.currentUser?.name }}</h3>
              <p class="text-sm text-gray-600 mt-1">@{{ authStore.currentUser?.nickname }}</p>
              <p class="text-sm text-gray-500 mt-2">{{ authStore.currentUser?.email }}</p>
            </div>
          </div>

          <!-- Divider -->
          <hr class="border-gray-200" />

          <!-- Profile Information -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <p class="text-gray-900">{{ authStore.currentUser?.email }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Full name
              </label>
              <p class="text-gray-900">{{ authStore.currentUser?.name }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <p class="text-gray-900">{{ authStore.currentUser?.nickname }}</p>
            </div>
          </div>

          <!-- Divider -->
          <hr class="border-gray-200" />

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <!-- Edit Profile Button -->
            <RouterLink
              to="/profile/edit"
              class="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-medium text-center"
            >
              Edit Profile
            </RouterLink>

            <!-- Delete Account Button -->
            <button
              @click="showDeleteModal = true"
              class="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition font-medium text-center"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop with blur effect but still showing background -->
      <div
        @click="showDeleteModal = false"
        class="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"
      />

      <!-- Dialog Content -->
      <div class="relative z-10 w-full max-w-md transform transition-all">
        <div class="bg-white rounded-lg shadow-xl p-6">
          <div class="mb-4">
            <h3 class="text-lg font-bold text-gray-900 mb-2">Delete Account</h3>
            <p class="text-gray-600">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                v-model="deletePassword"
                type="password"
                placeholder="Enter your password"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                @keyup.enter="confirmDelete"
              />
            </div>

            <!-- Modal buttons -->
            <div class="flex justify-end gap-3 pt-4">
              <button
                @click="showDeleteModal = false"
                class="flex-1 px-4 py-2 text-gray-700 hover:text-gray-900 transition font-medium hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                @click="confirmDelete"
                :disabled="!deletePassword || isDeleting"
                :class="[
                  'flex-1 px-4 py-2 bg-red-600 text-white rounded-lg transition font-medium',
                  (!deletePassword || isDeleting)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                ]"
              >
                <span v-if="isDeleting" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
                <span v-else>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useAPIStore } from '@/stores/api.js'

const authStore = useAuthStore()
const apiStore = useAPIStore()
const router = useRouter()

// Delete modal state
const showDeleteModal = ref(false)
const deletePassword = ref('')
const isDeleting = ref(false)

// Import avatar images
import avatarDefault from '@/assets/images/avatars/anonymous.png'
import avatarMage from '@/assets/images/avatars/mage.png'
import avatarRobot from '@/assets/images/avatars/robot.png'
import avatarDragon from '@/assets/images/avatars/dragon.png'

// Map avatar keys to their images
const avatarImages = {
  default: avatarDefault,
  mage: avatarMage,
  robot: avatarRobot,
  dragon: avatarDragon,
}

// Get the selected avatar image based on customization
const selectedAvatarImage = computed(() => {
  // Use optional chaining to safely access nested properties
  const customAvatars = authStore.currentUser?.custom?.avatars
  const selectedAvatarKey = customAvatars?.selected ?? 'default'

  // If it's the default avatar, use the user's profile picture if available
  if (selectedAvatarKey === 'default') {
    if (authStore.currentUser?.photo_avatar_filename) {
      return `http://127.0.0.1:8000/storage/photos_avatars/${authStore.currentUser.photo_avatar_filename}`
    }
    return avatarDefault
  }

  // Otherwise use the selected avatar customization
  return avatarImages[selectedAvatarKey] || avatarDefault
})

const confirmDelete = async () => {
  if (!deletePassword.value.trim()) {
    toast.error('Please enter your password')
    return
  }

  isDeleting.value = true

  try {
    // Call API to delete account with password confirmation
    // Your API store's deleteUser method expects a password parameter
    await apiStore.deleteUser(deletePassword.value)

    toast.success('Account deleted successfully')

    // Clear user data using authStore's methods
    authStore.logout() // This will clear both authStore and localStorage

    // Redirect to home
    router.push('/')

  } catch (error) {
    console.error('Delete error:', error)

    // Handle different error responses
    if (error.response?.status === 422) {
      // This is the validation error for incorrect password
      const errorMessage = error.response.data?.errors?.password?.[0] || 'Incorrect password'
      toast.error(errorMessage)
    } else if (error.response?.status === 401) {
      // Unauthorized - token expired or invalid
      toast.error('Session expired. Please login again.')

      // Clear local auth state
      authStore.logout()
      router.push('/login')
    } else if (error.response?.status === 403) {
      // Forbidden
      toast.error('You do not have permission to delete this account.')
    } else if (error.message === 'No authentication token available') {
      // From your API store's check
      toast.error('You are not logged in.')
      router.push('/login')
    } else {
      // Network error or server error
      toast.error('Failed to delete account. Please try again.')
    }
  } finally {
    isDeleting.value = false
    showDeleteModal.value = false
    deletePassword.value = ''
  }
}

// Watch for authentication status changes
watch(() => authStore.isLoggedIn, (newValue) => {
  console.log('Auth status changed:', newValue)
  if (!newValue) {
    router.push('/')
  }
})

// You might want to add an immediate watcher for initial load
watch(() => authStore.currentUser, (newUser) => {
  
}, { immediate: true })
</script>

<style scoped>
img {
  max-width: 100%;
  border-radius: 0.5rem;
}

/* Ensure both buttons have exact same dimensions */
a, button {
  min-height: 44px; /* Minimum touch target size */
}

/* Remove any default link styling that might affect sizing */
a {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

/* Make sure both buttons have the same font rendering */
button, a {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

/* Optional: Add focus styles for accessibility */
button:focus, a:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>
