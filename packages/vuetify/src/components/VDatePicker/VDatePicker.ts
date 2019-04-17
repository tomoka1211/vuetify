// Components
import VDatePickerTitle from './VDatePickerTitle'
import VDatePickerBody, { VDatePickerBodyProps } from './VDatePickerBody'

// Mixins
import Localable from '../../mixins/localable'

// Types
import Vue, { VNode } from 'vue'
import VPicker from '../VPicker'
import VDate, { PickerType, VDateScopedProps, VDateProps } from './VDate'

export type DateEventColorValue = string | string[]
export type DateEvents = string[] | ((date: string) => boolean | DateEventColorValue) | Record<string, DateEventColorValue>
export type DateEventColors = DateEventColorValue | Record<string, DateEventColorValue> | ((date: string) => DateEventColorValue)

export default Vue.extend({
  name: 'v-date-picker',

  inheritAttrs: false,

  props: {
    ...VPicker.options.props,
    ...Localable.options.props,
    ...VDateProps,
    ...VDatePickerBodyProps,
  },

  methods: {
    genPickerTitle (props: VDateScopedProps) {
      return this.$createElement(VDatePickerTitle, {
        props: {
          dateFormat: props.formatters.titleDate,
          yearFormat: props.formatters.year,
          value: props.value,
          disabled: this.disabled,
          readonly: this.readonly,
          selectingYear: props.activePicker === PickerType.Year,
          yearIcon: this.yearIcon,
        },
        slot: 'title',
        on: {
          'update:activePicker': props.updateActivePicker,
        },
      })
    },
    genPickerBody (props: VDateScopedProps) {
      return this.$createElement(VDatePickerBody, {
        props: {
          ...this.$props,
          ...props,
        },
        on: {
          'update:year': props.yearClick,
          'update:month': props.monthClick,
          'update:date': props.dateClick,
          'update:activePicker': props.updateActivePicker,
          'update:pickerDate': props.updatePickerDate,
          'click:date': (value: string) => this.$emit('click:date', value),
          'dblclick:date': (value: string) => this.$emit('dblclick:date', value),
          'click:month': (value: string) => this.$emit('click:month', value),
          'dblclick:month': (value: string) => this.$emit('dblclick:month', value),
        },
      })
    },
    genPicker (props: VDateScopedProps) {
      return this.$createElement(VPicker, {
        staticClass: 'v-picker--date',
        props: this.$props,
      }, [
        this.genPickerTitle(props),
        this.genPickerBody(props),
        this.$slots.default && this.$createElement('template', { slot: 'actions' }, this.$slots.default),
      ])
    },
  },

  render (h): VNode {
    return h(VDate, {
      props: this.$props,
      scopedSlots: {
        default: props => this.genPicker(props),
      },
      on: {
        input: (date: string | string[]) => this.$emit('input', date),
        change: (date: string | string[]) => this.$emit('change', date),
        'update:activePicker': (activePicker: PickerType) => this.$emit('update:activePicker', activePicker),
        'update:pickerDate': (date: string) => this.$emit('update:pickerDate', date),
      },
    })
  },
})
