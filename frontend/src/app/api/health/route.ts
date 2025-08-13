import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {
        api: 'operational',
        database: 'checking',
        storage: 'checking'
      }
    };

    // Basic service checks
    try {
      // Check Vercel KV if available
      if (process.env.KV_URL) {
        health.services.storage = 'operational';
      } else {
        health.services.storage = 'not_configured';
      }

      // Check Vercel Postgres if available
      if (process.env.POSTGRES_URL) {
        health.services.database = 'operational';
      } else {
        health.services.database = 'not_configured';
      }
    } catch (error) {
      console.error('Health check service error:', error);
      health.services.database = 'error';
      health.services.storage = 'error';
    }

    return NextResponse.json(health, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error'
      }, 
      { status: 500 }
    );
  }
}

export async function HEAD(request: NextRequest) {
  // Minimal health check for load balancers
  return new NextResponse(null, { status: 200 });
}