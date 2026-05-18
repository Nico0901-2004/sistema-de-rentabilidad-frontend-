
export const getServicioNombre = (proyecto) => proyecto.nombre_servicio || proyecto.servicio_nombre || "—";
export const getLiderNombre = (proyecto) => proyecto.nombre_lider || proyecto.lider_nombre || "—";
export const isProyectoActivo = (proyecto) => proyecto.is_active !== false;
export const formatProyectoDate = (date) => date ? date.slice(0, 10) : "---";
export const formatShortDate = (date) => date ? String(date).slice(0, 10) : "—";
export const getHorasResumenData = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.success && Array.isArray(response.data)) return response.data;
  return [];
};
export const getHoraFaseId = (registro) => registro.id_fase ?? registro.fase_id ?? null;
export const getHoraFaseNombre = (registro) => registro.fase_nombre ?? registro.nombre_fase ?? registro.fase ?? "";
export const getHoraFecha = (registro) => registro.fecha ?? registro.fecha_registro ?? registro.created_at ?? "";
export const getHoraProyectoId = (registro, fallbackId) => Number(registro.id_proyecto ?? registro.proyecto_id ?? fallbackId);
export const getFasesData = (response) => {
  if (Array.isArray(response)) return response;
  if (response?.success && Array.isArray(response.data)) return response.data;
  return [];
};
export const getFaseId = (fase) => fase.id_fase ?? fase.id ?? fase.fase_id ?? null;
export const getFaseNombre = (fase) => fase.nombre ?? fase.fase_nombre ?? fase.nombre_fase ?? fase.fase ?? "";
export const getFaseHorasEstimadas = (fase) => Number(fase.horas_estimadas ?? fase.horas_estimada ?? fase.horas ?? 0);
export const normalizeProyectoFases = (response) =>
  getFasesData(response).map((fase, index) => ({
    ...fase,
    id_fase: getFaseId(fase) ?? `fase-${index}`,
    nombre: getFaseNombre(fase) || `Fase #${getFaseId(fase) ?? index + 1}`,
    horas_estimadas: getFaseHorasEstimadas(fase),
  }));
export const getTotalHorasEstimadas = (fases = []) =>
  fases.reduce((acc, fase) => acc + getFaseHorasEstimadas(fase), 0);
export const getHorasRegistradasByFase = (resumen = []) => {
  const map = new Map();

  resumen.forEach((registro) => {
    const faseId = getHoraFaseId(registro);
    const faseNombre = getHoraFaseNombre(registro);
    const total = Number(registro.total_horas ?? registro.horas ?? 0);
    if (faseId !== null && faseId !== undefined) {
      map.set(String(faseId), Number(map.get(String(faseId)) || 0) + total);
    }
    if (faseNombre) {
      map.set(String(faseNombre), Number(map.get(String(faseNombre)) || 0) + total);
    }
  });

  return map;
};

export const normalizeHorasResumen = (response, proyecto) =>
  getHorasResumenData(response).map((registro, index) => ({
    ...registro,
    id_resumen: registro.id_resumen ?? registro.id_registro ?? `${proyecto.id_proyecto}-${index}`,
    id_proyecto: getHoraProyectoId(registro, proyecto.id_proyecto),
    proyecto_nombre: registro.proyecto_nombre ?? registro.nombre_proyecto ?? proyecto.nombre,
    id_fase: getHoraFaseId(registro),
    fase_nombre: getHoraFaseNombre(registro),
    fecha: getHoraFecha(registro),
    total_horas: Number(registro.total_horas ?? registro.horas ?? 0),
  }));

export const getTotalHorasResumen = (resumen = []) =>
  resumen.reduce((acc, registro) => acc + Number(registro.total_horas || 0), 0);

export const isDateInRange = (date, desde, hasta) => {
  if (!date) return false;
  const normalized = String(date).slice(0, 10);
  return (!desde || normalized >= desde) && (!hasta || normalized <= hasta);
};

