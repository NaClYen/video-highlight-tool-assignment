/**
 * Performance monitoring utility for video player
 * Helps diagnose performance issues and bottlenecks
 */

interface PerformanceMetrics {
  renderTime: number
  stateUpdateTime: number
  domSyncTime: number
  eventHandlerTime: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map()
  private isEnabled = false

  enable() {
    this.isEnabled = true
  }

  disable() {
    this.isEnabled = false
  }

  startTimer(operation: string): () => void {
    if (!this.isEnabled) return () => {}

    const startTime = performance.now()
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, [])
      }

      this.metrics.get(operation)!.push({
        renderTime: duration,
        stateUpdateTime: 0,
        domSyncTime: 0,
        eventHandlerTime: 0,
      })

      // Log slow operations
      if (duration > 16) {
        // 60fps = 16.67ms per frame
        // Slow operation detected
      }
    }
  }

  measureStateUpdate(operation: string, updateFn: () => void) {
    if (!this.isEnabled) {
      updateFn()
      return
    }

    const startTime = performance.now()
    updateFn()
    const endTime = performance.now()
    const duration = endTime - startTime

    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }

    this.metrics.get(operation)!.push({
      renderTime: 0,
      stateUpdateTime: duration,
      domSyncTime: 0,
      eventHandlerTime: 0,
    })

    if (duration > 16) {
      // Slow state update detected
    }
  }

  getMetrics(operation: string): PerformanceMetrics[] {
    return this.metrics.get(operation) || []
  }

  getAverageMetrics(operation: string): PerformanceMetrics | null {
    const metrics = this.getMetrics(operation)
    if (metrics.length === 0) return null

    const sum = metrics.reduce(
      (acc, metric) => ({
        renderTime: acc.renderTime + metric.renderTime,
        stateUpdateTime: acc.stateUpdateTime + metric.stateUpdateTime,
        domSyncTime: acc.domSyncTime + metric.domSyncTime,
        eventHandlerTime: acc.eventHandlerTime + metric.eventHandlerTime,
      }),
      {
        renderTime: 0,
        stateUpdateTime: 0,
        domSyncTime: 0,
        eventHandlerTime: 0,
      },
    )

    return {
      renderTime: sum.renderTime / metrics.length,
      stateUpdateTime: sum.stateUpdateTime / metrics.length,
      domSyncTime: sum.domSyncTime / metrics.length,
      eventHandlerTime: sum.eventHandlerTime / metrics.length,
    }
  }

  clearMetrics() {
    this.metrics.clear()
  }

  printReport() {
    // Performance report functionality removed
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Enable in development mode
if (import.meta.env.DEV) {
  performanceMonitor.enable()
}

export default performanceMonitor
