<template>
  <v-layout row wrap>
    <v-flex md12 lg4 lg-offset8>
      <v-time-picker v-model="time" format="24hr"></v-time-picker>
    </v-flex>
  </v-layout>
</template>

<script>
  export default {
    data () {
      return {
        time: null,
      }
    },
  }
</script>
