// src/components/administracion/MotivoVentaTablaCuentasCobrarPagar.tsx
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Sheet } from 'lucide-react';
// [MODIFICADO] Importar dataSinFiltroMotivoVenta del contexto
import { useCuentasCobrarPagar } from '../../context/CuentasCobrarPagarContext';

interface Props {
  // Eliminamos la prop data ya que usaremos dataSinFiltroMotivoVenta del contexto
  // data: CuentaCobrarPagar[];
}

interface RowData {
  serie_comprobante: string;
  responsable: string;
  servicio: string;
  moneda: string | null;
  importe_soles: number;
  importe_dolares: number;
  importe_moneda_funcional: number;
}

export const MotivoVentaTablaCuentasCobrarPagar: React.FC<Props> = React.memo(({
  // Eliminamos la prop data
  // data,
}) => {
  // [MODIFICADO] Usar el contexto para obtener el estado de selección y dataSinFiltroMotivoVenta
  const { motivoVentaSeleccion, setMotivoVentaSeleccion, dataSinFiltroMotivoVenta } = useCuentasCobrarPagar();

  // 1. Agrupa y suma por las 4 primeras columnas
  // [MODIFICADO] Usar dataSinFiltroMotivoVenta en lugar de data
  const groupedRows = React.useMemo(() => {
    const map = new Map<string, RowData>();
    dataSinFiltroMotivoVenta.forEach(item => {
      const key = [
        item.serie_comprobante ?? '',
        item.responsable ?? '',
        item.servicio ?? '',
        item.moneda ?? '',
      ].join('|');
      if (!map.has(key)) {
        map.set(key, {
          serie_comprobante: item.serie_comprobante ?? '',
          responsable: item.responsable ?? '',
          servicio: item.servicio ?? '',
          moneda: item.moneda ?? '',
          importe_soles: 0,
          importe_dolares: 0,
          importe_moneda_funcional: 0,
        });
      }
      const row = map.get(key)!;
      row.importe_soles += Number(item.importe_soles ?? 0);
      row.importe_dolares += Number(item.importe_dolares ?? 0);
      row.importe_moneda_funcional += Number(item.importe_moneda_funcional ?? 0);
    });
    return Array.from(map.values());
  }, [dataSinFiltroMotivoVenta]); // [MODIFICADO] Dependencia: dataSinFiltroMotivoVenta

  // 2. Agrupa por serie, responsable y calcula el total funcional por serie
 const seriesGroups = React.useMemo(() => {
  // Map<serie, Map<responsable, Map<servicio, { totalFuncional: number; rows: RowData[] }>>
  const map = new Map<
    string,
    Map<string, Map<string, { totalFuncional: number; rows: RowData[] }>>
  >();
  groupedRows.forEach(row => {
    const serie = row.serie_comprobante;
    const responsable = row.responsable;
    const servicio = row.servicio;
    if (!map.has(serie)) {
      map.set(serie, new Map());
    }
    const responsableMap = map.get(serie)!;
    if (!responsableMap.has(responsable)) {
      responsableMap.set(responsable, new Map());
    }
    const servicioMap = responsableMap.get(responsable)!;
    if (!servicioMap.has(servicio)) {
      servicioMap.set(servicio, { totalFuncional: 0, rows: [] });
    }
    const group = servicioMap.get(servicio)!;
    group.totalFuncional += row.importe_moneda_funcional;
    group.rows.push(row);
  });
  return map;
}, [groupedRows]);

  // 3. Ordena las series por total funcional descendente
  const orderedRows = React.useMemo(() => {
  // Ordenar series por el total funcional descendente (sumando todos los responsables y servicios)
  const orderedSeries = Array.from(seriesGroups.entries())
    .map(([serie, responsablesMap]) => {
      const totalFuncional = Array.from(responsablesMap.values()).reduce(
        (acc, serviciosMap) =>
          acc +
          Array.from(serviciosMap.values()).reduce(
            (acc2, group) => acc2 + group.totalFuncional,
            0
          ),
        0
      );
      return { serie, responsablesMap, totalFuncional };
    })
    .sort((a, b) => b.totalFuncional - a.totalFuncional);

  const result: RowData[] = [];
  for (const { responsablesMap } of orderedSeries) {
    // Ordenar responsables por total funcional descendente
    const orderedResponsables = Array.from(responsablesMap.entries())
      .map(([responsable, serviciosMap]) => {
        const totalFuncional = Array.from(serviciosMap.values()).reduce(
          (acc, group) => acc + group.totalFuncional,
          0
        );
        return { responsable, serviciosMap, totalFuncional };
      })
      .sort((a, b) => b.totalFuncional - a.totalFuncional);

    for (const { serviciosMap } of orderedResponsables) {
      // Ordenar servicios por total funcional descendente
      const orderedServicios = Array.from(serviciosMap.entries())
        .map(([servicio, group]) => ({
          servicio,
          group,
        }))
        .sort((a, b) => b.group.totalFuncional - a.group.totalFuncional);

      for (const { group } of orderedServicios) {
        group.rows.sort((a, b) => {
          if (b.importe_moneda_funcional !== a.importe_moneda_funcional) {
            return b.importe_moneda_funcional - a.importe_moneda_funcional;
          }
          if ((a.moneda ?? '') !== (b.moneda ?? '')) return (a.moneda ?? '').localeCompare(b.moneda ?? '');
          return 0;
        });
        result.push(...group.rows);
      }
    }
  }
  return result;
}, [seriesGroups]);

const filteredRows = React.useMemo(() => {
  // Si no hay selección, muestra todo
  if (!motivoVentaSeleccion.clickedColumn) return orderedRows;
  return orderedRows.filter(row =>
    (motivoVentaSeleccion.serie_comprobante === undefined || row.serie_comprobante === motivoVentaSeleccion.serie_comprobante) &&
    (motivoVentaSeleccion.responsable === undefined || row.responsable === motivoVentaSeleccion.responsable) &&
    (motivoVentaSeleccion.servicio === undefined || row.servicio === motivoVentaSeleccion.servicio) &&
    (motivoVentaSeleccion.moneda === undefined || row.moneda === motivoVentaSeleccion.moneda)
  );
}, [orderedRows, motivoVentaSeleccion]);

  // 4. Totales
  // [MODIFICADO] Calcular totales basados en orderedRows (que ahora usa dataSinFiltroMotivoVenta)
  const totals = React.useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.soles += row.importe_soles;
        acc.dolares += row.importe_dolares;
        acc.funcional += row.importe_moneda_funcional;
        return acc;
      },
      { soles: 0, dolares: 0, funcional: 0 }
    );
  }, [filteredRows]);

  // ===== Funciones de exportación (se mantienen igual, usan orderedRows) =====
  const exportToExcel = () => {
    const datosExportar = orderedRows.map(row => ({
      Serie: row.serie_comprobante,
      Responsable: row.responsable,
      Servicio: row.servicio,
      Moneda: row.moneda || 'N/A',
      "Importe Soles": row.importe_soles,
      "Importe Dólares": row.importe_dolares,
      "Importe Funcional": row.importe_moneda_funcional,
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MotivoVenta");
    XLSX.writeFile(wb, `Motivo_Venta_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF('landscape');
      const title = "Reporte - Motivo de Venta";

      type PDFCell = string | number | { content: string; styles?: { halign?: 'left' | 'center' | 'right' } };
      type PDFRow = PDFCell[];

      const headers: PDFRow = [
        'Serie',
        'Responsable',
        'Servicio',
        'Moneda',
        'Soles',
        'Dólares',
        'Funcional'
      ];

      const body: PDFRow[] = orderedRows.map(row => [
        row.serie_comprobante,
        row.responsable,
        row.servicio,
        row.moneda || 'N/A',
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
          4: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' }
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          halign: 'left'
        }
      });

      doc.save(`Motivo_Venta_${new Date().toISOString().slice(0, 10)}.pdf`);
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
  const handleCellClick = React.useCallback((row: RowData, clickedColumn: 'serie_comprobante' | 'responsable' | 'servicio' | 'moneda' | 'sumario') => {
      let newSelection = {};

      // Construir la nueva selección basada en la columna clickeada
      if (clickedColumn === 'serie_comprobante') {
          newSelection = {
              serie_comprobante: row.serie_comprobante,
              clickedColumn: 'serie_comprobante'
          };
      } else if (clickedColumn === 'responsable') {
           newSelection = {
              serie_comprobante: row.serie_comprobante,
              responsable: row.responsable,
              clickedColumn: 'responsable'
          };
      } else if (clickedColumn === 'servicio') {
           newSelection = {
              serie_comprobante: row.serie_comprobante,
              responsable: row.responsable,
              servicio: row.servicio,
              clickedColumn: 'servicio'
          };
      } else if (clickedColumn === 'moneda') {
           newSelection = {
              serie_comprobante: row.serie_comprobante,
              responsable: row.responsable,
              servicio: row.servicio,
              moneda: row.moneda,
              clickedColumn: 'moneda'
          };
      } else if (clickedColumn === 'sumario') {
           newSelection = {
              serie_comprobante: row.serie_comprobante,
              responsable: row.responsable,
              servicio: row.servicio,
              moneda: row.moneda,
              clickedColumn: 'sumario'
          };
      }

      // Llamar al setter del contexto para actualizar la selección
      setMotivoVentaSeleccion(newSelection);

  }, [setMotivoVentaSeleccion]); // Dependencia del setter del contexto

  // Renderizado de filas
  const Row = React.useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = orderedRows[index];
    const prev = index > 0 ? orderedRows[index - 1] : undefined;

    const showSerie = !prev || row.serie_comprobante !== prev.serie_comprobante;
    const showResponsable = !prev || row.responsable !== prev.responsable || row.serie_comprobante !== prev.serie_comprobante;
    const showServicio = !prev || row.servicio !== prev.servicio || row.responsable !== prev.responsable || row.serie_comprobante !== prev.serie_comprobante;
    const showMoneda = !prev || row.moneda !== prev.moneda || row.servicio !== prev.servicio || row.responsable !== prev.responsable || row.serie_comprobante !== prev.serie_comprobante;

    // Lógica para determinar si la fila actual coincide con la selección del contexto (se mantiene igual para el resaltado)
    const isSelected =
        motivoVentaSeleccion.clickedColumn &&
        (motivoVentaSeleccion.serie_comprobante === undefined || row.serie_comprobante === motivoVentaSeleccion.serie_comprobante) &&
        (motivoVentaSeleccion.responsable === undefined || row.responsable === motivoVentaSeleccion.responsable) &&
        (motivoVentaSeleccion.servicio === undefined || row.servicio === motivoVentaSeleccion.servicio) &&
        (motivoVentaSeleccion.moneda === undefined || row.moneda === motivoVentaSeleccion.moneda);


    return (
      <div
        style={style}
        className={[
          "flex items-center px-2 py-1 cursor-pointer text-[11px] border-b transition-colors",
          isSelected // Usamos la lógica isSelected para el resaltado
            ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-700 dark:text-white font-bold"
            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
          "hover:bg-blue-50 dark:hover:bg-gray-700"
        ].join(" ")}
      >
        {/* Añadir onClick a cada celda */}
        <div style={{ width: '6%' }} onClick={() => handleCellClick(row, 'serie_comprobante')}>{showSerie ? row.serie_comprobante : ''}</div>
        <div style={{ width: '17%' }} onClick={() => handleCellClick(row, 'responsable')}>{showResponsable ? row.responsable : ''}</div>
        <div style={{ width: '30%' }} onClick={() => handleCellClick(row, 'servicio')}>{showServicio ? row.servicio : ''}</div>
        <div style={{ width: '6%' }} onClick={() => handleCellClick(row, 'moneda')}>{showMoneda ? row.moneda : ''}</div>
        {/* Añadir onClick a las celdas de sumario */}
        <div style={{ width: '13%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {formatImporte(row.importe_soles)}
        </div>
        <div style={{ width: '13%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {formatImporte(row.importe_dolares)}
        </div>
        <div style={{ width: '15%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {formatImporte(row.importe_moneda_funcional)}
        </div>
      </div>
    );
  }, [orderedRows, motivoVentaSeleccion, handleCellClick]); // Dependencias: orderedRows, motivoVentaSeleccion, handleCellClick

  // Estilo de header/footer (se mantiene igual)
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

  // ===== Renderizado final =====
  return (
    <div className="p-0 text-xs relative">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-xs font-bold">Motivo de Venta</h2>
        <ExportButtons />
      </div>
      <div style={{ position: 'relative', paddingBottom: 30 }}>
        <div
          className="text-xs flex px-2 py-1"
          style={{
          ...headerFooterStyle,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        }}
        >
          <div style={{ width: '6%' }}>Serie</div>
          <div style={{ width: '17%' }}>Responsable</div>
          <div style={{ width: '30%' }}>Servicio</div>
          <div style={{ width: '6%' }}>Moneda</div>
          <div style={{ width: '13%', textAlign: 'right' }}>Soles</div>
          <div style={{ width: '13%', textAlign: 'right' }}>Dolares</div>
          <div style={{ width: '15%', textAlign: 'right' }}>Funcional</div>
        </div>
        {orderedRows.length > 0 ? (
          <List
            height={250}
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
          <div style={{ width: '6%' }}></div>
          <div style={{ width: '17%' }}></div>
          <div style={{ width: '30%' }}></div>
          <div style={{ width: '6%' }}>Totales:</div>
          <div style={{ width: '13%', textAlign: 'right' }}>
            {formatImporte(totals.soles)}
          </div>
          <div style={{ width: '13%', textAlign: 'right' }}>
            {formatImporte(totals.dolares)}
          </div>
          <div style={{ width: '15%', textAlign: 'right' }}>
            {formatImporte(totals.funcional)}
          </div>
        </div>
      </div>
    </div>
  );
});

MotivoVentaTablaCuentasCobrarPagar.displayName = 'MotivoVentaTablaCuentasCobrarPagar';