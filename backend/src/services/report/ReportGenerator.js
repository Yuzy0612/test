// 报表生成服务
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { ReportTask } from '../models/index.js';

class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'reports');
    this.ensureReportsDir();
  }

  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * 生成报表
   * @param {Object} task - 报表任务
   */
  async generate(task) {
    const { reportId, type, lang, format, parameters } = task;

    try {
      // 1. 更新状态为运行中
      await ReportTask.update(
        { status: 'running', startedAt: new Date(), progress: 10 },
        { where: { reportId } }
      );

      // 2. 收集数据
      const reportData = await this.collectReportData(type, parameters);

      // 3. 更新进度
      await ReportTask.update(
        { progress: 50 },
        { where: { reportId } }
      );

      // 4. 导出指定格式
      let fileUrl;
      if (format === 'pdf') {
        fileUrl = await this.exportPDF(reportData, reportId, lang);
      } else {
        fileUrl = await this.exportExcel(reportData, reportId);
      }

      // 5. 更新任务状态
      await ReportTask.update({
        status: 'completed',
        progress: 100,
        fileUrl,
        completedAt: new Date()
      }, { where: { reportId } });

      return { success: true, fileUrl };

    } catch (error) {
      await this.handleGenerationError(reportId, error);
      throw error;
    }
  }

  /**
   * 收集报表数据
   */
  async collectReportData(type, parameters) {
    const { blockId, wellIds, startDate, endDate } = parameters;

    // 根据报告类型确定时间范围
    const timeRange = this.getTimeRange(type, startDate, endDate);

    // Mock数据 - 实际应从数据库查询
    const mockData = {
      summary: {
        totalOil: 12500,
        totalGas: 250000,
        totalWater: 7500,
        wellCount: 12,
        avgOilRate: 52.1,
        avgWaterCut: 0.375
      },
      dailyData: this.generateDailyData(timeRange),
      timeRange,
      blockId: blockId || 'BLOCK-001',
      reportType: type
    };

    return mockData;
  }

  /**
   * 获取时间范围
   */
  getTimeRange(type, startDate, endDate) {
    const now = new Date();
    const end = endDate ? new Date(endDate) : now;
    let start;

    switch (type) {
      case 'daily':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        start = startDate ? new Date(startDate) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return { start: start.toISOString(), end: end.toISOString() };
  }

  /**
   * 生成每日数据（Mock）
   */
  generateDailyData(timeRange) {
    const start = new Date(timeRange.start);
    const end = new Date(timeRange.end);
    const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));

    const data = [];
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      data.push({
        date: date.toISOString().split('T')[0],
        oil: Number((1200 + Math.random() * 200).toFixed(2)),
        gas: Number((24000 + Math.random() * 4000).toFixed(2)),
        water: Number((700 + Math.random() * 100).toFixed(2))
      });
    }
    return data;
  }

  /**
   * 导出PDF
   */
  async exportPDF(data, reportId, lang = 'zh') {
    const filePath = path.join(this.reportsDir, `${reportId}.pdf`);
    const isZh = lang === 'zh';

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // 标题
        doc.fontSize(20).text(isZh ? '产量报表' : 'Production Report', { align: 'center' });
        doc.moveDown();

        // 报表类型
        const typeLabels = { daily: isZh ? '日报' : 'Daily', weekly: isZh ? '周报' : 'Weekly', monthly: isZh ? '月报' : 'Monthly' };
        doc.fontSize(12).text(`${typeLabels[data.reportType] || data.reportType} ${isZh ? '报表' : 'Report'}`, { align: 'center' });
        doc.moveDown();

        // 时间范围
        const startDate = new Date(data.timeRange.start).toLocaleDateString(isZh ? 'zh-CN' : 'en-US');
        const endDate = new Date(data.timeRange.end).toLocaleDateString(isZh ? 'zh-CN' : 'en-US');
        doc.fontSize(10).text(`${isZh ? '时间范围' : 'Date Range'}: ${startDate} - ${endDate}`, { align: 'center' });
        doc.moveDown(2);

        // 区块信息
        doc.fontSize(12).text(`${isZh ? '区块' : 'Block'}: ${data.blockId}`, { align: 'left' });
        doc.moveDown();

        // 汇总数据
        doc.fontSize(14).text(isZh ? '汇总数据' : 'Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`${isZh ? '总油量' : 'Total Oil'}: ${data.summary.totalOil.toFixed(2)} m³`);
        doc.text(`${isZh ? '总气量' : 'Total Gas'}: ${data.summary.totalGas.toFixed(2)} Sm³`);
        doc.text(`${isZh ? '总水量' : 'Total Water'}: ${data.summary.totalWater.toFixed(2)} m³`);
        doc.text(`${isZh ? '井数' : 'Well Count'}: ${data.summary.wellCount}`);
        doc.text(`${isZh ? '平均油产量' : 'Avg Oil Rate'}: ${data.summary.avgOilRate.toFixed(2)} m³/d`);
        doc.text(`${isZh ? '平均含水率' : 'Avg Water Cut'}: ${(data.summary.avgWaterCut * 100).toFixed(1)}%`);
        doc.moveDown(2);

        // 每日数据表格
        doc.fontSize(14).text(isZh ? '每日数据' : 'Daily Data', { underline: true });
        doc.moveDown(0.5);

        // 表头
        const tableTop = doc.y;
        const col1 = 50, col2 = 180, col3 = 310, col4 = 440;

        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(isZh ? '日期' : 'Date', col1, tableTop);
        doc.text(isZh ? '油量 (m³)' : 'Oil (m³)', col2, tableTop);
        doc.text(isZh ? '气量 (Sm³)' : 'Gas (Sm³)', col3, tableTop);
        doc.text(isZh ? '水量 (m³)' : 'Water (m³)', col4, tableTop);

        doc.font('Helvetica');
        let y = tableTop + 20;

        for (const row of data.dailyData) {
          doc.text(row.date, col1, y);
          doc.text(row.oil.toFixed(2), col2, y);
          doc.text(row.gas.toFixed(2), col3, y);
          doc.text(row.water.toFixed(2), col4, y);
          y += 15;

          // 分页
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        }

        // 页脚
        doc.fontSize(8).text(
          `${isZh ? '生成时间' : 'Generated'}: ${new Date().toLocaleString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => {
          console.log(`PDF generated: ${filePath}`);
          resolve(`/reports/${reportId}.pdf`);
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 导出Excel
   */
  async exportExcel(data, reportId) {
    const filePath = path.join(this.reportsDir, `${reportId}.xlsx`);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'VFM System';
    workbook.created = new Date();

    // Sheet 1: 汇总
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Item', key: 'item', width: 20 },
      { header: 'Value', key: 'value', width: 20 },
      { header: 'Unit', key: 'unit', width: 15 }
    ];

    summarySheet.addRows([
      { item: 'Block', value: data.blockId, unit: '' },
      { item: 'Report Type', value: data.reportType, unit: '' },
      { item: 'Start Date', value: data.timeRange.start.split('T')[0], unit: '' },
      { item: 'End Date', value: data.timeRange.end.split('T')[0], unit: '' },
      { item: 'Total Oil', value: data.summary.totalOil, unit: 'm³' },
      { item: 'Total Gas', value: data.summary.totalGas, unit: 'Sm³' },
      { item: 'Total Water', value: data.summary.totalWater, unit: 'm³' },
      { item: 'Well Count', value: data.summary.wellCount, unit: '' },
      { item: 'Avg Oil Rate', value: data.summary.avgOilRate, unit: 'm³/d' },
      { item: 'Avg Water Cut', value: data.summary.avgWaterCut, unit: '%' }
    ]);

    // 样式
    summarySheet.getRow(1).font = { bold: true };

    // Sheet 2: 每日数据
    const dailySheet = workbook.addWorksheet('Daily Data');
    dailySheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Oil (m³)', key: 'oil', width: 15 },
      { header: 'Gas (Sm³)', key: 'gas', width: 15 },
      { header: 'Water (m³)', key: 'water', width: 15 }
    ];

    for (const row of data.dailyData) {
      dailySheet.addRow(row);
    }

    // 表头样式
    dailySheet.getRow(1).font = { bold: true };

    // 写入文件
    await workbook.xlsx.writeFile(filePath);

    console.log(`Excel generated: ${filePath}`);
    return `/reports/${reportId}.xlsx`;
  }

  /**
   * 处理生成错误
   */
  async handleGenerationError(reportId, error) {
    const task = await ReportTask.findOne({ where: { reportId } });
    if (task) {
      await task.update({
        status: 'failed',
        errorMessage: error.message,
        retryCount: task.retryCount + 1
      });
    }
  }

  /**
   * 创建报表任务
   */
  async createTask(taskData) {
    const reportId = `RPT-${Date.now()}`;
    return ReportTask.create({
      reportId,
      ...taskData,
      status: 'pending',
      progress: 0
    });
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(reportId) {
    return ReportTask.findOne({ where: { reportId } });
  }

  /**
   * 获取报表文件路径
   */
  getFilePath(reportId, format) {
    return path.join(this.reportsDir, `${reportId}.${format}`);
  }

  /**
   * 删除报表文件
   */
  async deleteReportFile(reportId) {
    const pdfPath = path.join(this.reportsDir, `${reportId}.pdf`);
    const xlsxPath = path.join(this.reportsDir, `${reportId}.xlsx`);

    try {
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      if (fs.existsSync(xlsxPath)) fs.unlinkSync(xlsxPath);
      return true;
    } catch (error) {
      console.error('Failed to delete report files:', error);
      return false;
    }
  }
}

export const reportGenerator = new ReportGenerator();
export default ReportGenerator;
