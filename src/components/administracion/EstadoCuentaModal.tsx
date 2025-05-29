// src/components/administracion/EstadoCuentaModal.tsx
import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Mail, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CuentaCobrarPagar } from '../../types/administracion.types';

interface EstadoCuentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteSeleccionado: string;
  dataFiltrada: CuentaCobrarPagar[];
}

export const EstadoCuentaModal: React.FC<EstadoCuentaModalProps> = ({
  isOpen,
  onClose,
  clienteSeleccionado,
  dataFiltrada,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Agrupa los datos por moneda
  const monedas = Array.from(new Set(dataFiltrada.map(item => item.moneda || 'PEN')));
  const dataPorMoneda: Record<string, CuentaCobrarPagar[]> = {};
  monedas.forEach(moneda => {
    dataPorMoneda[moneda] = dataFiltrada.filter(item => (item.moneda || 'PEN') === moneda);
  });

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  // Nueva función para obtener el símbolo de la moneda
  const getCurrencySymbol = (moneda: string) => {
    if (moneda === 'USD') return 'US$';
    if (moneda === 'PEN') return 'S/';
    return '';
  };

  // Modifica formatMoney para aceptar moneda
  const formatMoney = (amount: number, moneda?: string) => {
    const symbol = moneda ? getCurrencySymbol(moneda) + ' ' : '';
    return symbol + amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Función para generar PDF
  const generatePDF = () => {
    setIsGeneratingPdf(true);
    try {
      const doc = new jsPDF();
      buildEstadoCuentaPDF(doc);
      doc.save(`Estado_Cuenta_${clienteSeleccionado.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Función para enviar por email
  const sendEmail = async () => {
    if (!emailAddress.trim()) {
      alert('Por favor, ingrese una dirección de correo electrónico válida.');
      return;
    }
    setIsSendingEmail(true);
    try {
      const doc = new jsPDF();
      buildEstadoCuentaPDF(doc);
      const pdfFileName = `Estado_Cuenta_${clienteSeleccionado.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
      doc.save(pdfFileName);

      const subject = encodeURIComponent('Estado de Cuenta');
      const body = encodeURIComponent(
        `Estimado cliente,\n\nAdjunto encontrará el estado de cuenta solicitado.\n\nSaludos cordiales.`
      );
      window.location.href = `mailto:${emailAddress}?subject=${subject}&body=${body}`;

      alert(
        'El PDF se ha descargado. Por favor, adjúntelo manualmente en el correo de Outlook que se abrirá a continuación.'
      );
      setShowEmailInput(false);
      setEmailAddress('');
    } catch (error) {
      console.error('Error al preparar el email:', error);
      alert('Error al preparar el email. Por favor, intente nuevamente.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Función para construir el PDF por cada moneda
  function buildEstadoCuentaPDF(doc: jsPDF) {
    const currentDate = format(new Date(), 'dd/MM/yyyy', { locale: es });

    monedas.forEach((monedaActual, idx) => {
      if (idx > 0) doc.addPage();

      const dataFiltradaMoneda = dataPorMoneda[monedaActual];

      // KPIs para esta moneda
      const uniqueKeys = new Set<string>();
      const montoTotal = dataFiltradaMoneda.reduce((sum, item) => {
        const key = `${item.codigo_cliente_proveedor ?? ''}|${item.numero_comprobante ?? ''}`;
        if (!uniqueKeys.has(key)) {
          uniqueKeys.add(key);
          return sum + Number(item.importe_original || 0);
        }
        return sum;
      }, 0);
      const abonos = montoTotal - dataFiltradaMoneda.reduce((sum, item) => sum + (Number(item.importe_moneda_funcional || 0)), 0);
      const saldoPendiente = dataFiltradaMoneda.reduce((sum, item) => sum + Number(item.importe_moneda_funcional || 0), 0);

      const hoy = new Date();
      const saldoVencido = dataFiltradaMoneda.reduce((sum, item) => {
        if (!item.fecha_vencimiento) return sum;
        const fechaVencimiento = new Date(item.fecha_vencimiento);
        return fechaVencimiento < hoy ? sum + Number(item.importe_moneda_funcional || 0) : sum;
      }, 0);

      // Agrupación para tabla (solo facturas)
      const groupedData = dataFiltradaMoneda.reduce((acc, item) => {
        if (item.tipo_comprobante !== '01') return acc;
        const key = `${item.numero_comprobante || ''}`;
        if (!acc[key]) {
          acc[key] = {
            documento: `${item.numero_comprobante || ''}`,
            fechaDocumento: item.fecha_comprobante || '',
            fechaVencimiento: item.fecha_vencimiento || '',
            importe: Number(item.importe_original || 0),
            saldoPendiente: 0,
            saldoVencido: 0,
            diasVencidos: 0
          };
        }
        acc[key].saldoPendiente += Number(item.importe_moneda_funcional || 0);

        if (item.fecha_vencimiento) {
          const fechaVencimiento = new Date(item.fecha_vencimiento);
          if (fechaVencimiento < hoy) {
            const diasVencidos = Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));
            acc[key].diasVencidos = diasVencidos;
            acc[key].saldoVencido += Number(item.importe_moneda_funcional || 0);
          }
        }
        return acc;
      }, {} as Record<string, {
        documento: string;
        fechaDocumento: string;
        fechaVencimiento: string;
        importe: number;
        saldoPendiente: number;
        saldoVencido: number;
        diasVencidos: number;
      }>);

      const tableData = Object.values(groupedData);
      const totalImporteFacturas = tableData.reduce((sum, row) => sum + row.importe, 0);
      const totalSaldoPendienteFacturas = tableData.reduce((sum, row) => sum + row.saldoPendiente, 0);
      const totalSaldoVencidoFacturas = tableData.reduce((sum, row) => sum + row.saldoVencido, 0);

      // Título
      doc.setFontSize(18);
      doc.text(`Estado de Cuenta en ${getCurrencySymbol(monedaActual)} (${monedaActual})`, 105, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.text(`Fecha: ${currentDate}`, 195, 10, { align: 'right' });
      doc.text(`Cliente: ${clienteSeleccionado}`, 15, 30);

      // KPIs como tarjetas
      const kpiY = 38;
      const kpiHeight = 18;
      const kpiWidth = 42;
      const kpiGap = 6;
      const kpiStartX = 15;
      const kpiColors = [
        [232, 240, 254],
        [232, 250, 240],
        [255, 249, 196],
        [255, 235, 238],
      ];
      const kpiTitles = ['Monto Total', 'Abonos', 'Saldo Pendiente', 'Saldo Vencido'];
      const kpiValues = [
        formatMoney(montoTotal, monedaActual),
        formatMoney(abonos, monedaActual),
        formatMoney(saldoPendiente, monedaActual),
        formatMoney(saldoVencido, monedaActual),
      ];

      for (let i = 0; i < 4; i++) {
        const x = kpiStartX + i * (kpiWidth + kpiGap);
        doc.setFillColor(...kpiColors[i] as [number, number, number]);
        doc.roundedRect(x, kpiY, kpiWidth, kpiHeight, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(kpiTitles[i], x + 4, kpiY + 7);
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30);
        doc.text(kpiValues[i], x + 4, kpiY + 15);
      }
      doc.setTextColor(0, 0, 0);

      // Tabla de documentos (solo facturas)
      autoTable(doc, {
        startY: kpiY + kpiHeight + 10,
        head: [['Documento', 'Fecha Documento', 'Fecha Vencimiento', 'Importe', 'Saldo Pendiente', 'Saldo Vencido', 'Días Vencidos']],
        body: tableData.map(row => [
          row.documento,
          formatDate(row.fechaDocumento),
          formatDate(row.fechaVencimiento),
          formatMoney(row.importe, monedaActual),
          formatMoney(row.saldoPendiente, monedaActual),
          formatMoney(row.saldoVencido, monedaActual),
          row.diasVencidos.toString()
        ]),
        foot: [[
          { content: 'Totales:', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatMoney(totalImporteFacturas, monedaActual), styles: { halign: 'right' } },
          { content: formatMoney(totalSaldoPendienteFacturas, monedaActual), styles: { halign: 'right' } },
          { content: formatMoney(totalSaldoVencidoFacturas, monedaActual), styles: { halign: 'right' } },
          ''
        ]],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [100, 149, 237], textColor: [255, 255, 255] },
        footStyles: { fillColor: [100, 149, 237], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 24 },
          2: { cellWidth: 28 },
          3: { cellWidth: 32, halign: 'right' },
          4: { cellWidth: 32, halign: 'right' },
          5: { cellWidth: 32, halign: 'right' },
          6: { cellWidth: 18, halign: 'center' }
        },
        tableWidth: 'wrap',
        margin: { left: (doc.internal.pageSize.getWidth() - 194) / 2 } // 194 es la suma de los cellWidth arriba
      });
    });
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-11/12 max-w-5xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Estado de Cuenta - {clienteSeleccionado}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4" ref={pdfRef}>
          {/* Cabecera */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Fecha actual: {format(new Date(), 'dd/MM/yyyy', { locale: es })}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={generatePDF}
                disabled={isGeneratingPdf}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
              >
                <FileText size={16} className="mr-1" />
                {isGeneratingPdf ? 'Generando...' : 'Exportar a PDF'}
              </button>
              <button
                onClick={() => setShowEmailInput(!showEmailInput)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
              >
                <Mail size={16} className="mr-1" />
                Enviar por Email
              </button>
            </div>
          </div>
          
          {/* Formulario de email */}
          {showEmailInput && (
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
              <div className="flex items-center">
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="Correo electrónico"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l text-sm"
                  disabled={isSendingEmail}
                />
                <button
                  onClick={sendEmail}
                  disabled={isSendingEmail || !emailAddress.trim()}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-r hover:bg-green-700 disabled:opacity-50"
                >
                  {isSendingEmail ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          )}

          {/* Renderiza un reporte por cada moneda */}
          {monedas.map(monedaActual => {
            const dataFiltradaMoneda = dataPorMoneda[monedaActual];

            // KPIs para esta moneda
            const uniqueKeys = new Set<string>();
            const montoTotal = dataFiltradaMoneda.reduce((sum, item) => {
              const key = `${item.codigo_cliente_proveedor ?? ''}|${item.numero_comprobante ?? ''}`;
              if (!uniqueKeys.has(key)) {
                uniqueKeys.add(key);
                return sum + Number(item.importe_original || 0);
              }
              return sum;
            }, 0);
            const abonos = montoTotal - dataFiltradaMoneda.reduce((sum, item) => sum + (Number(item.importe_moneda_funcional || 0)), 0);
            const saldoPendiente = dataFiltradaMoneda.reduce((sum, item) => sum + Number(item.importe_moneda_funcional || 0), 0);

            const hoy = new Date();
            const saldoVencido = dataFiltradaMoneda.reduce((sum, item) => {
              if (!item.fecha_vencimiento) return sum;
              const fechaVencimiento = new Date(item.fecha_vencimiento);
              return fechaVencimiento < hoy ? sum + Number(item.importe_moneda_funcional || 0) : sum;
            }, 0);

            // Agrupación para tabla (solo facturas)
            const groupedData = dataFiltradaMoneda.reduce((acc, item) => {
              if (item.tipo_comprobante !== '01') return acc;
              const key = `${item.numero_comprobante || ''}`;
              if (!acc[key]) {
                acc[key] = {
                  documento: `${item.numero_comprobante || ''}`,
                  fechaDocumento: item.fecha_comprobante || '',
                  fechaVencimiento: item.fecha_vencimiento || '',
                  importe: Number(item.importe_original || 0),
                  saldoPendiente: 0,
                  saldoVencido: 0,
                  diasVencidos: 0
                };
              }
              acc[key].saldoPendiente += Number(item.importe_moneda_funcional || 0);

              if (item.fecha_vencimiento) {
                const fechaVencimiento = new Date(item.fecha_vencimiento);
                if (fechaVencimiento < hoy) {
                  const diasVencidos = Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));
                  acc[key].diasVencidos = diasVencidos;
                  acc[key].saldoVencido += Number(item.importe_moneda_funcional || 0);
                }
              }
              return acc;
            }, {} as Record<string, {
              documento: string;
              fechaDocumento: string;
              fechaVencimiento: string;
              importe: number;
              saldoPendiente: number;
              saldoVencido: number;
              diasVencidos: number;
            }>);

            const tableData = Object.values(groupedData);
            const totalImporteFacturas = tableData.reduce((sum, row) => sum + row.importe, 0);
            const totalSaldoPendienteFacturas = tableData.reduce((sum, row) => sum + row.saldoPendiente, 0);
            const totalSaldoVencidoFacturas = tableData.reduce((sum, row) => sum + row.saldoVencido, 0);

            return (
              <div key={monedaActual} className="mb-10">
                <h2 className="text-lg font-semibold mb-2">
                  Estado de Cuenta en {getCurrencySymbol(monedaActual)} ({monedaActual})
                </h2>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Monto Total</h3>
                    <p className="text-xl font-bold text-blue-900 dark:text-blue-200">
                      {formatMoney(montoTotal, monedaActual)}
                    </p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Abonos</h3>
                    <p className="text-xl font-bold text-green-900 dark:text-green-200">
                      {formatMoney(abonos, monedaActual)}
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Saldo Pendiente</h3>
                    <p className="text-xl font-bold text-yellow-900 dark:text-yellow-200">
                      {formatMoney(saldoPendiente, monedaActual)}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Saldo Vencido</h3>
                    <p className="text-xl font-bold text-red-900 dark:text-red-200">
                      {formatMoney(saldoVencido, monedaActual)}
                    </p>
                  </div>
                </div>
                {/* Tabla */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-blue-600 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Documento</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Fecha Documento</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider">Fecha Vencimiento</th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider">Importe</th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider">Saldo Pendiente</th>
                        <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wider">Saldo Vencido</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider">Días Vencidos</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {tableData.length > 0 ? (
                        tableData.map((row, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900/20' : ''}>
                            <td className="px-3 py-2 text-xs">{row.documento}</td>
                            <td className="px-3 py-2 text-xs">{formatDate(row.fechaDocumento)}</td>
                            <td className="px-3 py-2 text-xs">{formatDate(row.fechaVencimiento)}</td>
                            <td className="px-3 py-2 text-xs text-right">{formatMoney(row.importe, monedaActual)}</td>
                            <td className="px-3 py-2 text-xs text-right">{formatMoney(row.saldoPendiente, monedaActual)}</td>
                            <td className="px-3 py-2 text-xs text-right">{formatMoney(row.saldoVencido, monedaActual)}</td>
                            <td className="px-3 py-2 text-xs text-center">
                              {row.diasVencidos > 0 ? (
                                <span className="text-red-600 dark:text-red-400">{row.diasVencidos}</span>
                              ) : (
                                '0'
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                            No hay documentos para mostrar
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-xs font-medium">Totales:</td>
                        <td className="px-3 py-2 text-xs font-medium text-right">
                          {formatMoney(totalImporteFacturas, monedaActual)}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-right">
                          {formatMoney(totalSaldoPendienteFacturas, monedaActual)}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-right">
                          {formatMoney(totalSaldoVencidoFacturas, monedaActual)}
                        </td>
                        <td className="px-3 py-2 text-xs"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};