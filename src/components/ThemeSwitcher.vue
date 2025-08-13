<template>
  <v-select
    v-model="currentTheme"
    :items="availableThemes"
    item-title="label"
    item-value="name"
    label="Theme"
    variant="outlined"
    density="compact"
    @update:modelValue="setTheme"
  >
    <template #prepend-icon>
      <v-icon>mdi-palette</v-icon>
    </template>
  </v-select>
</template>

<script setup>
import useTheme from '@/composables/useTheme';

const { currentTheme, availableThemes, setTheme } = useTheme();
</script>
