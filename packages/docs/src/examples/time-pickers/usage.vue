<template>
  <v-container>
    <v-layout row>
      <v-flex>
        <v-checkbox v-model="landscape" label="Landscape"></v-checkbox>
        <v-checkbox v-model="ampmInTitle" label="Show AM/PM in title"></v-checkbox>
      </v-flex>
      <v-flex>
        <v-time-picker v-model="time" :landscape="landscape" :show-am-pm-in-title="ampmInTitle"></v-time-picker>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  export default {
    data () {
      return {
        time: null,
        landscape: false,
        ampmInTitle: false,
      }
    },
  }
</script>
