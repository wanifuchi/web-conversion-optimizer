const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const scraperService = require('../services/scraperService');
const lighthouseService = require('../services/lighthouseService');
const { asyncHandler } = require('../middleware/error');

// Validation middleware
const validateScrapeRequest = [
  body('url')
    .isURL({ require_protocol: true })
    .withMessage('Valid URL is required')
    .matches(/^https?:\/\//)
    .withMessage('URL must use HTTP or HTTPS protocol'),
  body('options.screenshot').optional().isBoolean(),
  body('options.lighthouse').optional().isBoolean(),
  body('options.mobile').optional().isBoolean(),
  body('options.timeout').optional().isInt({ min: 5000, max: 60000 })
];

// Main scraping endpoint
router.post('/', validateScrapeRequest, asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { url, options = {} } = req.body;
  
  // Default options
  const scrapeOptions = {
    screenshot: options.screenshot !== false, // Default: true
    lighthouse: options.lighthouse !== false, // Default: true
    mobile: options.mobile || false,
    timeout: options.timeout || 30000,
    ...options
  };

  try {
    console.log(`🔍 Starting scrape for: ${url}`);
    
    // Perform scraping
    const scrapeResult = await scraperService.scrapePage(url, scrapeOptions);
    
    // Perform Lighthouse audit if requested
    let lighthouseResult = null;
    if (scrapeOptions.lighthouse) {
      console.log(`📊 Running Lighthouse audit for: ${url}`);
      lighthouseResult = await lighthouseService.runAudit(url, {
        mobile: scrapeOptions.mobile
      });
    }

    const result = {
      url,
      timestamp: new Date().toISOString(),
      scrapeData: scrapeResult,
      lighthouseData: lighthouseResult,
      options: scrapeOptions
    };

    console.log(`✅ Scrape completed for: ${url}`);
    res.json(result);

  } catch (error) {
    console.error(`❌ Scrape failed for ${url}:`, error.message);
    
    // Return appropriate error response
    if (error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Request timeout',
        message: 'The page took too long to load'
      });
    }
    
    if (error.message.includes('navigation')) {
      return res.status(422).json({
        error: 'Navigation failed',
        message: 'Unable to navigate to the specified URL'
      });
    }

    res.status(500).json({
      error: 'Scraping failed',
      message: error.message
    });
  }
}));

// Screenshot-only endpoint
router.post('/screenshot', validateScrapeRequest, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { url, options = {} } = req.body;
  
  try {
    console.log(`📸 Taking screenshot for: ${url}`);
    
    const screenshot = await scraperService.takeScreenshot(url, {
      mobile: options.mobile || false,
      fullPage: options.fullPage !== false,
      timeout: options.timeout || 30000
    });

    res.json({
      url,
      timestamp: new Date().toISOString(),
      screenshot: screenshot.toString('base64'),
      format: 'png'
    });

  } catch (error) {
    console.error(`❌ Screenshot failed for ${url}:`, error.message);
    res.status(500).json({
      error: 'Screenshot failed',
      message: error.message
    });
  }
}));

// Lighthouse-only endpoint
router.post('/lighthouse', [
  body('url').isURL().withMessage('Valid URL is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { url, options = {} } = req.body;
  
  try {
    console.log(`🚦 Running Lighthouse audit for: ${url}`);
    
    const lighthouseResult = await lighthouseService.runAudit(url, {
      mobile: options.mobile || false,
      categories: options.categories || ['performance', 'accessibility', 'best-practices', 'seo']
    });

    res.json({
      url,
      timestamp: new Date().toISOString(),
      lighthouse: lighthouseResult
    });

  } catch (error) {
    console.error(`❌ Lighthouse audit failed for ${url}:`, error.message);
    res.status(500).json({
      error: 'Lighthouse audit failed',
      message: error.message
    });
  }
}));

module.exports = router;