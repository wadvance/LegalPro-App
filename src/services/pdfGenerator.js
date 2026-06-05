import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { parseDate } from '../utils/helpers';

const generateHTML = (title, content, data = {}) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 12pt;
      color: #333;
      padding: 40px;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #1A237E;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1A237E;
      font-size: 24pt;
      margin-bottom: 5px;
    }
    .header p {
      color: #666;
      font-size: 10pt;
    }
    .header .badge {
      display: inline-block;
      background: #C5A028;
      color: white;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 9pt;
      margin-top: 8px;
    }
    .title {
      font-size: 18pt;
      color: #1A237E;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th {
      background: #1A237E;
      color: white;
      padding: 10px 12px;
      text-align: left;
      font-size: 10pt;
    }
    td {
      padding: 8px 12px;
      border-bottom: 1px solid #ddd;
      font-size: 10pt;
    }
    tr:nth-child(even) { background: #f8f8f8; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 15px 0;
    }
    .info-item {
      border: 1px solid #ddd;
      padding: 12px;
      border-radius: 6px;
    }
    .info-item label {
      font-size: 8pt;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .info-item .value {
      font-size: 12pt;
      color: #333;
      margin-top: 4px;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #888;
    }
    .signature-area {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-top: 40px;
      padding-top: 5px;
    }
    .total-row {
      font-weight: bold;
      background: #e8eaf6 !important;
    }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: bold;
    }
    .status-pagado { background: #e8f5e9; color: #2e7d32; }
    .status-pendiente { background: #fff3e0; color: #e65100; }
    .status-vencido { background: #fbe9e7; color: #c62828; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Arauz Carrillo Abogados</h1>
    <p>Vía España, Edificio Arauz Carrillo • Piso 8, Oficina 801</p>
    <p>Ciudad de Panamá, Panamá • Tel: +507 0000-0000</p>
    <span class="badge">${title}</span>
  </div>
  <div class="title">${title}</div>
  ${content}
  <div class="footer">
    <p><strong>Arauz Carrillo Abogados</strong> - Su confianza, nuestro compromiso</p>
    <p>Documento generado el ${new Date().toLocaleDateString('es-PA', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })}</p>
  </div>
</body>
</html>`;
};

export const generatePDF = async (title, content) => {
  try {
    const html = generateHTML(title, content);
    const { uri } = await Print.printToFileAsync({ html });
    return { success: true, uri };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const sharePDF = async (uri, filename) => {
  try {
    const ext = Platform.OS === 'ios' ? '.pdf' : '.pdf';
    const newUri = FileSystem.documentDirectory + (filename || 'documento') + ext;

    await FileSystem.moveAsync({
      from: uri,
      to: newUri,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(newUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir PDF',
        UTI: 'com.adobe.pdf',
      });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const generateClientReport = (cliente) => {
  return `
<div class="info-grid">
  <div class="info-item">
    <label>Nombre Completo</label>
    <div class="value">${cliente.nombre} ${cliente.apellido}</div>
  </div>
  <div class="info-item">
    <label>Cédula</label>
    <div class="value">${cliente.cedula || 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>Teléfono</label>
    <div class="value">${cliente.telefono || 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>Email</label>
    <div class="value">${cliente.email || 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>Dirección</label>
    <div class="value">${cliente.direccion || 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>RUC</label>
    <div class="value">${cliente.ruc || 'N/A'}</div>
  </div>
</div>

<h3 style="color:#1A237E;margin-top:20px;">Expedientes del Cliente</h3>
<table>
  <tr><th>No. Expediente</th><th>Tipo</th><th>Estado</th><th>Fecha</th></tr>
  ${(cliente.expedientes || []).map((exp) => `
    <tr>
      <td>${exp.numero || 'N/A'}</td>
      <td>${exp.tipo || 'N/A'}</td>
      <td><span class="status-badge status-${(exp.estado || '').toLowerCase()}">${exp.estado || 'N/A'}</span></td>
      <td>${exp.fecha ? parseDate(exp.fecha)?.toLocaleDateString('es-PA') : 'N/A'}</td>
    </tr>
  `).join('')}
</table>`;
};

export const generateInvoicePDF = (factura) => {
  const content = `
<div class="info-grid">
  <div class="info-item">
    <label>Factura No.</label>
    <div class="value">${factura.numeroFactura || 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>Fecha</label>
    <div class="value">${factura.fecha ? parseDate(factura.fecha)?.toLocaleDateString('es-PA') : 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>Cliente</label>
    <div class="value">${factura.clienteNombre || 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>Estado</label>
    <div class="value"><span class="status-badge status-${(factura.estado || '').toLowerCase()}">${factura.estado || 'N/A'}</span></div>
  </div>
</div>

<h3 style="color:#1A237E;margin-top:20px;">Detalle de Servicios</h3>
<table>
  <tr><th>Descripción</th><th>Cant.</th><th>Precio Unit.</th><th>Total</th></tr>
  ${(factura.detalles || []).map((item) => `
    <tr>
      <td>${item.descripcion || ''}</td>
      <td>${item.cantidad || 1}</td>
      <td>B/. ${(item.precioUnitario || 0).toFixed(2)}</td>
      <td>B/. ${((item.cantidad || 1) * (item.precioUnitario || 0)).toFixed(2)}</td>
    </tr>
  `).join('')}
  <tr class="total-row">
    <td colspan="3" style="text-align:right;">Total:</td>
    <td>B/. ${(factura.total || 0).toFixed(2)}</td>
  </tr>
</table>

<div class="signature-area">
  <div class="signature-box">
    <div class="signature-line">Firma del Abogado</div>
  </div>
  <div class="signature-box">
    <div class="signature-line">Firma del Cliente</div>
  </div>
</div>`;

  return generatePDF(`Factura #${factura.numeroFactura || ''}`, content);
};

export const generateCaseReportPDF = (expediente) => {
  const content = `
<div class="info-grid">
  <div class="info-item">
    <label>Número de Expediente</label>
    <div class="value">${expediente.numero || 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>Tipo</label>
    <div class="value">${expediente.tipo || 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>Cliente</label>
    <div class="value">${expediente.clienteNombre || 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>Abogado</label>
    <div class="value">${expediente.abogadoNombre || 'N/A'}</div>
  </div>
  <div class="info-item">
    <label>Estado</label>
    <div class="value"><span class="status-badge status-${(expediente.estado || '').toLowerCase()}">${expediente.estado || 'N/A'}</span></div>
  </div>
  <div class="info-item">
    <label>Fecha de Apertura</label>
    <div class="value">${expediente.fechaApertura ? parseDate(expediente.fechaApertura)?.toLocaleDateString('es-PA') : 'N/A'}</div>
  </div>
</div>

<h3 style="color:#1A237E;margin-top:20px;">Descripción del Caso</h3>
<p style="margin:10px 0;text-align:justify;">${expediente.descripcion || 'Sin descripción disponible.'}</p>

<h3 style="color:#1A237E;margin-top:20px;">Movimientos del Expediente</h3>
<table>
  <tr><th>Fecha</th><th>Tipo</th><th>Descripción</th></tr>
  ${(expediente.movimientos || []).map((mov) => `
    <tr>
      <td>${mov.fecha ? parseDate(mov.fecha)?.toLocaleDateString('es-PA') : 'N/A'}</td>
      <td>${mov.tipo || 'N/A'}</td>
      <td>${mov.descripcion || ''}</td>
    </tr>
  `).join('')}
</table>`;

  return generatePDF(`Expediente #${expediente.numero || ''}`, content);
};

export const generateCodePDF = async (codigo) => {
  const articulosHTML = (codigo.articulos || []).map((a) => `
    <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #eee;">
      <h4 style="color:#1A237E;margin:0 0 4px 0;">Artículo ${a.articulo} - ${a.titulo}</h4>
      <span style="font-size:9pt;color:#888;">${a.categoria} | ${a.libro || ''}</span>
      <p style="margin-top:6px;font-size:10pt;line-height:1.5;text-align:justify;">${a.contenido}</p>
    </div>
  `).join('');

  const content = `
    <h3 style="color:#1A237E;">${codigo.descripcion || ''}</h3>
    <p style="font-size:10pt;color:#555;margin-bottom:20px;">Total: ${codigo.articulos?.length || 0} artículos</p>
    ${articulosHTML}
  `;

  return generatePDF(codigo.titulo, content);
};

export { generateHTML, generatePDF as default };
