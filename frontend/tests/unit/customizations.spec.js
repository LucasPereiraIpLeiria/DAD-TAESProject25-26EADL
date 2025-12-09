// tests/unit/customizations.spec.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// 🔹 mocks hoisted (seguindo a regra do Vitest)
const mocks = vi.hoisted(() => {
  const baseUser = {
    id: 1,
    coins_balance: 100,
    photo_avatar_filename: null,
    custom: {
      avatars: { owned: ['default'], selected: 'default' },
      decks: { owned: ['default'], selected: 'default' },
    },
  }

  return {
    baseUser,
    authStore: {
      currentUser: { ...baseUser },
      isLoggedIn: true,
      refreshUser: vi.fn(),
    },
    apiStore: {
      patchSelectCustomization: vi.fn(),
      postPurchaseCustomization: vi.fn(),
      postDebugResetCustomizations: vi.fn(),
    },
  }
})

// 🔹 mocks das stores
vi.mock('@/stores/auth', () => {
  return {
    useAuthStore: () => mocks.authStore,
  }
})

vi.mock('@/stores/api', () => {
  return {
    useAPIStore: () => mocks.apiStore,
  }
})

// 🔹 mock do vue-sonner (sem precisar de capturar as funções)
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// 🔹 mock do router
vi.mock('@/router/index.js', () => ({
  default: {
    push: vi.fn(),
  },
}))

// 🔹 componentes filhos como stubs simples
vi.mock('@/components/customization/CustomizationCard.vue', () => ({
  default: {
    name: 'CustomizationCard',
    template: '<div></div>',
  },
}))

vi.mock('@/components/customization/CustomizationPurchaseDialog.vue', () => ({
  default: {
    name: 'CustomizationPurchaseDialog',
    template: '<div></div>',
  },
}))

// 🔹 importa o componente real (ajusta o caminho se for diferente)
import CustomizationsPage from '@/pages/CustomizationsPage.vue'

describe('CustomizationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // reset auth store
    mocks.authStore.currentUser = { ...mocks.baseUser }
    mocks.authStore.isLoggedIn = true
    mocks.authStore.refreshUser = vi.fn()

    // reset api store
    const updatedUser = {
      ...mocks.baseUser,
      custom: {
        ...mocks.baseUser.custom,
        avatars: {
          owned: ['default', 'mage'],
          selected: 'mage',
        },
        decks: mocks.baseUser.custom.decks,
      },
    }

    mocks.apiStore.patchSelectCustomization.mockResolvedValue({
      data: { user: { ...mocks.baseUser } },
    })

    mocks.apiStore.postPurchaseCustomization.mockResolvedValue({
      data: { user: updatedUser },
    })

    mocks.apiStore.postDebugResetCustomizations.mockResolvedValue({})
  })

  it('selecionar um avatar grátis chama patchSelectCustomization sem compra', async () => {
    const wrapper = mount(CustomizationsPage)
    const vm = wrapper.vm

    await vm.handleSelect('avatar', {
      key: 'default',
      label: 'Profile Pic',
      price: 0,
    })

    expect(mocks.apiStore.patchSelectCustomization).toHaveBeenCalledTimes(1)
    expect(mocks.apiStore.patchSelectCustomization).toHaveBeenCalledWith({
      type: 'avatar',
      item: 'default',
    })

    expect(mocks.apiStore.postPurchaseCustomization).not.toHaveBeenCalled()
  })

  it('comprar um avatar pago chama postPurchaseCustomization', async () => {
    const wrapper = mount(CustomizationsPage)
    const vm = wrapper.vm

    const paidAvatar = {
      key: 'mage',
      label: 'Mage',
      price: 20,
    }

    // simula fluxo “já confirmado no modal”
    await vm.handleBuy('avatar', paidAvatar, { skipConfirm: true })

    expect(mocks.apiStore.postPurchaseCustomization).toHaveBeenCalledTimes(1)
    expect(mocks.apiStore.postPurchaseCustomization).toHaveBeenCalledWith({
      type: 'avatar',
      item: 'mage',
    })

    // confirma que o currentUser foi atualizado em memória
    expect(mocks.authStore.currentUser.custom.avatars.owned).toContain('mage')
    expect(mocks.authStore.currentUser.custom.avatars.selected).toBe('mage')
  })
})
