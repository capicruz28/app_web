// src/components/administracion/DetalleCuentasCobrarPagar.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Sheet } from 'lucide-react';

// Importa tu instancia de Axios configurada
import api from '../../services/api'; // Asegúrate de que la ruta sea correcta

// [MODIFICADO] Importar el hook del contexto y dataSinFiltroDetalle
import { useCuentasCobrarPagar } from '../../context/CuentasCobrarPagarContext';


// Asumiendo que tienes un componente Modal o puedes usar un div simple con estilos
// Si usas una librería de UI, necesitarás importar su componente Modal
// Ejemplo con un div simple (puedes reemplazarlo con tu Modal real)
const SimpleModal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose} // Cierra al hacer clic fuera del contenido
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '90%',
          maxHeight: '90%',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
      >
        {children}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '1.2em',
            cursor: 'pointer',
          }}
        >
          &times;
        </button>
      </div>
    </div>
  );
};


interface Props {
  // Eliminamos la prop data ya que usaremos dataSinFiltroDetalle del contexto
  // data: CuentaCobrarPagar[];
}

interface RowData {
  fecha_vencimiento: string;
  fecha_comprobante: string;
  codigo_cliente_proveedor: string;
  cliente_proveedor: string;
  serie_comprobante: string;
  numero_comprobante: string;
  tipo_comprobante: string;
  descripcion_comprobante: string;
  tipo_cambio: string;
  importe_original: number; // Nuevo campo
  importe_soles: number;
  importe_dolares: number;
  importe_moneda_funcional: number;
  pendiente_cobrar: number; // Nuevo campo
  ruta_comprobante_pdf?: string | null; // Añadimos el campo de la ruta del PDF
}

function formatDateYYYYMMDD(dateStr?: string) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

// Tipo para las columnas clickeables en Detalle
type ClickableColumn = 'fecha_vencimiento' | 'fecha_comprobante' | 'codigo_cliente_proveedor' | 'cliente_proveedor' | 'serie_comprobante' | 'numero_comprobante' | 'tipo_comprobante' | 'descripcion_comprobante' | 'tipo_cambio' | 'sumario';


export const DetalleCuentasCobrarPagar: React.FC<Props> = React.memo(() => { // Eliminamos la prop data
  // [MODIFICADO] Usar detalleSeleccion, setDetalleSeleccion y dataSinFiltroDetalle del contexto
  const { detalleSeleccion, setDetalleSeleccion, dataSinFiltroDetalle } = useCuentasCobrarPagar();

  // ===== [NUEVO] Estados para el modal del PDF =====
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // Cambiado a string | null
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // 1. Agrupa y suma por todas las columnas excepto importes
  // [MODIFICADO] Usar dataSinFiltroDetalle en lugar de data
  const groupedRows = React.useMemo(() => {
    // Primero, encontramos el importe_original único por serie+número
    const importesOriginales = new Map<string, number>();
    const pdfPaths = new Map<string, string | null>(); // Mapa para guardar la ruta del PDF

    dataSinFiltroDetalle.forEach(item => {
      const key = `${item.serie_comprobante ?? ''}|${item.numero_comprobante ?? ''}|${item.codigo_cliente_proveedor ?? ''}|${item.tipo_comprobante ?? ''}`;
      if (!importesOriginales.has(key)) {
        importesOriginales.set(key, Number(item.importe_original ?? 0));
      }
      // Guardar la ruta del PDF asociada a esta clave de comprobante
      if (item.ruta_comprobante_pdf) {
         pdfPaths.set(key, item.ruta_comprobante_pdf);
      } else if (!pdfPaths.has(key)) {
         // Si no hay ruta en este item, pero ya guardamos una para esta key, la mantenemos
         // Si es la primera vez que vemos esta key y no hay ruta, guardamos null
         pdfPaths.set(key, null);
      }
    });

    const map = new Map<string, RowData>();
    dataSinFiltroDetalle.forEach(item => {
      const key = [
        item.fecha_vencimiento ?? '',
        item.fecha_comprobante ?? '',
        item.codigo_cliente_proveedor ?? '',
        item.cliente_proveedor ?? '',
        item.serie_comprobante ?? '',
        item.numero_comprobante ?? '',
        item.tipo_comprobante ?? '',
        item.descripcion_comprobante ?? '',
        String(item.tipo_cambio ?? ''),
      ].join('|');

      const serieNumeroKey = `${item.serie_comprobante ?? ''}|${item.numero_comprobante ?? ''}|${item.codigo_cliente_proveedor ?? ''}|${item.tipo_comprobante ?? ''}`;

      if (!map.has(key)) {
        map.set(key, {
          fecha_vencimiento: item.fecha_vencimiento ?? '',
          fecha_comprobante: item.fecha_comprobante ?? '',
          codigo_cliente_proveedor: item.codigo_cliente_proveedor ?? '',
          cliente_proveedor: item.cliente_proveedor ?? '',
          serie_comprobante: item.serie_comprobante ?? '',
          numero_comprobante: item.numero_comprobante ?? '',
          tipo_comprobante: item.tipo_comprobante ?? '',
          descripcion_comprobante: item.descripcion_comprobante ?? '',
          tipo_cambio: String(item.tipo_cambio ?? ''),
          importe_original: importesOriginales.get(serieNumeroKey) ?? 0,
          importe_soles: 0,
          importe_dolares: 0,
          importe_moneda_funcional: 0,
          pendiente_cobrar: 0,
          ruta_comprobante_pdf: pdfPaths.get(serieNumeroKey) // Asignar la ruta del PDF
        });
      }
      const row = map.get(key)!;
      row.importe_soles += Number(item.importe_soles ?? 0);
      row.importe_dolares += Number(item.importe_dolares ?? 0);
      row.importe_moneda_funcional += Number(item.importe_moneda_funcional ?? 0);
      row.pendiente_cobrar += Number(item.pendiente_cobrar ?? 0);
      // Asegurarse de que la ruta del PDF se mantenga si ya se encontró una
      if (item.ruta_comprobante_pdf && !row.ruta_comprobante_pdf) {
          row.ruta_comprobante_pdf = item.ruta_comprobante_pdf;
      }
    });
    return Array.from(map.values());
  }, [dataSinFiltroDetalle]); // [MODIFICADO] Dependencia: dataSinFiltroDetalle

  // 2. Ordena por fecha_vencimiento (ascendente), luego por las demás columnas
  // [MODIFICADO] Ordenar basado en groupedRows (que usa dataSinFiltroDetalle)
  const orderedRows = useMemo(() => {
    return [...groupedRows].sort((a, b) => {
      if (a.fecha_vencimiento !== b.fecha_vencimiento) return a.fecha_vencimiento.localeCompare(b.fecha_vencimiento);
      if (a.fecha_comprobante !== b.fecha_comprobante) return a.fecha_comprobante.localeCompare(b.fecha_comprobante);
      if (a.codigo_cliente_proveedor !== b.codigo_cliente_proveedor) return a.codigo_cliente_proveedor.localeCompare(b.codigo_cliente_proveedor);
      if (a.cliente_proveedor !== b.cliente_proveedor) return a.cliente_proveedor.localeCompare(b.cliente_proveedor);
      if (a.serie_comprobante !== b.serie_comprobante) return a.serie_comprobante.localeCompare(b.serie_comprobante);
      if (a.numero_comprobante !== b.numero_comprobante) return a.numero_comprobante.localeCompare(b.numero_comprobante);
      if (a.tipo_comprobante !== b.tipo_comprobante) return a.tipo_comprobante.localeCompare(b.tipo_comprobante);
      if (a.descripcion_comprobante !== b.descripcion_comprobante) return a.descripcion_comprobante.localeCompare(b.descripcion_comprobante);
      if (a.tipo_cambio !== b.tipo_cambio) return a.tipo_cambio.localeCompare(b.tipo_cambio);
      return 0;
    });
  }, [groupedRows]);

  const filteredRows = useMemo(() => {
  if (!detalleSeleccion.clickedColumn) return orderedRows;
  return orderedRows.filter(row =>
    (detalleSeleccion.fecha_vencimiento === undefined || row.fecha_vencimiento === detalleSeleccion.fecha_vencimiento) &&
    (detalleSeleccion.fecha_comprobante === undefined || row.fecha_comprobante === detalleSeleccion.fecha_comprobante) &&
    (detalleSeleccion.codigo_cliente_proveedor === undefined || row.codigo_cliente_proveedor === detalleSeleccion.codigo_cliente_proveedor) &&
    (detalleSeleccion.cliente_proveedor === undefined || row.cliente_proveedor === detalleSeleccion.cliente_proveedor) &&
    (detalleSeleccion.serie_comprobante === undefined || row.serie_comprobante === detalleSeleccion.serie_comprobante) &&
    (detalleSeleccion.numero_comprobante === undefined || row.numero_comprobante === detalleSeleccion.numero_comprobante) &&
    (detalleSeleccion.tipo_comprobante === undefined || row.tipo_comprobante === detalleSeleccion.tipo_comprobante) &&
    (detalleSeleccion.descripcion_comprobante === undefined || row.descripcion_comprobante === detalleSeleccion.descripcion_comprobante) &&
    (detalleSeleccion.tipo_cambio === undefined || row.tipo_cambio === detalleSeleccion.tipo_cambio)
  );
}, [orderedRows, detalleSeleccion]);

  // 3. Totales
  // [MODIFICADO] Calcular totales basados en orderedRows (que usa dataSinFiltroDetalle)
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.original += row.importe_original;
        acc.soles += row.importe_soles;
        acc.dolares += row.importe_dolares;
        acc.funcional += row.importe_moneda_funcional;
        acc.pendiente += row.pendiente_cobrar;
        return acc;
      },
      { original: 0, soles: 0, dolares: 0, funcional: 0, pendiente: 0 }
    );
  }, [filteredRows]);

  // ===== Funciones de exportación (se mantienen igual, usan orderedRows) =====
  const exportToExcel = () => {
    const datosExportar = orderedRows.map(row => ({
      "Fecha Vencimiento": row.fecha_vencimiento,
      "Fecha Comprobante": row.fecha_comprobante,
      "Código Cliente": row.codigo_cliente_proveedor,
      "Cliente/Proveedor": row.cliente_proveedor,
      Serie: row.serie_comprobante,
      Número: row.numero_comprobante,
      "Tipo Comprobante": row.tipo_comprobante,
      "Descripción Comprobante": row.descripcion_comprobante,
      "Tipo Cambio": row.tipo_cambio || 'N/A',
      "Importe Original": row.importe_original,
      "Importe Soles": row.importe_soles,
      "Importe Dólares": row.importe_dolares,
      "Importe Funcional": row.importe_moneda_funcional,
      "Pendiente Cobrar": row.pendiente_cobrar, // Exportar el valor numérico
      "% Pend.": row.importe_original !== 0 ? (row.pendiente_cobrar) * 100 : 0, // Calcular el porcentaje
      "Ruta PDF": row.ruta_comprobante_pdf || '', // Añadido para Excel
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detalle");
    XLSX.writeFile(wb, `Detalle_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      const title = "Reporte - Detalle de Cuentas por Cobrar/Pagar";

      // Definición de tipos específicos para jspdf-autotable
      type PDFCell = string | number | { content: string; styles?: { halign?: 'left' | 'center' | 'right' } };
      type PDFRow = PDFCell[];

      const headers: PDFRow = [
        "Fecha Vencimiento",
        "Fecha Comprobante",
        "Código Cliente",
        "Cliente/Proveedor",
        'Serie',
        'Número',
        'Tipo Comprobante',
        'Descripción Comprobante',
        'Tipo Cambio',
        'Imp. Original', // Abreviado para caber
        'Soles',
        'Dólares',
        'Funcional',
        'Pendiente', // Cambiado a "Pendiente" para el valor numérico
        '% Pend.'
      ];

      const body: PDFRow[] = orderedRows.map(row => [
        row.fecha_vencimiento,
        row.fecha_comprobante,
        row.codigo_cliente_proveedor,
        row.cliente_proveedor,
        row.serie_comprobante,
        row.numero_comprobante,
        row.tipo_comprobante,
        row.descripcion_comprobante,
        row.tipo_cambio || 'N/A',
        {
          content: row.importe_original.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
          styles: { halign: 'right' }
        },
        {
          content: row.importe_soles.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
          styles: { halign: 'right' }
        },
        {
          content: row.importe_dolares.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
          styles: { halign: 'right' }
        },
        {
          content: row.importe_moneda_funcional.toLocaleString('es-PE', { minimumFractionDigits: 2 }),
          styles: { halign: 'right' }
        },
        {
          content: row.pendiente_cobrar.toLocaleString('es-PE', { minimumFractionDigits: 2 }), // Mostrar el valor numérico
          styles: { halign: 'right' }
        },
        {
          content: row.importe_original !== 0 ? ((row.pendiente_cobrar) * 100).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : (0).toLocaleString('es-PE', { minimumFractionDigits: 2 }), // Calcular el porcentaje
          styles: { halign: 'right' }
        }
      ]);

      doc.text(title, 15, 15);

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 20,
        headStyles: {
          fillColor: '#6495ED',
          textColor: '#fff',
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          9: { halign: 'right' }, // Importe Original
          10: { halign: 'right' }, // Soles
          11: { halign: 'right' }, // Dólares
          12: { halign: 'right' }, // Funcional
          13: { halign: 'right' }, // Pendiente
          14: { halign: 'right' }  // % Pend.
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          halign: 'left'
        }
      });

      doc.save(`Detalle_${new Date().toISOString().slice(0, 10)}.pdf`); // Nombre de archivo corregido
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Verifica la consola para más detalles.');
    }
  };

  // ===== Componente de botones (se mantiene igual) =====
  const ExportButtons = () => (
    <div className="flex gap-1">
      <button
        onClick={exportToExcel}
        className="flex items-center gap-1 px-1 py-0.4 bg-green-600 hover:bg-green-700 text-white rounded text-[9px] transition-colors"
        title="Exportar a Excel"
      >
        <Sheet size={12} />
        Excel
      </button>
      <button
        onClick={exportToPDF}
        className="flex items-center gap-1 px-1 py-0.4 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] transition-colors"
        title="Exportar a PDF"
      >
        <FileText size={12} />
        PDF
      </button>
    </div>
  );

  // Función para manejar el clic en las celdas (se mantiene igual)
  const handleCellClick = React.useCallback((row: RowData, clickedColumn: ClickableColumn) => {
      let newSelection = {};

      // Construir la nueva selección basada en la columna clickeada
      if (clickedColumn === 'fecha_vencimiento') {
          newSelection = {
              fecha_vencimiento: row.fecha_vencimiento,
              clickedColumn: 'fecha_vencimiento'
          };
      } else if (clickedColumn === 'fecha_comprobante') {
           newSelection = {
              fecha_vencimiento: row.fecha_vencimiento,
              fecha_comprobante: row.fecha_comprobante,
              clickedColumn: 'fecha_comprobante'
          };
      } else if (clickedColumn === 'codigo_cliente_proveedor') {
           newSelection = {
              fecha_vencimiento: row.fecha_vencimiento,
              fecha_comprobante: row.fecha_comprobante,
              codigo_cliente_proveedor: row.codigo_cliente_proveedor,
              clickedColumn: 'codigo_cliente_proveedor'
          };
      } else if (clickedColumn === 'cliente_proveedor') {
           newSelection = {
              fecha_vencimiento: row.fecha_vencimiento,
              fecha_comprobante: row.fecha_comprobante,
              codigo_cliente_proveedor: row.codigo_cliente_proveedor,
              cliente_proveedor: row.cliente_proveedor,
              clickedColumn: 'cliente_proveedor'
          };
      } else if (clickedColumn === 'serie_comprobante') {
           newSelection = {
              fecha_vencimiento: row.fecha_vencimiento,
              fecha_comprobante: row.fecha_comprobante,
              codigo_cliente_proveedor: row.codigo_cliente_proveedor,
              cliente_proveedor: row.cliente_proveedor,
              serie_comprobante: row.serie_comprobante,
              clickedColumn: 'serie_comprobante'
          };
      } else if (clickedColumn === 'numero_comprobante') {
           newSelection = {
              fecha_vencimiento: row.fecha_vencimiento,
              fecha_comprobante: row.fecha_comprobante,
              codigo_cliente_proveedor: row.codigo_cliente_proveedor,
              cliente_proveedor: row.cliente_proveedor,
              serie_comprobante: row.serie_comprobante,
              numero_comprobante: row.numero_comprobante,
              clickedColumn: 'numero_comprobante'
          };
      } else if (clickedColumn === 'tipo_comprobante') {
           newSelection = {
              fecha_vencimiento: row.fecha_vencimiento,
              fecha_comprobante: row.fecha_comprobante,
              codigo_cliente_proveedor: row.codigo_cliente_proveedor,
              cliente_proveedor: row.cliente_proveedor,
              serie_comprobante: row.serie_comprobante,
              numero_comprobante: row.numero_comprobante,
              tipo_comprobante: row.tipo_comprobante,
              clickedColumn: 'tipo_comprobante'
          };
      } else if (clickedColumn === 'descripcion_comprobante') {
           newSelection = {
              fecha_vencimiento: row.fecha_vencimiento,
              fecha_comprobante: row.fecha_comprobante,
              codigo_cliente_proveedor: row.codigo_cliente_proveedor,
              cliente_proveedor: row.cliente_proveedor,
              serie_comprobante: row.serie_comprobante,
              numero_comprobante: row.numero_comprobante,
              tipo_comprobante: row.tipo_comprobante,
              descripcion_comprobante: row.descripcion_comprobante,
              clickedColumn: 'descripcion_comprobante'
          };
      } else if (clickedColumn === 'tipo_cambio') {
           newSelection = {
              fecha_vencimiento: row.fecha_vencimiento,
              fecha_comprobante: row.fecha_comprobante,
              codigo_cliente_proveedor: row.codigo_cliente_proveedor,
              cliente_proveedor: row.cliente_proveedor,
              serie_comprobante: row.serie_comprobante,
              numero_comprobante: row.numero_comprobante,
              tipo_comprobante: row.tipo_comprobante,
              descripcion_comprobante: row.descripcion_comprobante,
              tipo_cambio: row.tipo_cambio,
              clickedColumn: 'tipo_cambio'
          };
      } else if (clickedColumn === 'sumario') {
           newSelection = {
              fecha_vencimiento: row.fecha_vencimiento,
              fecha_comprobante: row.fecha_comprobante,
              codigo_cliente_proveedor: row.codigo_cliente_proveedor,
              cliente_proveedor: row.cliente_proveedor,
              serie_comprobante: row.serie_comprobante,
              numero_comprobante: row.numero_comprobante,
              tipo_comprobante: row.tipo_comprobante,
              descripcion_comprobante: row.descripcion_comprobante,
              tipo_cambio: row.tipo_cambio,
              clickedColumn: 'sumario'
          };
      }


          setDetalleSeleccion(newSelection);


  }, [detalleSeleccion, setDetalleSeleccion]); // Dependencias: estado de selección y setter del contexto


  // ===== Funciones para el modal del PDF (Usando Axios) (se mantienen igual) =====
  const handlePdfIconClick = useCallback(async (rutaPdfBackend?: string | null) => { // Hacemos la función async
    setPdfError(null); // Limpiar errores previos
    setPdfUrl(null); // Limpiar URL previa
    setIsPdfModalOpen(true); // Abrir el modal inmediatamente
    setIsLoadingPdf(true); // Indicar que está cargando

    if (!rutaPdfBackend) {
      setPdfError("No hay PDF disponible para esta cuenta.");
      setIsLoadingPdf(false);
      return;
    }

    try {
      // Codificar la ruta antes de usarla en la URL
      const encodedRuta = encodeURIComponent(rutaPdfBackend);
      // Construir la URL del endpoint del backend (solo la parte relativa si usas baseURL en Axios)
      // Axios usará la baseURL configurada en api.ts
      const backendPdfEndpoint = `/administracion/pdf?ruta=${encodedRuta}`;

      // --- INICIO: Lógica para obtener el PDF como Blob usando Axios ---
      const response = await api.get(backendPdfEndpoint, {
        responseType: 'blob', // Importante: le dice a Axios que espere una respuesta binaria
        // Axios ya maneja los encabezados de autenticación gracias al interceptor en api.ts
      });

      if (response.status !== 200) {
        // Si la respuesta no es 200 OK
        let errorDetail = `Error al cargar el PDF: ${response.status} ${response.statusText}`;
         // Axios puede poner el cuerpo del error en response.data si no es un blob esperado
         if (response.data instanceof Blob) {
             // Si es un blob de error, intentar leerlo como texto
             try {
                 const errorText = await response.data.text();
                 if (errorText) {
                     errorDetail += ` - ${errorText}`;
                 }
             } catch (e) {
                 console.error("Could not read error blob as text:", e);
             }
         } else if (response.data) {
             // Si response.data no es un blob (ej: JSON de error del backend)
             try {
                 errorDetail += ` - ${JSON.stringify(response.data)}`;
             } catch (e) {
                 errorDetail += ` - ${String(response.data)}`;
             }
         }
        throw new Error(errorDetail);
      }

      // Obtener el contenido como blob (Axios ya lo proporciona en response.data si responseType es 'blob')
      const pdfBlob = response.data;

      // Crear una URL de objeto para el blob
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url); // Establecer la URL del blob para el iframe
      // --- FIN: Lógica para obtener el PDF como Blob usando Axios ---

    } catch (error: any) {
      console.error("Error fetching PDF:", error);
      // Manejar errores específicos de Axios si es necesario (ej: error.response, error.request)
      let errorMessage = "No se pudo cargar el PDF.";
      if (error.response) {
          // El servidor respondió con un estado fuera del rango 2xx
          errorMessage += ` Detalles: ${error.response.status} ${error.response.statusText}`;
          if (error.response.data) {
              try {
                  // Intenta leer el cuerpo del error si el backend envía JSON de error
                  errorMessage += ` - ${JSON.stringify(error.response.data)}`;
              } catch (e) {
                  // Si no es JSON, intenta como texto
                  errorMessage += ` - ${String(error.response.data)}`;
              }
          }
      } else if (error.request) {
          // La solicitud fue hecha pero no se recibió respuesta
          errorMessage += " No se recibió respuesta del servidor.";
      } else {
          // Algo más causó el error
          errorMessage += ` Detalles: ${error.message}`;
      }
      setPdfError(errorMessage);
      setPdfUrl(null); // Asegurarse de que no haya URL si hay error
    } finally {
      setIsLoadingPdf(false); // Finalizar la carga
    }
  }, []); // Dependencias vacías ya que no usa props/estado que cambien

  const handleClosePdfModal = useCallback(() => {
    setIsPdfModalOpen(false);
    // Limpiar la URL del objeto cuando el modal se cierra para liberar memoria
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null); // Limpiar la URL al cerrar el modal
    setPdfError(null); // Limpiar errores
    setIsLoadingPdf(false);
  }, [pdfUrl]); // Añadimos pdfUrl a las dependencias para revocarlo correctamente

  // Opcional: Manejar errores de carga del iframe (puede ser complicado)
  // const handleIframeError = useCallback(() => {
  //   setPdfError("No se pudo cargar el PDF en el visor. Verifica la ruta o los permisos.");
  //   setIsLoadingPdf(false);
  //   setPdfUrl(null); // Limpiar URL para evitar reintentos
  // }, []);


  // Header/footer color #6C7AE0 y letras blancas
  const headerFooterStyle = {
    background: '#6495ED',
    color: '#fff',
    fontWeight: 700,
    borderRadius: 0,
    borderBottom: '1px solid #4f5ba6',
    letterSpacing: 0.5,
  };

   // Formato para los importes
  const formatImporte = (num: number) =>
    num.toLocaleString('en-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); 
  // Fila de la tabla
  const Row = React.useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = orderedRows[index];
    const prev = index > 0 ? orderedRows[index - 1] : undefined;
    const showFechaVenc = !prev || row.fecha_vencimiento !== prev.fecha_vencimiento;
    const showFechaComp = !prev || row.fecha_comprobante !== prev.fecha_comprobante;
    const showCodCliPro = !prev || row.fecha_comprobante + '|' + row.codigo_cliente_proveedor !== prev.fecha_comprobante + '|' + prev.codigo_cliente_proveedor;
    const showCliPro = !prev || row.fecha_comprobante + '|' + row.cliente_proveedor !== prev.fecha_comprobante + '|' + prev.cliente_proveedor;    
    const showSerie = !prev || row.fecha_comprobante + '|' + (row.cliente_proveedor + '|' + row.serie_comprobante) !== prev.fecha_comprobante + '|' + (prev.cliente_proveedor + '|' + prev.serie_comprobante);

    // Calcula el porcentaje de pendiente_cobrar
    const pendientePorcentaje = row.importe_original !== 0
      ? (row.pendiente_cobrar) * 100
      : 0;

    // Lógica para determinar si la fila actual coincide con la selección del contexto (se mantiene igual para el resaltado)
    const isSelected =
        detalleSeleccion.clickedColumn && // Solo resaltar si hay una columna clickeada
        (detalleSeleccion.fecha_vencimiento === undefined || row.fecha_vencimiento === detalleSeleccion.fecha_vencimiento) &&
        (detalleSeleccion.fecha_comprobante === undefined || row.fecha_comprobante === detalleSeleccion.fecha_comprobante) &&
        (detalleSeleccion.codigo_cliente_proveedor === undefined || row.codigo_cliente_proveedor === detalleSeleccion.codigo_cliente_proveedor) &&
        (detalleSeleccion.cliente_proveedor === undefined || row.cliente_proveedor === detalleSeleccion.cliente_proveedor) &&
        (detalleSeleccion.serie_comprobante === undefined || row.serie_comprobante === detalleSeleccion.serie_comprobante) &&
        (detalleSeleccion.numero_comprobante === undefined || row.numero_comprobante === detalleSeleccion.numero_comprobante) &&
        (detalleSeleccion.tipo_comprobante === undefined || row.tipo_comprobante === detalleSeleccion.tipo_comprobante) &&
        (detalleSeleccion.descripcion_comprobante === undefined || row.descripcion_comprobante === detalleSeleccion.descripcion_comprobante) &&
        (detalleSeleccion.tipo_cambio === undefined || row.tipo_cambio === detalleSeleccion.tipo_cambio);


    return (
      <div
        style={style}
        className={[
          "flex items-center px-2 py-1 cursor-pointer text-[11px] border-b transition-colors",
          isSelected // Usamos la nueva lógica isSelected
            ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-700 dark:text-white font-bold"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
          "hover:bg-blue-50 dark:hover:bg-gray-700"
        ].join(" ")}
      >
        {/* Añadir onClick a cada celda */}
        <div style={{ width: '6%' }} onClick={() => handleCellClick(row, 'fecha_vencimiento')}>{showFechaVenc ? formatDateYYYYMMDD(row.fecha_vencimiento) : ''}</div>
        <div style={{ width: '6%' }} onClick={() => handleCellClick(row, 'fecha_comprobante')}>{showFechaComp ? formatDateYYYYMMDD(row.fecha_comprobante) : ''}</div>
        <div style={{ width: '6%' }} onClick={() => handleCellClick(row, 'codigo_cliente_proveedor')}>{showCodCliPro ? row.codigo_cliente_proveedor : ''}</div>
        <div style={{ width: '21%' }} onClick={() => handleCellClick(row, 'cliente_proveedor')}>{showCliPro ? row.cliente_proveedor : ''}</div>
        <div style={{ width: '5%' }} onClick={() => handleCellClick(row, 'serie_comprobante')}>{showSerie ? row.serie_comprobante : ''}</div>
        <div style={{ width: '7%' }} onClick={() => handleCellClick(row, 'numero_comprobante')}>{row.numero_comprobante}</div>
        {/* ===== Celda para el icono del PDF (al lado de Número) ===== */}
        <div style={{ width: '4%', textAlign: 'center' }}> {/* Ajusta el ancho según necesites */}
          {row.ruta_comprobante_pdf ? (
            // Envolvemos el icono en un span para añadir el tooltip 'title'
            <span
              onClick={(e) => {
                e.stopPropagation(); // Evita que el click en el icono active el click de la fila
                handlePdfIconClick(row.ruta_comprobante_pdf);
              }}
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} // Estilos para el span
              //title={`Ver PDF: ${row.ruta_comprobante_pdf}`} // Tooltip en el span
            >
              <FileText
                size={14} // Ajusta el tamaño del icono
              />
            </span>
          ) : (
            <span title="No hay PDF disponible">-</span> // O algún indicador visual
          )}
        </div>
        <div style={{ width: '7%' }} onClick={() => handleCellClick(row, 'tipo_comprobante')}>{row.tipo_comprobante}</div>
        <div style={{ width: '12%' }} onClick={() => handleCellClick(row, 'descripcion_comprobante')}>{row.descripcion_comprobante}</div>
        <div style={{ width: '5%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'tipo_cambio')}>{row.tipo_cambio}</div>
        {/* Añadir onClick a las celdas de sumario */}
        <div style={{ width: '7%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {formatImporte(row.importe_original)}
        </div>
        <div style={{ width: '7%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {formatImporte(row.importe_soles)}
        </div>
        <div style={{ width: '7%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {formatImporte(row.importe_dolares)}
        </div>
        <div style={{ width: '7%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {formatImporte(row.importe_moneda_funcional)}
        </div>
        <div style={{ width: '7%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {pendientePorcentaje.toLocaleString(undefined, { minimumFractionDigits: 2 })}%
        </div>
      </div>
    );
  }, [orderedRows, detalleSeleccion, handleCellClick, handlePdfIconClick]); // Añadir detalleSeleccion y handleCellClick a las dependencias

  return (
    <div className="p-0 text-xs relative">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-xs font-bold">Detalle</h2>
        <ExportButtons /> {/* Botones añadidos aquí */}
      </div>
      <div style={{ position: 'relative', paddingBottom: 32 }}>
        <div
          className="text-xs flex px-2 py-1"
          style={{
          ...headerFooterStyle,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
        >
          <div style={{ width: '6%' }}>Fecha Venc.</div>
          <div style={{ width: '6%' }}>Fecha Comp.</div>
          <div style={{ width: '6%' }}>Cód. Cliente</div>
          <div style={{ width: '21%' }}>Cliente/Proveedor</div>
          <div style={{ width: '5%' }}>Serie</div>
          <div style={{ width: '7%' }}>Número</div>
          {/* ===== Encabezado para el icono del PDF (al lado de Número) ===== */}
          <div style={{ width: '4%', textAlign: 'center' }}>PDF</div> {/* Ajusta el ancho */}
          <div style={{ width: '4%' }}>Tipo</div>
          <div style={{ width: '12%' }}>Descripción</div>
          <div style={{ width: '5%', textAlign: 'right' }}>T.C.</div>
          <div style={{ width: '7%', textAlign: 'right' }}>Imp. Orig.</div>
          <div style={{ width: '7%', textAlign: 'right'}}>Soles</div>
          <div style={{ width: '7%', textAlign: 'right'}}>Dolares</div>
          <div style={{ width: '7%', textAlign: 'right'}}>Funcional</div>
          <div style={{ width: '7%', textAlign: 'right' }}>% Pend.</div>
        </div>
        {orderedRows.length > 0 ? (
          <List
            height={320}
            itemCount={orderedRows.length}
            itemSize={16}
            width="100%"
          >
            {Row}
          </List>
        ) : (
          <div className="text-center py-2 text-gray-400 text-xs">Sin datos</div>
        )}
        {/* Footer fijo */}
        <div
          style={{
            ...headerFooterStyle,
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            height: 25,
            padding: '0 8px',
            borderTop: '1px solid #4f5ba6',
            borderBottom: 'none',
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
          }}
        >
          {/* Celdas del footer */}
          <div style={{ width: '6%' }}></div>
          <div style={{ width: '6%' }}></div>
          <div style={{ width: '6%' }}></div>
          <div style={{ width: '21%' }}>Totales:</div>
          <div style={{ width: '5%' }}></div>
          <div style={{ width: '7%' }}></div>
          {/* ===== Celda vacía para alinear con la columna del icono PDF ===== */}
          <div style={{ width: '4%' }}></div> {/* Ajusta el ancho */}
          <div style={{ width: '4%' }}></div>
          <div style={{ width: '12%' }}></div>
          <div style={{ width: '5%' }}></div>
          <div style={{ width: '7%', textAlign: 'right' }}>
            {formatImporte(totals.original)}
          </div>
          <div style={{ width: '7%', textAlign: 'right' }}>
            {formatImporte(totals.soles)}
          </div>
          <div style={{ width: '7%', textAlign: 'right' }}>
            {formatImporte(totals.dolares)}
          </div>
          <div style={{ width: '7%', textAlign: 'right' }}>
            {formatImporte(totals.funcional)}
          </div>
          <div style={{ width: '7%', textAlign: 'right' }}>
            {/* Manejar división por cero para el total */}
            {totals.original !== 0 ? (totals.pendiente * 100).toLocaleString(undefined, { minimumFractionDigits: 2 }) : (0).toLocaleString(undefined, { minimumFractionDigits: 2 })}%
          </div>
        </div>
      </div>

      {/* ===== Modal para mostrar el PDF ===== */}
      {/* Reemplaza SimpleModal con tu componente Modal real si usas una librería de UI */}
      <SimpleModal isOpen={isPdfModalOpen} onClose={handleClosePdfModal}>
        <div style={{ width: '46vw', height: '80vh', display: 'flex', flexDirection: 'column' }}> {/* Ajusta el tamaño del modal */}

          {isLoadingPdf && <p>Cargando PDF...</p>}
          {pdfError && <p style={{ color: 'red' }}>Error: {pdfError}</p>}
          {!isLoadingPdf && !pdfError && pdfUrl && (
            <iframe
              src={pdfUrl}
              style={{ flexGrow: 1, border: 'none' }} // Iframe ocupa el espacio restante
              title="Visualizador de PDF"
              // onError={handleIframeError} // Opcional: intentar capturar errores
            >
              Tu navegador no soporta iframes.
            </iframe>
          )}
          {!isLoadingPdf && !pdfError && !pdfUrl && (
              // Mostrar un mensaje si no hay PDF para visualizar (ej: después de un error o si la ruta era nula)
              <p>{pdfError ? '' : 'Selecciona un PDF para visualizar.'}</p>
          )}
          {/* El botón de cerrar ya está en SimpleModal, puedes añadir uno aquí si tu Modal no lo tiene */}
          {/* <button onClick={handleClosePdfModal}>Cerrar</button> */}
        </div>
      </SimpleModal>
    </div>
  );
});

DetalleCuentasCobrarPagar.displayName = 'DetalleCuentasCobrarPagar';