// tests/unit/SinglePlayerPage.spec.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import SinglePlayerPage from '@/pages/SinglePlayerModeSelect.vue'

// ───────────────────────────────────────────────
// MOCKS
// ───────────────────────────────────────────────

// auth store mockado – não usamos Pinia aqui, só devolvemos um objeto simples
let authState

vi.mock('@/stores/auth', () => {
  return {
    useAuthStore: () => authState,
  }
})

// router mockado
const routerPushMock = vi.fn()

vi.mock('vue-router', () => {
  return {
    useRouter: () => ({
      push: routerPushMock,
    }),
  }
})

// helper para montar com Pinia registado e componentes de UI stubados
function mountComponent() {
  const pinia = createPinia()

  return mount(SinglePlayerPage, {
    global: {
      plugins: [pinia],
      stubs: {
        PageContainer: {
          template: '<div><slot /></div>',
        },
        UiCard: {
          template: '<div><slot /></div>',
        },
        PrimaryButton: {
          template: '<button @click="$emit(\'click\')"><slot /></button>',
        },
        UiOptionTile: {
          props: ['active'],
          template: `
            <div
              class="option-tile"
              :data-active="active"
              @click="$emit('click')"
            >
              <slot name="title" />
              <slot name="description" />
            </div>
          `,
        },
      },
    },
  })
}

describe('SinglePlayerPage', () => {
  beforeEach(() => {
    routerPushMock.mockReset()
    // default: guest
    authState = { isLoggedIn: false }
  })

  // 1) Guest: só Practice
  it('mostra apenas o tipo Practice quando o utilizador não está autenticado', () => {
    authState = { isLoggedIn: false }

    const wrapper = mountComponent()
    const text = wrapper.text()

    expect(text).toContain('Practice')
    expect(text).not.toContain('Match')
  })

  // 2) Logado: Practice + Match
  it('mostra Practice e Match quando o utilizador está autenticado', () => {
    authState = { isLoggedIn: true }

    const wrapper = mountComponent()
    const text = wrapper.text()

    expect(text).toContain('Practice')
    expect(text).toContain('Match')
  })

  // 3) Guest: Start Game → practice / 9
  it('ao clicar em Start Game como guest começa jogo de practice com variant 9', async () => {
    authState = { isLoggedIn: false }

    const wrapper = mountComponent()

    const button = wrapper.get('button')
    await button.trigger('click')

    // pode haver mais chamadas, garantimos apenas que uma delas é a correta
    expect(routerPushMock).toHaveBeenCalled()

    const lastCallArgs = routerPushMock.mock.calls.at(-1)[0]
    expect(lastCallArgs).toEqual({
      name: 'singleplayer.game',
      params: {
        gametype: 'practice',
        variant: '9',
      },
    })
  })

  // 4) Logado: escolher Match e Start Game → match / 9
  it('ao escolher Match e clicar Start Game navega com gametype=match e variant 9', async () => {
    authState = { isLoggedIn: true }

    const wrapper = mountComponent()

    const options = wrapper.findAll('.option-tile')
    // gameTypes => [Practice, Match]
    const practiceTile = options[0]
    const matchTile = options[1]

    expect(wrapper.text()).toContain('Practice')
    expect(wrapper.text()).toContain('Match')

    await matchTile.trigger('click')

    const button = wrapper.get('button')
    await button.trigger('click')

    expect(routerPushMock).toHaveBeenCalled()

    const lastCallArgs = routerPushMock.mock.calls.at(-1)[0]
    expect(lastCallArgs).toEqual({
      name: 'singleplayer.game',
      params: {
        gametype: 'match',
        variant: '9',
      },
    })
  })
})
