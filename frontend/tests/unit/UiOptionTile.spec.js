import { mount } from '@vue/test-utils'
import UiOptionTile from '@/components/ui/UiOptionTile.vue'
import { describe, it, expect } from 'vitest'

describe('UiOptionTile.vue', () => {
  it('mostra o título e a descrição', () => {
    const wrapper = mount(UiOptionTile, {
      slots: {
        title: 'Practice',
        description: 'Modo casual'
      }
    })

    expect(wrapper.text()).toContain('Practice')
    expect(wrapper.text()).toContain('Modo casual')
  })

  it('emite o evento click quando clicado', async () => {
    const wrapper = mount(UiOptionTile)
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
  })

  it('usa a classe active quando prop active=true', () => {
    const wrapper = mount(UiOptionTile, {
      props: {
        active: true
      }
    })

    expect(wrapper.classes()).toContain('option-tile--active')
  })
})
