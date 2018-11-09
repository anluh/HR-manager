<template>
    <div :class="typeaheadState" class="autocomplete">
        <div class="input-field" ref="toggle" @mousedown.prevent="toggle">
            <input type="text" id="search" class="typeahead__search" ref="search"
                   v-model="search"
                   @focus="onFocus"
                   @blur="onBlur"
                   @keydown.esc="onEscape"
                   @keydown.down="onDownKey"
                   @keydown.up="onUpKey"
                   @keydown.enter="onEnterKey"
            >
            <label class="typeahead__text" for="search" ref="text">{{displayText}}</label>
        </div>
        <ul class="typeahead__list" ref="list" v-if="open">
            <li class="typeahead__item" v-for="(option, index) in filteredOptions" :key="index">
                <a class="typeahead__link" @mousedown.prevent="select(option)"
                   :class="[selectIndex === index ? 'typeahead__active':'']"
                >
                    {{option.Name}}
                </a>
            </li>
        </ul>
    </div>
</template>
<script type="text/javascript">
  export default {
    props: {
      options: {
        type: Array,
        default() {
          return []
        }
      },
      value: {
        default: null
      }
    },
    data() {
      return {
        open: false,
        selectIndex: 0,
        displayText: 'Name',
        search: ''
      }
    },
    computed: {
      typeaheadState() {
        return this.open ? 'typeahead typeahead__open' : 'typeahead'
      },
      filteredOptions() {
        const exp = new RegExp(this.search, 'i')
        return this.options.filter((option) => {
          return ( exp.test(option.Id) || exp.test(option.Name))
        })
      }
    },
    methods: {
      onDownKey() {
        if(this.filteredOptions.length -1 > this.selectIndex) {
          this.selectIndex++
          // scroll when overflow
          if(this.selectIndex > 2) {
            this.$refs.list.scrollTop += (20 + this.selectIndex)
          }
        }
      },
      onUpKey() {
        if(this.selectIndex > 0) {
          this.selectIndex--
          // scroll when overflow
          if(this.selectIndex > 0) {
            this.$refs.list.scrollTop -= (20 + this.selectIndex)
          }
        }
      },
      onEnterKey() {
        const option = this.filteredOptions[this.selectIndex]
        if(option) {
          this.select(option)
        }
      },
      select(option) {
        this.displayText = option.Name,
          this.$emit('input', (option))
        this.$refs.search.blur()
      },
      toggle(e) {
        if(e.target === this.$refs.toggle ||
          e.target === this.$refs.search ||
          e.target === this.$refs.text) {
          if(this.open) {
            if(e.target !== this.$refs.search &&
              e.target !== this.$refs.text) {
              this.$refs.search.blur()
            }
          } else {
            this.$refs.search.focus()
          }
        }
      },
      onFocus() {
        this.open = true
      },
      onBlur() {
        this.search = '';
        this.selectIndex = 0;
        this.$refs.list.scrollTop = 0;
        this.open = false;

        /* eslint-disable */
        (jQuery)('.typeahead__text').removeClass('active');
        /* eslint-enable */
      },
      onEscape() {
        this.$refs.search.blur()
      }
    }
  }
</script>
<style type="text/css">
    .typeahead {
        border-radius: 3px;
        z-index: 1;
        width: 100%;
        font-size: 14px;
        text-align: left;
    }
    .input-field label{
        color: black;
    }
    .typeahead__list {
        padding: 0;
        max-height: 200px;
        border: 1px solid #26a69a;
        overflow-y: hidden;
        position: absolute;
        background: #fff;
        z-index: 2;
        width: 100%;
        border-radius: 0 0 3px 3px;
        text-align: left;
        margin-top: -9px;
    }
    .typeahead__item {
        display: block;
        border-top: 1px solid #f4f4f4;
    }
    .typeahead__link {
        display: block;
        padding: 10px;
        line-height: 1em;
        font-size: 1em;
        cursor: pointer;
        color: black
    }
    .typeahead__active {
        background: #26a69a;
        color: #fff;
    }
    .autocomplete .input-field{
        margin: 0;
    }
</style>
