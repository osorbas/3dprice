/**
 * Utilitário para extrair metadados de ficheiros G-code (Bambu Studio / OrcaSlicer / PrusaSlicer)
 */
export interface GCodeMetadata {
  filamentGrams: number | null;
  totalTimeSeconds: number | null;
}

export const parseGCodeMetadata = (content: string): GCodeMetadata => {
  const metadata: GCodeMetadata = {
    filamentGrams: null,
    totalTimeSeconds: null,
  };

  // Padrões de Filamento (Gramas)
  const filamentPatterns = [
    /;\s*total\s*filament\s*weight\s*\[g\]\s*[:=]\s*(\d+(?:\.\d+)?)/i, // Suporta : e =
    /;\s*(?:total\s*)?filament\s*used\s*\[g\]\s*=\s*(\d+(?:\.\d+)?)/i,
    /;\s*filament_weight_1\s*=\s*(\d+(?:\.\d+)?)/i,
    /;\s*filament\s*used\s*=\s*(\d+(?:\.\d+)?)g/i,
    /;\s*total\s*filament\s*used\s*=\s*(\d+(?:\.\d+)?)g/i
  ];

  // Padrões de Tempo (Segundos ou Strings formatadas)
  // BambuStudio: ; total estimated time: 1h 8m 56s
  const timePatterns = [
    /total\s*estimated\s*time\s*[:=]\s*([^;\r\n]*)/i,
    /estimated\s*printing\s*time\s*[:=]\s*([^;\r\n]*)/i,
    /total_estimated_time\s*=\s*(\d+)/i
  ];

  // Tentar encontrar filamento
  for (const pattern of filamentPatterns) {
    const match = content.match(pattern);
    if (match) {
      metadata.filamentGrams = parseFloat(match[1]);
      break;
    }
  }

  // Tentar encontrar tempo
  for (const pattern of timePatterns) {
    const match = content.match(pattern);
    if (match) {
      const timeVal = match[1].trim();
      
      // Se for apenas um número, assumimos segundos
      if (/^\d+$/.test(timeVal)) {
        metadata.totalTimeSeconds = parseInt(timeVal, 10);
      } else {
        // Se for string formatada (1h 20m 30s)
        let totalSec = 0;
        const hours = timeVal.match(/(\d+)\s*h/i);
        const mins = timeVal.match(/(\d+)\s*m/i);
        const secs = timeVal.match(/(\d+)\s*s/i);
        
        if (hours) totalSec += parseInt(hours[1], 10) * 3600;
        if (mins) totalSec += parseInt(mins[1], 10) * 60;
        if (secs) totalSec += parseInt(secs[1], 10);
        
        if (totalSec > 0) {
          metadata.totalTimeSeconds = totalSec;
        }
      }
      
      if (metadata.totalTimeSeconds) break;
    }
  }

  return metadata;
};