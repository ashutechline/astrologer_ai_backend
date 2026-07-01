const BirthChart = require('../models/BirthChart');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const chartService = require('../services/birthChartService');

/** POST /charts */
async function createChart(req, res) {
  const isPro = req.user.subscription.isPro;
  const chart = await chartService.createChart(req.userId, req.body, isPro);

  // First saved chart automatically becomes the user's default
  if (!req.user.defaultChartId) {
    req.user.defaultChartId = chart._id;
    await req.user.save();
  }

  sendSuccess(res, { statusCode: 201, data: chart });
}

/** GET /charts */
async function listCharts(req, res) {
  const charts = await BirthChart.find({ owner: req.userId }).sort({ createdAt: -1 });
  sendSuccess(res, { data: charts });
}

/** GET /charts/:chartId */
async function getChart(req, res) {
  const chart = await BirthChart.findOne({ _id: req.params.chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');
  sendSuccess(res, { data: chart });
}

/** PATCH /charts/:chartId — updates inputs and recalculates */
async function updateChart(req, res) {
  const chart = await BirthChart.findOne({ _id: req.params.chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  const editable = ['label', 'birthDate', 'birthTime', 'timeUnknown', 'birthPlace', 'houseSystem', 'zodiacSystem'];
  let needsRecalc = false;
  for (const key of editable) {
    if (req.body[key] !== undefined) {
      if (key === 'birthPlace') {
        chart.birthPlace = { ...chart.birthPlace.toObject(), ...req.body.birthPlace };
      } else {
        chart[key] = req.body[key];
      }
      if (key !== 'label') needsRecalc = true;
    }
  }

  if (needsRecalc) {
    await chartService.recalculateChart(chart);
  } else {
    await chart.save();
  }

  sendSuccess(res, { data: chart });
}

/** DELETE /charts/:chartId */
async function deleteChart(req, res) {
  const chart = await BirthChart.findOneAndDelete({ _id: req.params.chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');
  sendSuccess(res, { data: { deleted: true } });
}

/** GET /charts/:chartId/aspects */
async function getAspects(req, res) {
  const chart = await BirthChart.findOne({ _id: req.params.chartId, owner: req.userId }).select('computed.aspects');
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');
  sendSuccess(res, { data: chart.computed.aspects });
}

/**
 * POST /charts/:chartId/share-image
 * Renders the chart wheel server-side (e.g. via a headless-canvas/SVG renderer) and returns a URL.
 * Stubbed here — wire to your actual image-rendering + object-storage pipeline.
 */
async function shareImage(req, res) {
  const chart = await BirthChart.findOne({ _id: req.params.chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  // TODO: render an SVG/PNG of chart.computed and upload to object storage (S3/Supabase Storage/etc),
  // then return the public URL. Left as a stub since it depends on your chosen storage provider.
  sendSuccess(res, {
    data: {
      imageUrl: null,
      message: 'Image rendering not yet wired to a storage provider — see TODO in shareImage controller.',
    },
  });
}

module.exports = { createChart, listCharts, getChart, updateChart, deleteChart, getAspects, shareImage };
