/**
 * Sistema de Debug per l'aplicació
 * 
 * Per activar el mode debug i veure tots els logs de desenvolupament:
 * 1. Canvia DEBUG_MODE a true en aquest fitxer
 * 2. Els logs de debug apareixeran a la consola del navegador
 * 3. Els blocs de debug JSON visuals es mostraran a les pàgines de "Creació" i "Generació" d'informes
 * 
 * IMPORTANT: Mantenir DEBUG_MODE = false en producció per evitar logs innecessaris
 */

// Configuració de debug mode
// Canvia DEBUG_MODE a true per veure els logs de debug
const DEBUG_MODE = false;

/**
 * Log de debug que només s'executa si DEBUG_MODE està activat
 * @param  {...any} args - Arguments a passar a console.log
 */
export const debugLog = (...args) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

/**
 * Log d'error que sempre s'executa
 * @param  {...any} args - Arguments a passar a console.error
 */
export const errorLog = (...args) => {
  console.error(...args);
};

/**
 * Warning log que sempre s'executa
 * @param  {...any} args - Arguments a passar a console.warn
 */
export const warnLog = (...args) => {
  console.warn(...args);
};

export default DEBUG_MODE;
