import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import SinglePlayerPage from '@/pages/SinglePlayerModeSelect.vue'

let authState

vi.mock('@/stores/auth', () => {
  return {
    useAuthStore: () => authState,
  }
})

const routerPushMock = vi.fn()

vi.mock('vue-router', () => {
  return {
    useRouter: () => ({
      push: routerPushMock,
    }),
  }
})

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
    authState = { isLoggedIn: false }
  })

  it('mostra apenas o tipo Practice quando o utilizador não está autenticado', () => {
    authState = { isLoggedIn: false }

    const wrapper = mountComponent()
    const text = wrapper.text()

    expect(text).toContain('Practice')
    expect(text).not.toContain('Match')
  })

  it('mostra Practice e Match quando o utilizador está autenticado', () => {
    authState = { isLoggedIn: true }

    const wrapper = mountComponent()
    const text = wrapper.text()

    expect(text).toContain('Practice')
    expect(text).toContain('Match')
  })

  it('ao clicar em Start Game como guest começa jogo de practice com variant 9', async () => {
    authState = { isLoggedIn: false }

    const wrapper = mountComponent()

    const button = wrapper.get('button')
    await button.trigger('click')

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

  it('ao escolher Match e clicar Start Game navega com gametype=match e variant 9', async () => {
    authState = { isLoggedIn: true }

    const wrapper = mountComponent()

    const options = wrapper.findAll('.option-tile')
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
