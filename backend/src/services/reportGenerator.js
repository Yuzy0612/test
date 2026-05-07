import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { wells, realtimeByWell } from '../data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDir = path.join(__dirname, '..', 'reports');

// Ensure reports directory exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

export function generateDailyReport(reportId, date) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filePath = path.join(reportsDir, `${reportId}.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('VFM 日报', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`日期: ${date}`, { align: 'center' });
    doc.fontSize(10).text(`报表ID: ${reportId}`, { align: 'center' });
    doc.moveDown(2);

    // Summary table header
    doc.fontSize(14).font('Helvetica-Bold').text('生产汇总', { underline: true });
    doc.moveDown();

    const tableTop = doc.y;
    const col1 = 50, col2 = 150, col3 = 250, col4 = 350, col5 = 430;

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('井号', col1, tableTop);
    doc.text('油田', col2, tableTop);
    doc.text('油产量(m³/d)', col3, tableTop);
    doc.text('气产量(Sm³/d)', col4, tableTop);
    doc.text('水产量(m³/d)', col5, tableTop);

    doc.moveTo(col1, tableTop + 15).lineTo(500, tableTop + 15).stroke();
    doc.moveTo(col1, tableTop + 40).lineTo(500, tableTop + 40).stroke();

    // Table rows
    let rowY = tableTop + 25;
    doc.font('Helvetica').fontSize(9);

    wells.forEach((well, idx) => {
      const data = realtimeByWell[well.wellId] || { oilRate: 0, gasRate: 0, waterRate: 0 };
      if (idx % 2 === 0) {
        doc.rect(col1 - 5, rowY - 3, 510, 15).fill('#f5f5f5');
      }
      doc.text(well.wellId, col1, rowY);
      doc.text(well.field, col2, rowY);
      doc.text(data.oilRate.toFixed(2), col3, rowY);
      doc.text(data.gasRate.toFixed(2), col4, rowY);
      doc.text(data.waterRate.toFixed(2), col5, rowY);
      rowY += 15;
    });

    // Totals row
    rowY += 5;
    doc.moveTo(col1, rowY).lineTo(500, rowY).stroke();
    rowY += 10;
    doc.font('Helvetica-Bold');
    doc.text('合计', col1, rowY);

    const totals = wells.reduce((acc, well) => {
      const data = realtimeByWell[well.wellId] || { oilRate: 0, gasRate: 0, waterRate: 0 };
      acc.oil += data.oilRate;
      acc.gas += data.gasRate;
      acc.water += data.waterRate;
      return acc;
    }, { oil: 0, gas: 0, water: 0 });

    doc.text(totals.oil.toFixed(2), col3, rowY);
    doc.text(totals.gas.toFixed(2), col4, rowY);
    doc.text(totals.water.toFixed(2), col5, rowY);

    // Footer
    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica');
    doc.text(`生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`, 50, doc.page.height - 50);
    doc.text('VFM虚拟流量计量系统', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

export function generateWeeklyReport(reportId, weekNum, year) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filePath = path.join(reportsDir, `${reportId}.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('VFM 周报', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`${year}年第${weekNum}周`, { align: 'center' });
    doc.fontSize(10).text(`报表ID: ${reportId}`, { align: 'center' });
    doc.moveDown(2);

    // Weekly summary
    doc.fontSize(14).font('Helvetica-Bold').text('本周生产概况', { underline: true });
    doc.moveDown();

    const totals = wells.reduce((acc, well) => {
      const data = realtimeByWell[well.wellId] || { oilRate: 0, gasRate: 0, waterRate: 0 };
      acc.oil += data.oilRate * 7;
      acc.gas += data.gasRate * 7;
      acc.water += data.waterRate * 7;
      return acc;
    }, { oil: 0, gas: 0, water: 0 });

    doc.fontSize(10).font('Helvetica');
    doc.text(`总产油量: ${totals.oil.toFixed(2)} m³`, { indent: 20 });
    doc.text(`总产气量: ${totals.gas.toFixed(2)} Sm³`, { indent: 20 });
    doc.text(`总产水量: ${totals.water.toFixed(2)} m³`, { indent: 20 });

    doc.moveDown(2);

    // Daily breakdown table
    doc.fontSize(14).font('Helvetica-Bold').text('日均产量', { underline: true });
    doc.moveDown();

    const dailyAvg = wells.reduce((acc, well) => {
      const data = realtimeByWell[well.wellId] || { oilRate: 0, gasRate: 0, waterRate: 0 };
      acc.oil += data.oilRate;
      acc.gas += data.gasRate;
      acc.water += data.waterRate;
      return acc;
    }, { oil: 0, gas: 0, water: 0 });

    const wellCount = wells.length;
    doc.fontSize(10).font('Helvetica');
    doc.text(`油: ${(dailyAvg.oil / wellCount).toFixed(2)} m³/d`, { indent: 20 });
    doc.text(`气: ${(dailyAvg.gas / wellCount).toFixed(2)} Sm³/d`, { indent: 20 });
    doc.text(`水: ${(dailyAvg.water / wellCount).toFixed(2)} m³/d`, { indent: 20 });

    // Footer
    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica');
    doc.text(`生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`, 50, doc.page.height - 50);
    doc.text('VFM虚拟流量计量系统', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

export function generateMonthlyReport(reportId, year, month) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const filePath = path.join(reportsDir, `${reportId}.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('VFM 月报', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`${year}年${month}月`, { align: 'center' });
    doc.fontSize(10).text(`报表ID: ${reportId}`, { align: 'center' });
    doc.moveDown(2);

    // Monthly summary
    doc.fontSize(14).font('Helvetica-Bold').text('本月生产概况', { underline: true });
    doc.moveDown();

    const daysInMonth = new Date(year, month, 0).getDate();
    const totals = wells.reduce((acc, well) => {
      const data = realtimeByWell[well.wellId] || { oilRate: 0, gasRate: 0, waterRate: 0 };
      acc.oil += data.oilRate * daysInMonth;
      acc.gas += data.gasRate * daysInMonth;
      acc.water += data.waterRate * daysInMonth;
      return acc;
    }, { oil: 0, gas: 0, water: 0 });

    doc.fontSize(10).font('Helvetica');
    doc.text(`月总产油量: ${totals.oil.toFixed(2)} m³`, { indent: 20 });
    doc.text(`月总产气量: ${totals.gas.toFixed(2)} Sm³`, { indent: 20 });
    doc.text(`月总产水量: ${totals.water.toFixed(2)} m³`, { indent: 20 });

    doc.moveDown(2);

    // Monthly average
    doc.fontSize(14).font('Helvetica-Bold').text('月均日产量', { underline: true });
    doc.moveDown();

    const dailyTotals = wells.reduce((acc, well) => {
      const data = realtimeByWell[well.wellId] || { oilRate: 0, gasRate: 0, waterRate: 0 };
      acc.oil += data.oilRate;
      acc.gas += data.gasRate;
      acc.water += data.waterRate;
      return acc;
    }, { oil: 0, gas: 0, water: 0 });

    const wellCount = wells.length;
    doc.fontSize(10).font('Helvetica');
    doc.text(`油: ${(dailyTotals.oil / wellCount).toFixed(2)} m³/d`, { indent: 20 });
    doc.text(`气: ${(dailyTotals.gas / wellCount).toFixed(2)} Sm³/d`, { indent: 20 });
    doc.text(`水: ${(dailyTotals.water / wellCount).toFixed(2)} m³/d`, { indent: 20 });

    // Footer
    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica');
    doc.text(`生成时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`, 50, doc.page.height - 50);
    doc.text('VFM虚拟流量计量系统', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

export function generateExcelReport(reportId, data) {
  return new Promise((resolve, reject) => {
    // For Excel, we'll just generate a simple CSV since full Excel support needs additional library
    const filePath = path.join(reportsDir, `${reportId}.csv`);
    const content = generateCSV(data);
    fs.writeFile(filePath, content, (err) => {
      if (err) reject(err);
      else resolve(filePath);
    });
  });
}

function generateCSV(data) {
  const headers = '井号,油田,区块,举升方式,油产量(m³/d),气产量(Sm³/d),水产量(m³/d)\n';
  const rows = wells.map(well => {
    const d = realtimeByWell[well.wellId] || { oilRate: 0, gasRate: 0, waterRate: 0 };
    return `${well.wellId},${well.field},${well.block},${well.liftType},${d.oilRate.toFixed(2)},${d.gasRate.toFixed(2)},${d.waterRate.toFixed(2)}`;
  }).join('\n');
  return headers + rows;
}

export function getReportFilePath(reportId, format) {
  const ext = format === 'excel' ? 'csv' : 'pdf';
  return path.join(reportsDir, `${reportId}.${ext}`);
}
