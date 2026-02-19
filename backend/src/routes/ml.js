'use strict';
const { Router } = require('express');
const ctrl = require('../controllers/mlProxyController');

const router = Router();

router.get('/health', ctrl.getHealth);
router.post('/predict', ctrl.postPredict);
router.post('/anomaly', ctrl.postAnomaly);
router.get('/forecast/:wardId', ctrl.getForecast);
router.post('/hotspots', ctrl.postHotspots);

module.exports = router;
