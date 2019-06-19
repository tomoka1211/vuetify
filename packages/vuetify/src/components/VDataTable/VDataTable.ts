import './VDataTable.sass'

// Types
import { VNode, VNodeChildrenArrayContents, VNodeChildren } from 'vue'
import { PropValidator } from 'vue/types/options'
import { DataProps, DataPaginaton, DataOptions } from '../VData/VData'
import { TableHeader } from './mixins/header'

// Components
import { VData } from '../VData'
import { VDataFooter, VDataIterator } from '../VDataIterator'
import VBtn from '../VBtn'
import VDataTableHeader from './VDataTableHeader'
import VVirtualTable from './VVirtualTable'
import VIcon from '../VIcon'
import VProgressLinear from '../VProgressLinear'
import VRow from './VRow'
import VRowGroup from './VRowGroup'
import VSimpleCheckbox from '../VCheckbox/VSimpleCheckbox'
import VSimpleTable from './VSimpleTable'
import VMobileRow from './VMobileRow'
import ripple from '../../directives/ripple'

// Helpers
import { deepEqual, getObjectValueByPath, compareFn, getPrefixedScopedSlots, getSlot, defaultFilter } from '../../util/helpers'
import { breaking } from '../../util/console'

function filterFn (item: any, search: string | null) {
  return (header: TableHeader) => {
    const value = getObjectValueByPath(item, header.value)
    return header.filter ? header.filter(value, search, item) : defaultFilter(value, search)
  }
}

function searchTableItems (
  items: any[],
  search: string | null,
  headersWithCustomFilters: TableHeader[],
  headersWithoutCustomFilters: TableHeader[]
) {
  let filtered = items
  search = typeof search === 'string' ? search.trim() : null
  if (search) {
    filtered = items.filter(item => headersWithoutCustomFilters.some(filterFn(item, search)))
  }

  return filtered.filter(item => headersWithCustomFilters.every(filterFn(item, search)))
}

/* @vue/component */
export default VDataIterator.extend({
  name: 'v-data-table',

  // https://github.com/vuejs/vue/issues/6872
  directives: {
    ripple,
  },

  props: {
    headers: {
      type: Array,
    } as PropValidator<TableHeader[]>,
    showSelect: Boolean,
    showExpand: Boolean,
    showGroupBy: Boolean,
    virtualRows: Boolean,
    mobileBreakpoint: {
      type: Number,
      default: 600,
    },
    height: [Number, String],
    hideDefaultHeader: Boolean,
    caption: String,
    dense: Boolean,
    headerProps: Object,
    calculateWidths: Boolean,
    fixedHeader: Boolean,
    headersLength: Number,
    expandIcon: {
      type: String,
      default: '$vuetify.icons.expand',
    },
    customFilter: {
      type: Function,
      default: searchTableItems,
    } as PropValidator<(items: any[], search: string, exclusiveHeaders: TableHeader[], nonExclusiveHeaders: TableHeader[]) => any[]>,
  },

  data () {
    return {
      internalGroupBy: [] as string[],
      openCache: {} as { [key: string]: boolean },
      widths: [] as number[],
    }
  },

  computed: {
    computedHeaders (): TableHeader[] {
      if (!this.headers) return []
      const headers = this.headers.filter(h => h.value === undefined || !this.internalGroupBy.find(v => v === h.value))
      const defaultHeader = { text: '', sortable: false, width: '1px' }

      if (this.showSelect) {
        const index = headers.findIndex(h => h.value === 'data-table-select')
        if (index < 0) headers.unshift({ ...defaultHeader, value: 'data-table-select' })
        else headers.splice(index, 1, { ...defaultHeader, ...headers[index] })
      }

      if (this.showExpand) {
        const index = headers.findIndex(h => h.value === 'data-table-expand')
        if (index < 0) headers.unshift({ ...defaultHeader, value: 'data-table-expand' })
        else headers.splice(index, 1, { ...defaultHeader, ...headers[index] })
      }

      return headers
    },
    computedHeadersLength (): number {
      return this.headersLength || this.computedHeaders.length
    },
    isMobile (): boolean {
      return this.$vuetify.breakpoint.width < this.mobileBreakpoint
    },
    columnSorters (): Record<string, compareFn> {
      return this.computedHeaders.reduce<Record<string, compareFn>>((acc, header) => {
        if (header.sort) acc[header.value] = header.sort
        return acc
      }, {})
    },
    headersWithCustomFilters (): TableHeader[] {
      return this.computedHeaders.filter(header => header.filter)
    },
    headersWithoutCustomFilters (): TableHeader[] {
      return this.computedHeaders.filter(header => !header.filter)
    },
  },

  created () {
    const breakingProps = [
      ['sort-icon', 'header-props.sort-icon'],
      ['hide-headers', 'hide-default-header'],
      ['select-all', 'show-select'],
    ]

    /* istanbul ignore next */
    breakingProps.forEach(([original, replacement]) => {
      if (this.$attrs.hasOwnProperty(original)) breaking(original, replacement, this)
    })
  },

  mounted () {
    // if ((!this.sortBy || !this.sortBy.length) && (!this.options.sortBy || !this.options.sortBy.length)) {
    //   const firstSortable = this.headers.find(h => !('sortable' in h) || !!h.sortable)
    //   if (firstSortable) this.updateOptions({ sortBy: [firstSortable.value], sortDesc: [false] })
    // }

    if (this.calculateWidths) {
      window.addEventListener('resize', this.calcWidths)
      this.calcWidths()
    }
  },

  beforeDestroy () {
    if (this.calculateWidths) {
      window.removeEventListener('resize', this.calcWidths)
    }
  },

  methods: {
    calcWidths () {
      this.widths = Array.from(this.$el.querySelectorAll('th')).map(e => e.clientWidth)
    },
    customFilterWithColumns (items: any[], search: string) {
      return this.customFilter(items, search, this.headersWithCustomFilters, this.headersWithoutCustomFilters)
    },
    customSortWithHeaders (items: any[], sortBy: string[], sortDesc: boolean[], locale: string) {
      return this.customSort(items, sortBy, sortDesc, locale, this.columnSorters)
    },
    createItemProps (item: any) {
      const props = VDataIterator.options.methods.createItemProps.call(this, item)

      return Object.assign(props, { headers: this.computedHeaders })
    },
    genCaption (props: DataProps) {
      if (this.caption) return [this.$createElement('caption', [this.caption])]

      return getSlot(this, 'caption', props, true)
    },
    genColgroup (props: DataProps) {
      return this.$createElement('colgroup', this.computedHeaders.map(header => {
        return this.$createElement('col', {
          class: {
            'divider': header.divider,
          },
          style: {
            width: header.width,
          },
        })
      }))
    },
    genLoading () {
      const progress = this.$slots['progress'] ? this.$slots.progress : this.$createElement(VProgressLinear, {
        props: {
          color: this.loading === true ? 'primary' : this.loading,
          height: 2,
          indeterminate: true,
        },
      })

      const th = this.$createElement('th', {
        staticClass: 'column',
        attrs: {
          colspan: this.computedHeadersLength,
        },
      }, [progress])

      const tr = this.$createElement('tr', {
        staticClass: 'v-data-table__progress',
      }, [th])

      return this.$createElement('thead', [tr])
    },
    genHeaders (props: DataProps) {
      const data = {
        props: {
          ...this.headerProps,
          headers: this.computedHeaders,
          options: props.options,
          mobile: this.isMobile,
          showGroupBy: this.showGroupBy,
          someItems: this.someItems,
          everyItem: this.everyItem,
          singleSelect: this.singleSelect,
        },
        on: {
          sort: props.sort,
          group: props.group,
          'toggle-select-all': this.toggleSelectAll,
        },
      }

      const children: VNodeChildrenArrayContents = [getSlot(this, 'header', data)]

      if (!this.hideDefaultHeader) {
        const scopedSlots = getPrefixedScopedSlots('header.', this.$scopedSlots)
        children.push(this.$createElement(VDataTableHeader, {
          ...data,
          scopedSlots,
        }))
      }

      if (this.loading) children.push(this.genLoading())

      return children
    },
    genEmptyWrapper (content: VNodeChildrenArrayContents) {
      return this.$createElement('tr', [
        this.$createElement('td', {
          attrs: {
            colspan: this.computedHeadersLength,
          },
        }, content),
      ])
    },
    genItems (items: any[], props: DataProps) {
      const empty = this.genEmpty(props.pagination.itemsLength)
      if (empty) return [empty]

      return props.groupedItems
        ? this.genGroupedRows(props.groupedItems, props)
        : this.genRows(items, props)
    },
    genGroupedRows (groupedItems: Record<string, any[]>, props: DataProps) {
      const groups = Object.keys(groupedItems || {})

      return groups.map(group => {
        if (!this.openCache.hasOwnProperty(group)) this.$set(this.openCache, group, true)

        if (this.$scopedSlots.group) {
          return this.$scopedSlots.group({
            group,
            options: props.options,
            items: groupedItems![group],
            headers: this.computedHeaders,
          })
        } else {
          return this.genDefaultGroupedRow(group, groupedItems[group], props)
        }
      })
    },
    genDefaultGroupedRow (group: string, items: any[], props: DataProps) {
      const isOpen = !!this.openCache[group]
      const children: VNodeChildren = [
        this.$createElement('template', { slot: 'row.content' }, this.genDefaultRows(items, props)),
      ]

      if (this.$scopedSlots['group.header']) {
        children.unshift(this.$createElement('template', { slot: 'column.header' }, [
          this.$scopedSlots['group.header']!({ group, groupBy: props.options.groupBy, items, headers: this.computedHeaders }),
        ]))
      } else {
        const toggle = this.$createElement(VBtn, {
          staticClass: 'ma-0',
          props: {
            icon: true,
            small: true,
          },
          on: {
            click: () => this.$set(this.openCache, group, !this.openCache[group]),
          },
        }, [this.$createElement(VIcon, [isOpen ? 'remove' : 'add'])])

        const remove = this.$createElement(VBtn, {
          staticClass: 'ma-0',
          props: {
            icon: true,
            small: true,
          },
          on: {
            click: () => props.updateOptions({ groupBy: [], groupDesc: [] }),
          },
        }, [this.$createElement(VIcon, ['close'])])

        const column = this.$createElement('td', {
          staticClass: 'text-xs-start',
          attrs: {
            colspan: this.computedHeadersLength,
          },
        }, [toggle, `${props.options.groupBy[0]}: ${group}`, remove])

        children.unshift(this.$createElement('template', { slot: 'column.header' }, [column]))
      }

      if (this.$scopedSlots['group.summary']) {
        children.push(this.$createElement('template', { slot: 'column.summary' }, [
          this.$scopedSlots['group.summary']!({ group, groupBy: props.options.groupBy, items, headers: this.computedHeaders }),
        ]))
      }

      return this.$createElement(VRowGroup, {
        key: group,
        props: {
          value: isOpen,
        },
      }, children)
    },
    genRows (items: any[], props: DataProps) {
      return this.$scopedSlots.item ? this.genScopedRows(items, props) : this.genDefaultRows(items, props)
    },
    genScopedRows (items: any[], props: DataProps) {
      const rows = []

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        rows.push(this.$scopedSlots.item!(this.createItemProps(item)))
        if (this.isExpanded(item)) {
          rows.push(this.$scopedSlots['expanded-item']!({ item, headers: this.computedHeaders }))
        }
      }

      return rows
    },
    genDefaultRows (items: any[], props: DataProps) {
      return this.$scopedSlots['expanded-item']
        ? items.map(item => this.genDefaultExpandedRow(item))
        : items.map(item => this.genDefaultSimpleRow(item))
    },
    genDefaultExpandedRow (item: any): VNode {
      const isExpanded = this.isExpanded(item)
      const headerRow = this.genDefaultSimpleRow(item, isExpanded ? 'expanded expanded__row' : null)
      const expandedRow = this.$createElement('tr', {
        staticClass: 'expanded expanded__content',
      }, [this.$scopedSlots['expanded-item']!({ item, headers: this.computedHeaders })])

      return this.$createElement(VRowGroup, {
        props: {
          value: isExpanded,
        },
      }, [
        this.$createElement('template', { slot: 'row.header' }, [headerRow]),
        this.$createElement('template', { slot: 'row.content' }, [expandedRow]),
      ])
    },
    genDefaultSimpleRow (item: any, classes: string | string[] | object | null = null): VNode {
      const scopedSlots = getPrefixedScopedSlots('item.', this.$scopedSlots)

      if (this.showSelect) {
        const data = {
          item,
          props: {
            value: this.isSelected(item),
          },
          on: {
            input: (v: any) => this.select(item, v),
          },
        }

        const slot = scopedSlots['data-table-select']
        scopedSlots['data-table-select'] = slot ? () => slot(data) : () => this.$createElement(VSimpleCheckbox, {
          staticClass: 'v-data-table__checkbox',
          ...data,
        })
      }

      const expanded = this.isExpanded(item)

      if (this.showExpand) {
        const data = {
          item,
          props: {
            expanded,
          },
          on: {
            click: () => this.expand(item, !expanded),
          },
        }

        const slot = scopedSlots['data-table-expand']
        scopedSlots['data-table-expand'] = slot ? () => slot(data) : () => this.$createElement(VIcon, {
          staticClass: 'v-data-table__expand-icon',
          class: {
            'v-data-table__expand-icon--active': expanded,
          },
          ...data,
        }, [this.expandIcon])
      }

      return this.$createElement(this.isMobile ? VMobileRow : VRow, {
        key: getObjectValueByPath(item, this.itemKey),
        class: classes,
        props: {
          headers: this.computedHeaders,
          item,
          rtl: this.$vuetify.rtl,
        },
        scopedSlots,
      })
    },
    genBody (props: DataProps): VNode | string | VNodeChildren {
      const data = {
        ...props,
        headers: this.computedHeaders,
      }

      if (this.$scopedSlots.body) {
        return this.$scopedSlots.body!(data)
      }

      return this.$createElement('tbody', [
        getSlot(this, 'body.prepend', data, true),
        this.genItems(props.items, props),
        getSlot(this, 'body.append', data, true),
      ])
    },
    genFooters (props: DataProps) {
      const data = {
        props: {
          options: props.options,
          pagination: props.pagination,
          itemsPerPageText: '$vuetify.dataTable.itemsPerPageText',
          ...this.footerProps,
        },
        on: {
          'update:options': (value: any) => props.updateOptions(value),
        },
        widths: this.widths,
        headers: this.computedHeaders,
      }

      const children: VNodeChildren = [
        getSlot(this, 'footer', data, true),
      ]

      if (!this.hideDefaultFooter) {
        children.push(this.$createElement(VDataFooter, data))
      }

      return children
    },
    genDefaultScopedSlot (props: DataProps): VNode {
      const simpleProps = {
        height: this.height,
        fixedHeader: this.fixedHeader,
        dense: this.dense,
      }

      if (this.virtualRows) {
        return this.$createElement(VVirtualTable, {
          props: Object.assign(simpleProps, {
            items: props.items,
            height: this.height,
            rowHeight: this.dense ? 24 : 48,
            headerHeight: this.dense ? 32 : 48,
            // TODO: expose rest of props from virtual table?
          }),
          scopedSlots: {
            items: ({ items }) => this.genItems(items, props) as any,
          },
        }, [
          this.proxySlot('body.before', [this.genCaption(props), this.genHeaders(props)]),
          this.proxySlot('bottom', this.genFooters(props)),
        ])
      }

      return this.$createElement(VSimpleTable, {
        props: simpleProps,
      }, [
        this.proxySlot('top', getSlot(this, 'top', props, true)),
        this.genCaption(props),
        this.genColgroup(props),
        this.genHeaders(props),
        this.genBody(props),
        this.proxySlot('bottom', this.genFooters(props)),
      ])
    },
    proxySlot (slot: string, content: VNodeChildren) {
      return this.$createElement('template', { slot }, content)
    },
  },

  render (): VNode {
    return this.$createElement(VData, {
      props: {
        ...this.$props,
        customFilter: this.customFilterWithColumns,
        customSort: this.customSortWithHeaders,
      },
      on: {
        'update:options': (v: DataOptions, old: DataOptions) => {
          this.internalGroupBy = v.groupBy || []
          !deepEqual(v, old) && this.$emit('update:options', v)
        },
        'update:page': (v: number) => this.$emit('update:page', v),
        'update:items-per-page': (v: number) => this.$emit('update:items-per-page', v),
        'update:sort-by': (v: string | string[]) => this.$emit('update:sort-by', v),
        'update:sort-desc': (v: boolean | boolean[]) => this.$emit('update:sort-desc', v),
        'update:group-by': (v: string | string[]) => this.$emit('update:group-by', v),
        'update:group-desc': (v: boolean | boolean[]) => this.$emit('update:group-desc', v),
        'pagination': (v: DataPaginaton, old: DataPaginaton) => !deepEqual(v, old) && this.$emit('pagination', v),
        'current-items': (v: any[]) => {
          this.internalCurrentItems = v
          this.$emit('current-items', v)
        },
        'page-count': (v: number) => this.$emit('page-count', v),
      },
      scopedSlots: {
        default: this.genDefaultScopedSlot as any,
      },
    })
  },
})
