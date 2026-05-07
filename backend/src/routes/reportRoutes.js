import { Router } from 'express';
import { getReportTasks, createReportTask, getReportTaskById, triggerReportGeneration, deleteReportTask, downloadReport } from '../controllers/reportController.js';

const router = Router();

// Specific routes FIRST (order matters!)
router.get('/:reportId/download', downloadReport);
router.post('/:reportId/trigger', triggerReportGeneration);
router.get('/:reportId', getReportTaskById);
router.delete('/:reportId', deleteReportTask);

// Generic routes AFTER
router.get('/', getReportTasks);
router.post('/', createReportTask);

export default router;
