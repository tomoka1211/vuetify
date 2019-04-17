// Mixins
import Localable from '../../mixins/localable'

// Utils
import { pad, createNativeLocaleFormatter } from './util'
import isDateAllowed, { AllowedDateFunction } from './util/isDateAllowed'
import { consoleWarn } from '../../util/console'
import mixins from '../../util/mixins'

// Types
import { PropValidator } from 'vue/types/options'
import { DatePickerFormatter } from './util/createNativeLocaleFormatter'
import { VNode } from 'vue'
import { wrapInArray } from '../../util/helpers'

export type DateEventColorValue = string | string[]
export type DateEvents = string[] | ((date: string) => boolean | DateEventColorValue) | Record<string, DateEventColorValue>
export type DateEventColors = DateEventColorValue | Record<string, DateEventColorValue> | ((date: string) => DateEventColorValue)
export type DatePickerMultipleFormatter = (date: string[]) => string

export interface VDateFormatters {
  year: DatePickerFormatter
  titleDate: DatePickerFormatter | DatePickerMultipleFormatter
  landscapeTitleDate: DatePickerFormatter | DatePickerMultipleFormatter
  headerDate: DatePickerFormatter
  headerMonth: DatePickerFormatter
  date: DatePickerFormatter
  month: DatePickerFormatter
  weekday: DatePickerFormatter
}

// Adds leading zero to month/day if necessary, returns 'YYYY' if type = 'year',
// 'YYYY-MM' if 'month' and 'YYYY-MM-DD' if 'date'
function sanitizeDateString (dateString: string, type: 'date' | 'month' | 'year'): string {
  const [year, month = 1, date = 1] = dateString.split('-')
  return `${year}-${pad(month)}-${pad(date)}`.substr(0, { date: 10, month: 7, year: 4 }[type])
}

export const enum PickerType {
  Year = 'year',
  Month = 'month',
  Date = 'date'
}

type DatePickerValue = string | string[] | undefined
type DatePickerType = 'date' | 'month' | 'year'

export interface VDateScopedProps {
  currentDate: String
  dateClick: Function
  monthClick: Function
  yearClick: Function
  formatters: VDateFormatters
  value: string[]
  activePicker: PickerType
  updateActivePicker: Function
  pickerDate: string
  updatePickerDate: Function
  multiple: boolean
}

export const VDateProps = {
  formatters: {
    type: Object,
    default: () => ({}),
  } as PropValidator<Partial<VDateFormatters>>,
  activePicker: String as PropValidator<DatePickerType>,
  allowedDates: Function as PropValidator<AllowedDateFunction | undefined>,
  currentDate: String,
  max: String,
  min: String,
  multiple: Boolean,
  pickerDate: String,
  reactive: Boolean,
  value: [Array, String] as PropValidator<DatePickerValue>,
  selectedItemsText: {
    type: String,
    default: '$vuetify.datePicker.itemsSelected',
  },
  type: {
    type: String,
    default: 'date',
    validator: (type: any) => ['month', 'date'].includes(type), // TODO: add year
  } as any as PropValidator<DatePickerType>,
}

export default mixins(
  Localable
/* @vue/component */
).extend({
  name: 'v-date',

  inheritAttrs: false,

  props: {
    ...VDateProps,
  },

  data () {
    const firstDate = this.value && wrapInArray(this.value)[0]
    const now = this.currentDate || new Date().toISOString()
    const nowDate = sanitizeDateString(now, 'date')
    const internalPickerDate = sanitizeDateString(this.pickerDate || firstDate || nowDate, this.type === 'month' ? 'year' : 'month')

    return {
      now: nowDate,
      internalPickerDate,
      internalDate: this.value ? wrapInArray(this.value).map(date => sanitizeDateString(date, this.type)) : [],
      internalActivePicker: (this.activePicker || this.type) as PickerType,
    }
  },

  computed: {
    lastPickedValue (): string | null {
      return this.internalDate.length ? this.internalDate[this.internalDate.length - 1] : null
    },
    computedFormatters (): VDateFormatters {
      return {
        year: this.formatters.year || createNativeLocaleFormatter(this.currentLocale, { year: 'numeric', timeZone: 'UTC' }, { length: 4 }),
        titleDate: this.formatters.titleDate || this.defaultTitleDateFormatter,
        landscapeTitleDate: this.formatters.landscapeTitleDate || this.defaultLandscapeTitleDate,
        weekday: this.formatters.weekday || createNativeLocaleFormatter(this.currentLocale, { weekday: 'narrow', timeZone: 'UTC' }) || (v => v),
        date: this.formatters.date || createNativeLocaleFormatter(this.currentLocale, { day: 'numeric', timeZone: 'UTC' }, { start: 8, length: 2 }) || (v => v),
        headerMonth: this.formatters.headerMonth || createNativeLocaleFormatter(this.currentLocale, { month: 'long', year: 'numeric', timeZone: 'UTC' }, { length: 7 }),
        month: this.formatters.month || createNativeLocaleFormatter(this.currentLocale, { month: 'short', timeZone: 'UTC' }, { start: 5, length: 2 }),
        headerDate: this.formatters.headerDate || createNativeLocaleFormatter(this.currentLocale, { year: 'numeric', timeZone: 'UTC' }, { length: 4 }),
      }
    },
    defaultTitleDateFormatter (): DatePickerMultipleFormatter {
      const titleFormats = {
        year: { year: 'numeric', timeZone: 'UTC' },
        month: { month: 'long', timeZone: 'UTC' },
        date: { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' },
      }

      const substrOptions = { date: 10, month: 7, year: 4 }

      const titleDateFormatter = createNativeLocaleFormatter(this.currentLocale, titleFormats[this.type], {
        start: 0,
        length: substrOptions[this.type],
      })

      if (this.multiple) {
        const length = this.internalDate.length
        if (length < 2) return dates => dates.length ? titleDateFormatter(dates[0]) : this.$vuetify.lang.t(this.selectedItemsText, 0)
        else return dates => this.$vuetify.lang.t(this.selectedItemsText, dates.length)
      } else {
        return dates => dates.length ? titleDateFormatter(dates[0]) : '-'
      }
    },
    defaultLandscapeTitleDate (): DatePickerMultipleFormatter {
      return (date: string[]) => this.defaultTitleDateFormatter(date)
        .replace(/([^\d\s])([\d])/g, (match, nonDigit, digit) => `${nonDigit} ${digit}`)
        .replace(', ', ',<br>')
    },
    scopedSlotProps (): VDateScopedProps {
      return {
        currentDate: this.now,
        dateClick: this.dateClick,
        monthClick: this.monthClick,
        yearClick: this.yearClick,
        formatters: this.computedFormatters,
        value: this.internalDate,
        activePicker: this.internalActivePicker,
        updateActivePicker: this.updateActivePicker,
        pickerDate: this.internalPickerDate,
        updatePickerDate: this.updatePickerDate,
        multiple: this.multiple,
      }
    },
  },

  watch: {
    internalPickerDate (val: string, prev: string) {
      // TODO: What was isReversing used for??
      // Make a ISO 8601 strings from val and prev for comparision, otherwise it will incorrectly
      // compare for example '2000-9' and '2000-10'
      // const sanitizeType = this.type === 'month' ? 'year' : 'month'
      // this.isReversing = sanitizeDateString(val, sanitizeType) < sanitizeDateString(prev, sanitizeType)
      this.$emit('update:pickerDate', val)
    },
    pickerDate (val: string | null) {
      if (val) {
        this.internalPickerDate = val
      } else if (this.lastPickedValue) {
        this.internalPickerDate = sanitizeDateString(this.lastPickedValue, 'month')
      }
    },
    value (newValue: DatePickerValue, oldValue: DatePickerValue) {
      this.checkMultipleProp()

      if (newValue) {
        const arr = wrapInArray(newValue)

        if (!arr.every(this.isDateAllowed)) return

        this.internalDate = arr

        if (!this.pickerDate && this.lastPickedValue) {
          this.internalPickerDate = sanitizeDateString(this.lastPickedValue, this.type === 'month' ? 'year' : 'month')
        }
      }
    },
    type (type: PickerType) {
      this.internalActivePicker = type

      // If we're switching type then we need to reformat current values
      // e.g. 2019-05-01 => 2019-05 when going from date to month
      if (this.internalDate.length) {
        this.internalDate = this.internalDate.map(date => sanitizeDateString(date, type)).filter(this.isDateAllowed)
      }
    },
    internalDate (internalDate: string[]) {
      this.emitInput()
    },
    activePicker (activePicker: DatePickerType) {
      this.internalActivePicker = activePicker as PickerType
    },
  },

  created () {
    this.checkMultipleProp()
  },

  methods: {
    updateActivePicker (type: PickerType) {
      this.internalActivePicker = type
      this.$emit('update:activePicker', type)
    },
    updatePickerDate (date: string) {
      this.internalPickerDate = date
    },
    emitInput () {
      if (!this.internalDate.length) return

      const value = this.multiple ? this.internalDate : this.internalDate[0]

      this.$emit('input', value)
      !this.multiple && this.$emit('change', value)
    },
    checkMultipleProp () {
      if (this.value == null) return
      const valueType = this.value.constructor.name
      const expected = this.multiple ? 'Array' : 'String'
      if (valueType !== expected) {
        consoleWarn(`Value must be ${this.multiple ? 'an' : 'a'} ${expected}, got ${valueType}`, this)
      }
    },
    isDateAllowed (value: string): boolean {
      return isDateAllowed(value, this.min, this.max, this.allowedDates)
    },
    yearClick (value: string) {
      if (this.type !== 'year') {
        this.internalPickerDate = value
        this.internalActivePicker = PickerType.Month
      } else {
        this.updateInternalDate(value)
      }
    },
    monthClick (value: string) {
      if (this.type === 'date') {
        this.internalPickerDate = value
        this.internalActivePicker = PickerType.Date
      } else {
        this.updateInternalDate(value)
      }
    },
    dateClick (value: string) {
      this.updateInternalDate(value)
    },
    updateInternalDate (value: string) {
      if (this.internalDate.includes(value)) {
        this.internalDate = this.internalDate.filter(d => d !== value)
      } else if (this.multiple) {
        this.internalDate.push(value)
        this.internalDate.sort()
      } else {
        this.internalDate = [value]
      }
    },
  },

  render (): VNode {
    return this.$scopedSlots.default!(this.scopedSlotProps) as any
  },
})
