
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { PdfSignControl, PdfSignControlOptions } from '@shz/pdf-sign-control';

interface Props extends Omit<PdfSignControlOptions, 'container'> {
  onLoad?: (control: PdfSignControl) => void;
}

const props = defineProps<Props>();
const containerRef = ref<HTMLElement | null>(null);
let control: PdfSignControl | null = null;

onMounted(() => {
  if (!containerRef.value) return;

  control = new PdfSignControl({
    container: containerRef.value,
    pdfLoaderOptions: props.pdfLoaderOptions,
  });

  if (props.onLoad) {
    props.onLoad(control);
  }
});

onUnmounted(() => {
  if (control) {
    control.destroy();
    control = null;
  }
});

defineExpose({
  getControl: () => control
});
</script>

<template>
  <div ref="containerRef" class="pdf-sign-vue-container"></div>
</template>

<style scoped>
.pdf-sign-vue-container {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
