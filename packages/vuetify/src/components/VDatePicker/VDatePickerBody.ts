import { VNode, VNodeChildren } from 'vue'
import mixins from '../../util/mixins'
import Colorable from '../../mixins/colorable'
import Themeable from '../../mixins/themeable'
import { DateEventColors } from './VDatePicker'
import VDatePickerHeader from './VDatePickerHeader'
import VDatePickerDateTable from './VDatePickerDateTable'
import VDatePickerMonthTable from './VDatePickerMonthTable'
import VDatePickerYears from './VDatePickerYears'
import { PickerType, DateEvents, VDateProps } from './VDate'
import { PropValidator } from 'vue/types/options'
import { pad } from './util'
import Localable from '../../mixins/localable'

// Adds leading zero to month/day if necessary, returns 'YYYY' if type = 'year',
// 'YYYY-MM' if 'month' and 'YYYY-MM-DD' if 'date'
function sanitizeDateString (dateString: string, type: 'date' | 'month' | 'year'): string {
  const [year, month = 1, date = 1] = dateString.split('-')
  return `${year}-${pad(month)}-${pad(date)}`.substr(0, { date: 10, month: 7, year: 4 }[type])
}

export const VDatePickerBodyProps = {
  disabled: Boolean,
  events: {
    type: [Array, Function, Object],
    default: () => null,
  } as any as PropValidator<DateEvents>,
  eventColor: {
    type: [Array, Function, Object, String],
    default: () => 'warning',
  } as any as PropValidator<DateEventColors>,
  nextIcon: {
    type: String,
    default: '$vuetify.icons.next',
  },
  pickerDate: String,
  prevIcon: {
    type: String,
    default: '$vuetify.icons.prev',
  },
  firstDayOfWeek: {
    type: [String, Number],
    default: 0,
  },
  hideCurrentDate: Boolean,
  reactive: Boolean,
  readonly: Boolean,
  scrollable: Boolean,
  showWeekNumbers: Boolean,
  yearIcon: String,
}

export default mixins(
  Colorable,
  Themeable,
  Localable
).extend({
  name: 'v-date-picker-body',

  inheritAttrs: false,

  props: {
    ...VDatePickerBodyProps,
    ...VDateProps,
    value: Array as PropValidator<string[]>,
    activePicker: String as PropValidator<PickerType>,
  },

  computed: {
    minMonth (): string | null {
      return this.min ? sanitizeDateString(this.min, 'month') : null
    },
    maxMonth (): string | null {
      return this.max ? sanitizeDateString(this.max, 'month') : null
    },
    minYear (): string | null {
      return this.min ? sanitizeDateString(this.min, 'year') : null
    },
    maxYear (): string | null {
      return this.max ? sanitizeDateString(this.max, 'year') : null
    },
    tableYear (): number {
      return this.pickerDate ? parseInt(this.pickerDate.split('-')[0], 10) : 0
    },
    tableMonth (): number {
      return this.pickerDate ? parseInt(this.pickerDate.split('-')[1], 10) - 1 : 0
    },
    isDatePicker (): boolean {
      return this.activePicker === PickerType.Date
    },
    isMonthPicker (): boolean {
      return this.activePicker === PickerType.Month
    },
    currentMonth (): string | null {
      return sanitizeDateString(this.currentDate, 'month')
    },
    selectedMonths (): string | string[] | undefined {
      // if (!this.value || !this.value.length || this.activePicker === PickerType.Month) {
      //   return this.value
      // } else if (this.multiple) {
      //   return (this.value as string[]).map(val => val.substr(0, 7))
      // } else {
      //   return (this.value as string).substr(0, 7)
      // }
      return this.value.map(val => val.substr(0, 7))
    },
    selectedYears (): string[] {
      return this.value.map(date => date.substr(0, 4))
    },
  },

  methods: {
    genTableHeader () {
      return this.$createElement(VDatePickerHeader, {
        props: {
          nextIcon: this.nextIcon,
          color: this.color,
          dark: this.dark,
          disabled: this.disabled,
          yearFormat: this.formatters.year,
          monthFormat: this.formatters.headerMonth,
          light: this.light,
          locale: this.locale,
          min: this.isDatePicker ? this.minMonth : this.minYear,
          max: this.isDatePicker ? this.maxMonth : this.maxYear,
          prevIcon: this.prevIcon,
          readonly: this.readonly,
          activePicker: this.activePicker,
          value: this.pickerDate,
        },
        on: {
          'update:activePicker': (picker: PickerType) => this.$emit('update:activePicker', picker/* this.isDateType ? PickerType.Month : PickerType.Year */),
          'update:pickerDate': (date: string) => this.$emit('update:pickerDate', date),
        },
      })
    },
    genDateTable () {
      return this.$createElement(VDatePickerDateTable, {
        props: {
          allowedDates: this.allowedDates,
          color: this.color,
          currentDate: !this.hideCurrentDate ? this.currentDate : null,
          dark: this.dark,
          disabled: this.disabled,
          events: this.events,
          eventColor: this.eventColor,
          firstDayOfWeek: this.firstDayOfWeek,
          weekdayFormat: this.formatters.weekday,
          dateFormat: this.formatters.date,
          light: this.light,
          locale: this.locale,
          min: this.min,
          max: this.max,
          readonly: this.readonly,
          scrollable: this.scrollable,
          showWeekNumbers: this.showWeekNumbers,
          pickerDate: this.pickerDate,
          value: this.value,
        },
        on: {
          input: (date: number) => this.$emit('update:date', date),
          'update:pickerDate': (value: string) => this.$emit('update:pickerDate', value),
          'click:date': (value: string) => this.$emit('click:date', value),
          'dblclick:date': (value: string) => this.$emit('dblclick:date', value),
        },
      })
    },
    genMonthTable () {
      return this.$createElement(VDatePickerMonthTable, {
        props: {
          allowedDates: this.allowedDates,
          color: this.color,
          currentDate: !this.hideCurrentDate ? this.currentMonth : null,
          dark: this.dark,
          disabled: this.disabled,
          events: this.events,
          eventColor: this.eventColor,
          dateFormat: this.formatters.month,
          light: this.light,
          locale: this.locale,
          min: this.minMonth,
          max: this.maxMonth,
          readonly: this.readonly,
          scrollable: this.scrollable,
          value: this.selectedMonths,
          pickerDate: this.pickerDate,
        },
        on: {
          'update:month': (month: number) => this.$emit('update:month', month),
          'update:pickerDate': (value: string) => this.$emit('update:pickerDate', value),
          'click:month': (value: string) => this.$emit('click:month', value),
          'dblclick:month': (value: string) => this.$emit('dblclick:month', value),
        },
      })
    },
    genYears () {
      return this.$createElement(VDatePickerYears, {
        props: {
          color: this.color,
          format: this.formatters.year,
          locale: this.locale,
          min: this.minYear,
          max: this.maxYear,
          value: this.selectedYears,
        },
        on: {
          input: (year: number) => this.$emit('update:year', year),
        },
      })
    },
    genMonths () {
      return [
        this.genTableHeader(),
        this.genMonthTable(),
      ]
    },
    genDates () {
      return [
        this.genTableHeader(),
        this.genDateTable(),
      ]
    },
  },

  render (h): VNode {
    let children: VNodeChildren = []

    switch (this.activePicker) {
      case PickerType.Year: children = [this.genYears()]; break
      case PickerType.Month: children = this.genMonths(); break
      case PickerType.Date: children = this.genDates(); break
    }

    return h('div', children)
  },
})
