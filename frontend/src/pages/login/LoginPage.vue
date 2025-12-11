<template>
    <div class="flex min-h-screen items-center justify-center bg-gray-200 px-4 py-12 sm:px-6 lg:px-8">
        <div class="w-full max-w-md space-y-8">

            <div class="bg-white p-8 rounded-xl shadow-lg">
                <h2 class="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Sign in to your account
                </h2>
                <p class="mt-2 text-center text-sm text-gray-600">
                    Enter your credentials to access your account
                </p>

                <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">

                    <div class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                                Email address
                            </label>
                            <Input id="email" v-model="formData.email" type="email" required
                                placeholder="you@example.com" />
                        </div>

                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <Input id="password" v-model="formData.password" type="password" required
                                placeholder="••••••••" />
                        </div>
                    </div>

                    <div>
                        <Button type="submit" class="w-full"> Sign in </Button>
                    </div>

                    <div class="text-center text-sm mt-4">
                        <span class="text-gray-600">Don't have an account?</span>
                        <RouterLink :to="{ name: 'register' }" class="ml-1 text-blue-600 hover:underline">
                            Sign up
                        </RouterLink>
                    </div>
                </form>
            </div>

        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { useAuthStore } from '@/stores/auth'
import { RouterLink, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { extractErrorMessage } from '@/utils/errorHandler.js'

const authStore = useAuthStore()
const router = useRouter()

const formData = ref({
    email: '',
    password: ''
})


const handleSubmit = async () => {
    const toastId = toast.loading('Logging in...')
    try {
        await authStore.login(formData.value)
        toast.success('Login Successful!', { id: toastId })
        router.push('/')
    } catch (error) {
        const errorMessage = extractErrorMessage(error)
        toast.dismiss(toastId)
        toast.error(errorMessage)
        console.error('Login failed:', error)
    }
}
</script>
