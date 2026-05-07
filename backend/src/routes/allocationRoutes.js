import { Router } from 'express';
import { getAllocationRules, createAllocationRule, updateAllocationRule, activateAllocationRule, runAllocation, getAllocationResults, getAllocationResultById } from '../controllers/allocationController.js';

const router = Router();

router.get('/rules', getAllocationRules);
router.post('/rules', createAllocationRule);
router.put('/rules/:ruleId', updateAllocationRule);
router.post('/rules/:ruleId/activate', activateAllocationRule);
router.post('/run', runAllocation);
router.get('/results', getAllocationResults);
router.get('/results/:taskId', getAllocationResultById);

export default router;
