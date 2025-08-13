const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      puppeteer: 'operational',
      lighthouse: 'operational'
    }
  };

  res.status(200).json(health);
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const puppeteer = require('puppeteer');
    
    // Test Puppeteer
    let puppeteerStatus = 'operational';
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      });
      await browser.close();
    } catch (error) {
      puppeteerStatus = 'error';
      console.error('Puppeteer health check failed:', error.message);
    }

    // Test Lighthouse
    let lighthouseStatus = 'operational';
    try {
      require('lighthouse');
    } catch (error) {
      lighthouseStatus = 'error';
      console.error('Lighthouse health check failed:', error.message);
    }

    const health = {
      status: puppeteerStatus === 'operational' && lighthouseStatus === 'operational' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        puppeteer: puppeteerStatus,
        lighthouse: lighthouseStatus
      },
      memory: {
        used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
      }
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

module.exports = router;