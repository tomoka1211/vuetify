import './VDatePickerTitle.sass'

// Components
import VIcon from '../VIcon'
import { genPickerButton } from '../VPicker/VPicker'

// Types
import Vue, { VNode } from 'vue'
import { PropValidator } from 'vue/types/options'
import { DatePickerFormatter } from './util/createNativeLocaleFormatter'
import { PickerType, DatePickerMultipleFormatter } from './VDate'

export default Vue.extend({
  name: 'v-date-picker-title',

  inheritAttrs: false,

  props: {
    dateFormat: Function as PropValidator<DatePickerMultipleFormatter>,
    yearFormat: Function as PropValidator<DatePickerFormatter>,
    value: Array as PropValidator<string[]>,
    disabled: Boolean,
    readonly: Boolean,
    selectingYear: Boolean,
    landscape: Boolean,
    yearIcon: {
      type: String,
    },
  },

  data: () => ({
    isReversing: false,
  }),

  computed: {
    computedTransition (): string {
      return this.isReversing ? 'picker-reverse-transition' : 'picker-transition'
    },
    date (): string {
      return this.dateFormat(this.value)
    },
    year (): string {
      return this.value && this.value.length ? this.yearFormat(this.value[0]) : '-'
    },
    key (): string | undefined {
      return this.value && this.value.length ? this.value[0] : undefined
    },
  },

  watch: {
    value (val: string[], prev: string[]) {
      let isReversing = false

      if (val && val.length > 1 && prev) isReversing = val.length < prev.length
      else if (val && prev) isReversing = val[0] < prev[0]

      this.isReversing = isReversing
    },
  },

  methods: {
    genYearIcon (): VNode {
      return this.$createElement(VIcon, {
        props: {
          small: true,
          dark: true,
        },
      }, this.yearIcon)
    },
    genYearBtn (): VNode {
      return genPickerButton(
        this.$createElement,
        [
          String(this.year),
          this.yearIcon ? this.genYearIcon() : null,
        ],
        () => this.$emit('update:activePicker', PickerType.Year),
        this.selectingYear === true,
        false,
        'v-date-picker-title__year'
      )
    },
    genTitleText (): VNode {
      return this.$createElement('transition', {
        props: {
          name: this.computedTransition,
        },
      }, [
        this.$createElement('div', {
          domProps: { innerHTML: this.date || '&nbsp;' },
          key: this.key,
        }),
      ])
    },
    genTitleDate (): VNode {
      return genPickerButton(
        this.$createElement,
        [this.genTitleText()],
        () => this.$emit('update:activePicker', PickerType.Date),
        this.selectingYear === false,
        false,
        'v-date-picker-title__date'
      )
    },
  },

  render (h): VNode {
    return h('div', {
      staticClass: 'v-date-picker-title',
      'class': {
        'v-date-picker-title--disabled': this.disabled,
      },
    }, [
      this.genYearBtn(),
      this.genTitleDate(),
    ])
  },
})
