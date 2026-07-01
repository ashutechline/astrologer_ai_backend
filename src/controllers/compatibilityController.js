const { nanoid } = require('nanoid');
const BirthChart = require('../models/BirthChart');
const { CompatibilityReport, CompatibilityInvite } = require('../models/Compatibility');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const {
  computeSynastryAspects,
  computeCompatibilityScores,
  computeCompositeChart,
} = require('../services/ephemeris/compatibilityService');
const { createChart } = require('../services/birthChartService');
const geminiService = require('../services/geminiService');

const INVITE_EXPIRY_DAYS = 14;

async function buildReport(chartA, chartB, mode, ownerId) {
  const synastryAspects = computeSynastryAspects(chartA.computed.planets, chartB.computed.planets);
  const scores = computeCompatibilityScores(synastryAspects);

  const prompt = `Generate a warm, insightful 3-paragraph synastry relationship reading for a "${mode}" compatibility context. Person A: Sun ${chartA.computed.sunSign}, Moon ${chartA.computed.moonSign}, Rising ${chartA.computed.risingSign || 'unknown'}. Person B: Sun ${chartB.computed.sunSign}, Moon ${chartB.computed.moonSign}, Rising ${chartB.computed.risingSign || 'unknown'}. Key synastry aspects: ${synastryAspects.slice(0, 8).map((a) => `${a.planetA}-${a.planetB} ${a.aspect}`).join(', ')}. Scores out of 100 — Love: ${scores.love}, Communication: ${scores.communication}, Values: ${scores.values}.`;

  const aiReading = await geminiService
    .generateText({
      systemPrompt: 'You are Cosmic, an expert AI astrologer specializing in relationship synastry readings.',
      userMessage: prompt,
      maxTokens: 600,
    })
    .catch(() => null); // don't fail the whole report if generation hiccups; UI can show a retry state

  const compositePlanets = computeCompositeChart(chartA.computed.planets, chartB.computed.planets);

  return CompatibilityReport.create({
    owner: ownerId,
    chartA: chartA._id,
    chartB: chartB._id,
    mode,
    synastryAspects,
    scores,
    aiReading,
    composite: { planets: compositePlanets, ascendant: null },
  });
}

/** POST /compatibility/synastry — body: { chartIdA, chartIdB, mode } OR { chartIdA, partnerBirthData, mode } */
async function createSynastry(req, res) {
  const { chartIdA, chartIdB, partnerBirthData, mode } = req.body;

  const chartA = await BirthChart.findOne({ _id: chartIdA, owner: req.userId });
  if (!chartA) throw ApiError.notFound('Your chart was not found', 'CHART_NOT_FOUND');

  let chartB;
  if (chartIdB) {
    chartB = await BirthChart.findOne({ _id: chartIdB, owner: req.userId });
    if (!chartB) throw ApiError.notFound("Partner's chart was not found", 'CHART_NOT_FOUND');
  } else if (partnerBirthData) {
    // Partner entered manually — saved under the requesting user's account, not flagged as primary.
    // Bypasses the free-tier vault limit since this is a transient lookup chart for comparison,
    // not an additional chart the user is "keeping" in their own vault.
    chartB = await createChart(req.userId, { ...partnerBirthData, isPrimary: false }, false, { bypassVaultLimit: true });
  } else {
    throw ApiError.badRequest('Provide either chartIdB or partnerBirthData', 'MISSING_PARTNER_DATA');
  }

  const report = await buildReport(chartA, chartB, mode, req.userId);
  sendSuccess(res, { statusCode: 201, data: report });
}

/** GET /compatibility/:synastryId */
async function getSynastry(req, res) {
  const report = await CompatibilityReport.findOne({ _id: req.params.synastryId, owner: req.userId })
    .populate('chartA chartB');
  if (!report) throw ApiError.notFound('Report not found', 'REPORT_NOT_FOUND');
  sendSuccess(res, { data: report });
}

/** POST /compatibility/composite */
async function createComposite(req, res) {
  const { chartIdA, chartIdB } = req.body;
  const chartA = await BirthChart.findOne({ _id: chartIdA, owner: req.userId });
  const chartB = await BirthChart.findOne({ _id: chartIdB, owner: req.userId });
  if (!chartA || !chartB) throw ApiError.notFound('One or both charts were not found', 'CHART_NOT_FOUND');

  const compositePlanets = computeCompositeChart(chartA.computed.planets, chartB.computed.planets);
  sendSuccess(res, { data: { planets: compositePlanets } });
}

/** POST /compatibility/invite-link */
async function createInviteLink(req, res) {
  const { chartId, mode } = req.body;
  const chart = await BirthChart.findOne({ _id: chartId, owner: req.userId });
  if (!chart) throw ApiError.notFound('Chart not found', 'CHART_NOT_FOUND');

  const token = nanoid(12);
  const invite = await CompatibilityInvite.create({
    createdBy: req.userId,
    token,
    creatorChartId: chartId,
    mode,
    expiresAt: new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
  });

  sendSuccess(res, { statusCode: 201, data: { token: invite.token, expiresAt: invite.expiresAt } });
}

/** GET /compatibility/invite/:token — resolved by the partner's browser/app, no auth required */
async function resolveInviteLink(req, res) {
  const invite = await CompatibilityInvite.findOne({ token: req.params.token });
  if (!invite) throw ApiError.notFound('Invite link not found', 'INVITE_NOT_FOUND');
  if (invite.status === 'expired' || invite.expiresAt < new Date()) {
    throw ApiError.badRequest('This invite link has expired', 'INVITE_EXPIRED');
  }
  sendSuccess(res, { data: { status: invite.status, mode: invite.mode, resultReportId: invite.resultReportId } });
}

/** POST /compatibility/invite/:token/submit — partner submits their birth data (no auth required) */
async function submitInviteLink(req, res) {
  const invite = await CompatibilityInvite.findOne({ token: req.params.token });
  if (!invite) throw ApiError.notFound('Invite link not found', 'INVITE_NOT_FOUND');
  if (invite.status !== 'pending') throw ApiError.conflict('This invite has already been used', 'INVITE_ALREADY_USED');
  if (invite.expiresAt < new Date()) throw ApiError.badRequest('This invite link has expired', 'INVITE_EXPIRED');

  const chartA = await BirthChart.findById(invite.creatorChartId);
  const chartB = await createChart(invite.createdBy, { ...req.body, label: 'Invited Partner', isPrimary: false }, false, { bypassVaultLimit: true });

  const report = await buildReport(chartA, chartB, invite.mode, invite.createdBy);

  invite.status = 'completed';
  invite.resultReportId = report._id;
  await invite.save();

  sendSuccess(res, { statusCode: 201, data: { reportId: report._id } });
}

module.exports = {
  createSynastry,
  getSynastry,
  createComposite,
  createInviteLink,
  resolveInviteLink,
  submitInviteLink,
};
