import {
  ref, computed, onMounted, onUnmounted,
} from 'vue';

export default function useRoomPan(options = {}) {
  const {
    roomWidth = 1500,
    roomHeight = 1500,
  } = options;

  // State
  const panOffset = ref({ x: 0, y: 0 });
  const isPanning = ref(false);
  const viewportSize = ref({ width: 0, height: 0 });

  // Touch tracking
  const touchStart = ref({ x: 0, y: 0 });
  const lastPanOffset = ref({ x: 0, y: 0 });

  // Tap-to-move tracking
  const singleTouchStart = ref(null);
  const tapMoveCallback = ref(null);

  // Computed
  const isMobile = computed(() => window.innerWidth <= 768); // Simple mobile detection

  const roomCanvasStyle = computed(() => ({
    width: `${roomWidth}px`,
    height: `${roomHeight}px`,
    transform: `translate(${panOffset.value.x}px, ${panOffset.value.y}px)`,
    transformOrigin: 'top left',
    transition: isPanning.value ? 'none' : 'transform 0.3s ease-out',
  }));

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

    // Single-finger touch = potential tap-to-move
    if (e.touches.length === 1) {
      // Only track if touching the background (not avatar or buttons)
      const { target } = e;
      if (target.classList.contains('v-img__img') || target.closest('.current-user') || target.closest('.user') || target.closest('.arrow-btn')) {
        singleTouchStart.value = null;
        return;
      }

      singleTouchStart.value = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }

    // Two-finger touch = pan gesture
    if (e.touches.length === 2) {
      e.preventDefault();
      isPanning.value = true;
      singleTouchStart.value = null; // Reset tap tracking

      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

      touchStart.value = { x: centerX, y: centerY };
      lastPanOffset.value = { ...panOffset.value };
    }
  };

  const handleTouchMove = (e) => {
    // Check if single-finger drag (not a tap)
    if (e.touches.length === 1 && singleTouchStart.value) {
      const deltaX = Math.abs(e.touches[0].clientX - singleTouchStart.value.x);
      const deltaY = Math.abs(e.touches[0].clientY - singleTouchStart.value.y);

      // If moved more than 10px, it's a drag not a tap
      if (deltaX > 10 || deltaY > 10) {
        singleTouchStart.value = null;
      }
    }

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
    // Check for tap-to-move
    if (singleTouchStart.value) {
      const tapDuration = Date.now() - singleTouchStart.value.time;

      // If tap was quick (< 300ms), treat it as tap-to-move
      if (tapDuration < 300 && tapMoveCallback.value) {
        // Calculate room coordinates from screen coordinates
        const screenX = singleTouchStart.value.x;
        const screenY = singleTouchStart.value.y;

        // Convert screen coordinates to room coordinates
        // Room is offset by panOffset, so we need to subtract it
        const roomX = screenX - panOffset.value.x;
        const roomY = screenY - panOffset.value.y;

        // Call the callback with room coordinates
        tapMoveCallback.value({ x: roomX, y: roomY });
      }

      singleTouchStart.value = null;
    }

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

  // Center viewport on a specific position (e.g., user's avatar)
  const centerOnPosition = ({ x, y }) => {
    const centerX = -(x - viewportSize.value.width / 2);
    const centerY = -(y - viewportSize.value.height / 2);
    panOffset.value = constrainPanOffset({ x: centerX, y: centerY });
  };
  const centerHorizontally = () => {
    const centerX = -(roomWidth / 2 - viewportSize.value.width / 2);
    panOffset.value = constrainPanOffset({
      x: centerX,
      y: panOffset.value.y,
    });
  };

  // Set callback for tap-to-move
  const setTapMoveCallback = (callback) => {
    tapMoveCallback.value = callback;
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
    centerOnPosition,
    centerHorizontally,
    setTapMoveCallback,
  };
}
