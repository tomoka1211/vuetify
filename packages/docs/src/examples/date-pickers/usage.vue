<template>
  <div>
    <v-layout row wrap>
      <v-flex xs12 sm6>
        <v-checkbox v-model="landscape" hide-details label="Landscape"></v-checkbox>
      </v-flex>
      <v-flex>
        <v-date-picker v-model="picker" :landscape="landscape"></v-date-picker>
      </v-flex>
    </v-layout>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        picker: new Date().toISOString().substr(0, 10),
        landscape: false,
      }
    },
  }
</script>
