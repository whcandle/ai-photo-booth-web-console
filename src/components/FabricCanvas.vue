<template>
  <div class="fabric-wrap" ref="wrapRef">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as fabric from 'fabric'

const wrapRef = ref(null)
const canvasRef = ref(null)
const canvas = ref(null)

const emit = defineEmits(['change'])

const initCanvas = () => {
  if (!canvasRef.value || canvas.value) return

  const c = new fabric.Canvas(canvasRef.value, {
    selection: true,
    preserveObjectStacking: true
  })
  canvas.value = c

  resizeCanvas()

  // 绑定事件，向外抛出最新 JSON
  const emitChange = () => {
    if (!canvas.value) return
    emit('change', canvas.value.toJSON())
  }

  c.on('object:modified', emitChange)
  c.on('object:added', emitChange)
}

const resizeCanvas = () => {
  if (!canvas.value || !wrapRef.value) return
  const rect = wrapRef.value.getBoundingClientRect()
  const width = rect.width || wrapRef.value.clientWidth || 0
  const height = rect.height || wrapRef.value.clientHeight || 720

  canvas.value.setWidth(width)
  canvas.value.setHeight(height)
  canvas.value.renderAll()
}

const handleResize = () => {
  resizeCanvas()
}

onMounted(() => {
  nextTick(() => {
    initCanvas()
    window.addEventListener('resize', handleResize)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (canvas.value) {
    canvas.value.dispose()
    canvas.value = null
  }
})

// 对外暴露：添加矩形
const addRect = () => {
  if (!canvas.value) return
  const rect = new fabric.Rect({
    left: 100,
    top: 100,
    width: 200,
    height: 300,
    fill: 'rgba(0,0,0,0)',
    stroke: '#00A',
    strokeWidth: 2,
    cornerColor: '#00A',
    transparentCorners: false
  })
  canvas.value.add(rect)
  canvas.value.setActiveObject(rect)
  canvas.value.renderAll()
}

// 对外暴露：从 JSON 加载
const loadFromJSON = (json) => {
  if (!canvas.value || !json) return
  try {
    canvas.value.loadFromJSON(json, () => {
      canvas.value.renderAll()
    })
  } catch (e) {
    // 避免因 JSON 问题导致崩溃，只在控制台打印
    console.error('Failed to load Fabric JSON', e)
  }
}

defineExpose({
  addRect,
  loadFromJSON
})
</script>

<style scoped>
.fabric-wrap {
  position: relative;
  width: 100%;
  height: 720px;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  /* 确保可以交互 */
  pointer-events: auto;
}
</style>

