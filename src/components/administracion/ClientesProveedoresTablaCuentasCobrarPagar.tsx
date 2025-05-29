// src/components/administracion/ClientesProveedoresTablaCuentasCobrarPagar.tsx
import React from 'react';
import { FixedSizeList as List } from 'react-window';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Sheet } from 'lucide-react';
// [MODIFICADO] Importar dataSinFiltroClienteProveedor del contexto
import { useCuentasCobrarPagar } from '../../context/CuentasCobrarPagarContext';

interface Props {
  // Eliminamos la prop data ya que usaremos dataSinFiltroClienteProveedor del contexto
  // data: CuentaCobrarPagar[];
}

interface RowData {
  cliente_proveedor: string;
  moneda: string | null;
  importe_soles: number;
  importe_dolares: number;
  importe_moneda_funcional: number;
  participacion: number; // % participación de la fila (cliente+moneda)
  isFirst: boolean;      // Para merge cell visual
  rowsInGroup: number;   // Para merge cell visual
}

// Tipo para las columnas clickeables
type ClickableColumn = 'cliente_proveedor' | 'moneda' | 'sumario';


export const ClientesProveedoresTablaCuentasCobrarPagar: React.FC<Props> = React.memo(() => { // Eliminamos la prop data
  // [MODIFICADO] Usar el nuevo estado y setter del contexto y dataSinFiltroClienteProveedor
  const { clienteProveedorSeleccion, setClienteProveedorSeleccion, dataSinFiltroClienteProveedor } = useCuentasCobrarPagar();

  // 1. Agrupa y suma por cliente_proveedor y moneda
  // [MODIFICADO] Usar dataSinFiltroClienteProveedor en lugar de data
  const groupedByCliente = React.useMemo(() => {
    // Map: cliente_proveedor -> Map<moneda, RowData>
    const clienteMap = new Map<string, Map<string, RowData>>();
    dataSinFiltroClienteProveedor.forEach(item => {
      const cliente = item.cliente_proveedor ?? '';
      const moneda = item.moneda ?? '';
      if (!clienteMap.has(cliente)) {
        clienteMap.set(cliente, new Map());
      }
      const monedaMap = clienteMap.get(cliente)!;
      if (!monedaMap.has(moneda)) {
        monedaMap.set(moneda, {
          cliente_proveedor: cliente,
          moneda,
          importe_soles: 0,
          importe_dolares: 0,
          importe_moneda_funcional: 0,
          participacion: 0,
          isFirst: false,
          rowsInGroup: 0,
        });
      }
      const row = monedaMap.get(moneda)!;
      row.importe_soles += Number(item.importe_soles ?? 0);
      row.importe_dolares += Number(item.importe_dolares ?? 0);
      row.importe_moneda_funcional += Number(item.importe_moneda_funcional ?? 0);
    });
    return clienteMap;
  }, [dataSinFiltroClienteProveedor]); // [MODIFICADO] Dependencia: dataSinFiltroClienteProveedor

  // 2. Total general de importe_moneda_funcional
  const totalFuncional = React.useMemo(() => {
    let total = 0;
    groupedByCliente.forEach(monedaMap => {
      monedaMap.forEach(row => {
        total += row.importe_moneda_funcional;
      });
    });
    return total;
  }, [groupedByCliente]);

  // 3. Construye las filas ordenadas: primero por cliente (merge cell visual), luego por % participación (descendente)
  const orderedRows = React.useMemo(() => {
    // Array de clientes
    const clientes = Array.from(groupedByCliente.entries()).map(([cliente, monedaMap]) => ({
      cliente,
      monedas: Array.from(monedaMap.values()),
    }));

    // Para cada fila, calcula su % de participación
    clientes.forEach(clienteObj => {
      clienteObj.monedas.forEach(row => {
        row.participacion = totalFuncional > 0 ? row.importe_moneda_funcional / totalFuncional : 0;
      });
    });

    // Ordena cada grupo de monedas por % participación descendente
    clientes.forEach(clienteObj => {
      clienteObj.monedas.sort((a, b) => b.participacion - a.participacion);
    });

    // Ordena los clientes por el % participación de su fila de mayor participación
    clientes.sort((a, b) => {
      const maxA = a.monedas.length > 0 ? a.monedas[0].participacion : 0;
      const maxB = b.monedas.length > 0 ? b.monedas[0].participacion : 0;
      return maxB - maxA;
    });

    // Para merge cell visual: marca la primera fila de cada grupo de cliente
    const rows: RowData[] = [];
    clientes.forEach(clienteObj => {
      clienteObj.monedas.forEach((row, idx) => {
        rows.push({
          ...row,
          isFirst: idx === 0,
          rowsInGroup: clienteObj.monedas.length,
        });
      });
    });
    return rows;
  }, [groupedByCliente, totalFuncional]);

  const filteredRows = React.useMemo(() => {
  if (!clienteProveedorSeleccion.clickedColumn) return orderedRows;
  return orderedRows.filter(row =>
    (clienteProveedorSeleccion.cliente_proveedor === undefined || row.cliente_proveedor === clienteProveedorSeleccion.cliente_proveedor) &&
    (clienteProveedorSeleccion.moneda === undefined || row.moneda === clienteProveedorSeleccion.moneda)
  );
}, [orderedRows, clienteProveedorSeleccion]);


  // 4. Totales
  // [MODIFICADO] Calcular totales basados en orderedRows (que ahora usa dataSinFiltroClienteProveedor)
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
        cliente_proveedor: row.cliente_proveedor,
        Moneda: row.moneda || 'N/A',
        "Importe Soles": row.importe_soles,
        "Importe Dólares": row.importe_dolares,
        "Importe Funcional": row.importe_moneda_funcional,
      }));

      const ws = XLSX.utils.json_to_sheet(datosExportar);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ClienteProveedor");
      XLSX.writeFile(wb, `Cliente_Proveedor_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    const exportToPDF = () => {
        try {
          const doc = new jsPDF('landscape');
          const title = "Reporte - Cliente/Proveedor";

          // Definición de tipos específicos para jspdf-autotable
          type PDFCell = string | number | { content: string; styles?: { halign?: 'left' | 'center' | 'right' } };
          type PDFRow = PDFCell[];

          const headers: PDFRow = [
            'Cliente/Proveedor',
            'Moneda',
            'Soles',
            'Dólares',
            'Funcional'
          ];

          const body: PDFRow[] = orderedRows.map(row => [
            row.cliente_proveedor,
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

          doc.save(`Cliente_Proveedor_${new Date().toISOString().slice(0, 10)}.pdf`);
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
      if (clickedColumn === 'cliente_proveedor') {
          newSelection = {
              cliente_proveedor: row.cliente_proveedor,
              clickedColumn: 'cliente_proveedor'
          };
      } else if (clickedColumn === 'moneda' || clickedColumn === 'sumario') {
           newSelection = {
              cliente_proveedor: row.cliente_proveedor,
              moneda: row.moneda ?? undefined,
              clickedColumn: clickedColumn
          };
      }

          setClienteProveedorSeleccion(newSelection);


  }, [clienteProveedorSeleccion, setClienteProveedorSeleccion]); // Dependencias: estado de selección y setter del contexto

  // Renderizado de filas
  const Row = React.useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const row = orderedRows[index];
    const prev = index > 0 ? orderedRows[index - 1] : undefined;

    // Lógica para merge cell visual (se mantiene igual)
    const showCliente = !prev || row.cliente_proveedor !== prev.cliente_proveedor;
    const showMoneda = !prev || row.moneda !== prev.moneda || row.cliente_proveedor !== prev.cliente_proveedor;


    // Lógica para determinar si la fila actual coincide con la selección del contexto (se mantiene igual para el resaltado)
    const isSelected =
        clienteProveedorSeleccion.clickedColumn && // Solo resaltar si hay una columna clickeada
        (clienteProveedorSeleccion.cliente_proveedor === row.cliente_proveedor) && // Siempre debe coincidir el cliente
        (clienteProveedorSeleccion.moneda === row.moneda);


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
        <div style={{ width: '38%' }} onClick={() => handleCellClick(row, 'cliente_proveedor')}>
          {showCliente ? row.cliente_proveedor : ''}
        </div>
        <div style={{ width: '6%' }} onClick={() => handleCellClick(row, 'moneda')}>{showMoneda ? row.moneda : ''}</div>
        <div style={{ width: '13%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {formatImporte(row.importe_soles)}
        </div>
        <div style={{ width: '13%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {formatImporte(row.importe_dolares)}
        </div>
        <div style={{ width: '15%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {formatImporte(row.importe_moneda_funcional)}
        </div>
        <div style={{ width: '15%', textAlign: 'right' }} onClick={() => handleCellClick(row, 'sumario')}>
          {(row.participacion * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
        </div>
      </div>
    );
  }, [orderedRows, clienteProveedorSeleccion, handleCellClick]); // Añadir clienteProveedorSeleccion y handleCellClick a las dependencias

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
        <h2 className="text-xs font-bold">Clientes/Proveedores</h2>
        <ExportButtons />
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
          <div style={{ width: '38%' }}>Cliente/Proveedor</div>
          <div style={{ width: '6%' }}>Moneda</div>
          <div style={{ width: '13%', textAlign: 'right' }}>Soles</div>
          <div style={{ width: '13%', textAlign: 'right' }}>Dolares</div>
          <div style={{ width: '15%', textAlign: 'right' }}>Funcional</div>
          <div style={{ width: '15%', textAlign: 'right' }}>% Particip.</div>
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
          <div style={{ width: '38%' }}></div>
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
          <div style={{ width: '15%', textAlign: 'right' }}></div>
        </div>
      </div>
    </div>
  );
});

ClientesProveedoresTablaCuentasCobrarPagar.displayName = 'ClientesProveedoresTablaCuentasCobrarPagar';