'use client'

// ================================================================
// ELIANA STATE MACHINE
// VIVA → ESCUCHANDO → PENSANDO → HABLANDO → VIVA
// + ERROR, DESCONECTADA
// ================================================================

export type ElianaState =
  | 'VIVA'        // Idle, ready to receive
  | 'ESCUCHANDO'  // User is typing / message received
  | 'PENSANDO'    // Processing the request
  | 'HABLANDO'    // Delivering response
  | 'ERROR'       // Error occurred
  | 'DESCONECTADA' // Disconnected / offline

export type StateTransition =
  | { from: 'VIVA'; to: 'ESCUCHANDO' }
  | { from: 'ESCUCHANDO'; to: 'PENSANDO' }
  | { from: 'PENSANDO'; to: 'HABLANDO' }
  | { from: 'HABLANDO'; to: 'VIVA' }
  | { from: ElianaState; to: 'DESCONECTADA' }
  | { from: ElianaState; to: 'ERROR' }
  | { from: 'ERROR'; to: 'VIVA' }
  | { from: 'DESCONECTADA'; to: 'VIVA' }

// Valid state transitions
const VALID_TRANSITIONS: Record<ElianaState, ElianaState[]> = {
  VIVA: ['ESCUCHANDO', 'DESCONECTADA'],
  ESCUCHANDO: ['PENSANDO', 'DESCONECTADA', 'ERROR'],
  PENSANDO: ['HABLANDO', 'ERROR', 'DESCONECTADA'],
  HABLANDO: ['VIVA', 'DESCONECTADA'],
  ERROR: ['VIVA', 'DESCONECTADA'],
  DESCONECTADA: ['VIVA'],
}

// Human-readable state labels
export const STATE_LABELS: Record<ElianaState, string> = {
  VIVA: 'VIVA',
  ESCUCHANDO: 'ESCUCHANDO',
  PENSANDO: 'PENSANDO',
  HABLANDO: 'HABLANDO',
  ERROR: 'ERROR',
  DESCONECTADA: 'DESCONECTADA',
}

// State descriptions for UI
export const STATE_DESCRIPTIONS: Record<ElianaState, string> = {
  VIVA: 'Lista para ayudarte',
  ESCUCHANDO: 'Recibiendo tu mensaje...',
  PENSANDO: 'Procesando tu solicitud...',
  HABLANDO: 'Entregando respuesta...',
  ERROR: 'Error de conexión',
  DESCONECTADA: 'Sin conexión',
}

// State colors for UI indicators
export const STATE_COLORS: Record<ElianaState, { bg: string; text: string; dot: string }> = {
  VIVA: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  ESCUCHANDO: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  PENSANDO: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  HABLANDO: { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-400' },
  ERROR: { bg: 'bg-rose-500/10', text: 'text-rose-400', dot: 'bg-rose-500' },
  DESCONECTADA: { bg: 'bg-slate-500/10', text: 'text-slate-400', dot: 'bg-slate-500' },
}

export class ElianaStateMachine {
  private state: ElianaState = 'VIVA'
  private stateHistory: { state: ElianaState; timestamp: number }[] = []
  private listeners: Set<(state: ElianaState) => void> = new Set()
  private timeoutId: ReturnType<typeof setTimeout> | null = null

  constructor() {
    this.stateHistory.push({ state: 'VIVA', timestamp: Date.now() })
  }

  getState(): ElianaState {
    return this.state
  }

  canTransition(to: ElianaState): boolean {
    return VALID_TRANSITIONS[this.state]?.includes(to) ?? false
  }

  transition(to: ElianaState): boolean {
    if (!this.canTransition(to)) {
      console.warn(`Invalid state transition: ${this.state} → ${to}`)
      return false
    }

    this.clearTimeout()
    this.state = to
    this.stateHistory.push({ state: to, timestamp: Date.now() })

    // Keep history reasonable
    if (this.stateHistory.length > 50) {
      this.stateHistory = this.stateHistory.slice(-30)
    }

    this.notifyListeners()
    return true
  }

  // Convenience methods for the main flow
  startListening(): boolean {
    return this.transition('ESCUCHANDO')
  }

  startThinking(): boolean {
    return this.transition('PENSANDO')
  }

  startSpeaking(): boolean {
    return this.transition('HABLANDO')
  }

  returnToIdle(): boolean {
    return this.transition('VIVA')
  }

  reportError(): boolean {
    return this.transition('ERROR')
  }

  disconnect(): boolean {
    return this.transition('DESCONECTADA')
  }

  reconnect(): boolean {
    return this.transition('VIVA')
  }

  // Auto-recovery from ERROR after timeout
  autoRecover(delayMs: number = 5000): void {
    this.timeoutId = setTimeout(() => {
      if (this.state === 'ERROR') {
        this.transition('VIVA')
      }
    }, delayMs)
  }

  // Subscribe to state changes
  subscribe(listener: (state: ElianaState) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      try {
        listener(this.state)
      } catch {
        // Listener error shouldn't break the machine
      }
    }
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  // Get history for debugging
  getHistory() {
    return [...this.stateHistory]
  }

  // Reset the machine
  reset() {
    this.clearTimeout()
    this.state = 'VIVA'
    this.stateHistory = [{ state: 'VIVA', timestamp: Date.now() }]
    this.notifyListeners()
  }
}

// Singleton for the app
let machineInstance: ElianaStateMachine | null = null

export function getStateMachine(): ElianaStateMachine {
  if (!machineInstance) {
    machineInstance = new ElianaStateMachine()
  }
  return machineInstance
}
