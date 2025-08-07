// Simple logger mock for testing
export class Logger {
  constructor(private context: string) {}
  
  info(message: string, data?: any) {
    console.log(`[${this.context}] INFO: ${message}`, data || '');
  }
  
  error(message: string, error?: any) {
    console.error(`[${this.context}] ERROR: ${message}`, error || '');
  }
  
  warn(message: string, data?: any) {
    console.warn(`[${this.context}] WARN: ${message}`, data || '');
  }
  
  debug(message: string, data?: any) {
    console.debug(`[${this.context}] DEBUG: ${message}`, data || '');
  }
}