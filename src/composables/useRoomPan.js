import {
  ref, computed, onMounted, onUnmounted,
} from 'vue';

export default function useRoomPan(options = {}) {
  const {
    roomWidth = 2000,
    roomHeight = 2000,
  } = options;

  // State
  const panOffset = ref({ x: 0, y: 0 });
  const isPanning = ref(false);
  const viewportSize = ref({ width: 0, height: 0 });

  // Touch tracking
  const touchStart = ref({ x: 0, y: 0 });
  const lastPanOffset = ref({ x: 0, y: 0 });

  // Computed
  const isMobile = computed(() => window.innerWidth <= 768); // Simple mobile detection

  const roomCanvasStyle = computed(() => {
    if (!isMobile.value) {
      return {}; // Desktop: no transform
    }
    return {
      width: `${roomWidth}px`,
      height: `${roomHeight}px`,
      transform: `translate(${panOffset.value.x}px, ${panOffset.value.y}px)`,
      transformOrigin: 'top left',
      transition: isPanning.value ? 'none' : 'transform 0.3s ease-out',
    };
  });

  const maxPanOffset = computed(() => ({
    x: Math.max(0, roomWidth - viewportSize.value.width),
    y: Math.max(0, roomHeight - viewportSize.value.height),
  }));

  // Methods
  const updateViewportSize = () => {
    viewportSize.value = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  };

  const constrainPanOffset = (offset) => ({
    x: Math.max(-maxPanOffset.value.x, Math.min(0, offset.x)),
    y: Math.max(-maxPanOffset.value.y, Math.min(0, offset.y)),
  });

  const handleTouchStart = (e) => {
    if (!isMobile.value) return;

    // Two-finger touch = pan gesture
    if (e.touches.length === 2) {
      e.preventDefault();
      isPanning.value = true;

      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      touchStart.value = { x: centerX, y: centerY };
      lastPanOffset.value = { ...panOffset.value };
    }
  };

  const handleTouchMove = (e) => {
    if (!isPanning.value || e.touches.length !== 2) return;

    e.preventDefault();

    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

    const deltaX = centerX - touchStart.value.x;
    const deltaY = centerY - touchStart.value.y;

    const newOffset = {
      x: lastPanOffset.value.x + deltaX,
      y: lastPanOffset.value.y + deltaY,
    };

    panOffset.value = constrainPanOffset(newOffset);
  };

  const handleTouchEnd = () => {
    if (isPanning.value) {
      isPanning.value = false;
      touchStart.value = { x: 0, y: 0 };
    }
  };

  // Arrow navigation for simulator/alternative control
  const PAN_STEP = 150; // pixels to pan per arrow click

  const panUp = () => {
    const newOffset = { x: panOffset.value.x, y: panOffset.value.y + PAN_STEP };
    panOffset.value = constrainPanOffset(newOffset);
  };

  const panDown = () => {
    const newOffset = { x: panOffset.value.x, y: panOffset.value.y - PAN_STEP };
    panOffset.value = constrainPanOffset(newOffset);
  };

  const panLeft = () => {
    const newOffset = { x: panOffset.value.x + PAN_STEP, y: panOffset.value.y };
    panOffset.value = constrainPanOffset(newOffset);
  };

  const panRight = () => {
    const newOffset = { x: panOffset.value.x - PAN_STEP, y: panOffset.value.y };
    panOffset.value = constrainPanOffset(newOffset);
  };

  // Lifecycle
  onMounted(() => {
    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateViewportSize);
  });

  return {
    panOffset,
    isPanning,
    isMobile,
    roomCanvasStyle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    panUp,
    panDown,
    panLeft,
    panRight,
  };
}
