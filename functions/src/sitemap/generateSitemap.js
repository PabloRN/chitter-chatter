const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

/**
 * Generate sitemap.xml with static pages and dynamic rooms
 * @returns {Object} Result object with success status and page count
 */
async function generateSitemapXml() {
  const baseUrl = 'https://toonstalk.com';

  // Static pages with priorities and change frequencies
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/rooms', changefreq: 'daily', priority: 0.9 },
    { url: '/pricing', changefreq: 'weekly', priority: 0.8 },
    { url: '/privacy', changefreq: 'monthly', priority: 0.3 },
    { url: '/terms', changefreq: 'monthly', priority: 0.3 },
    { url: '/cookies', changefreq: 'monthly', priority: 0.3 },
    { url: '/acceptable-use', changefreq: 'monthly', priority: 0.3 },
  ];

  try {
    // Fetch all public rooms
    const roomsSnapshot = await admin.database().ref('rooms').once('value');
    const rooms = [];

    roomsSnapshot.forEach((child) => {
      const room = child.val();
      // Only include non-private rooms
      if (room && !room.private) {
        rooms.push({
          url: `/rooms/${child.key}`,
          changefreq: 'daily',
          priority: 0.7,
          lastmod: room.lastMessageAt || room.createdAt || null,
        });
      }
    });

    console.log(`Found ${rooms.length} public rooms for sitemap`);

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add all pages (static + dynamic)
    [...staticPages, ...rooms].forEach((page) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;

      if (page.lastmod) {
        const lastmodDate = new Date(page.lastmod);
        if (!Number.isNaN(lastmodDate.getTime())) {
          xml += `    <lastmod>${lastmodDate.toISOString()}</lastmod>\n`;
        }
      }

      xml += '  </url>\n';
    });

    xml += '</urlset>';

    // Write to Firebase Storage
    const bucket = admin.storage().bucket();
    const file = bucket.file('sitemap.xml');

    await file.save(xml, {
      contentType: 'application/xml',
      metadata: {
        cacheControl: 'public, max-age=3600', // Cache for 1 hour
      },
    });

    // Make file publicly readable
    await file.makePublic();

    const totalPages = staticPages.length + rooms.length;
    console.log(`Sitemap generated successfully with ${totalPages} pages`);

    return {
      success: true,
      pages: totalPages,
      staticPages: staticPages.length,
      roomPages: rooms.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}

/**
 * Manual HTTP endpoint to generate sitemap
 * Useful for testing or manual triggers
 */
exports.generateSitemap = onRequest(
  {
    region: 'us-central1',
  },
  async (req, res) => {
    try {
      const result = await generateSitemapXml();
      res.json(result);
    } catch (error) {
      console.error('Error in generateSitemap endpoint:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
);

/**
 * Scheduled function to automatically generate sitemap daily at 3 AM EST
 * This ensures the sitemap is always up-to-date with new rooms
 */
exports.scheduledSitemapUpdate = onSchedule(
  {
    schedule: '0 3 * * *', // 3 AM every day
    timeZone: 'America/New_York',
    region: 'us-central1',
  },
  async (event) => {
    try {
      const result = await generateSitemapXml();
      console.log('Scheduled sitemap update completed:', result, event);
      return result;
    } catch (error) {
      console.error('Error in scheduled sitemap update:', error);
      throw error;
    }
  },
);

/**
 * HTTP endpoint to serve the sitemap from Firebase Storage
 * This should be called via Firebase Hosting rewrite
 */
exports.serveSitemap = onRequest(
  {
    region: 'us-central1',
  },
  async (req, res) => {
    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file('sitemap.xml');

      // Check if file exists
      const [exists] = await file.exists();

      if (!exists) {
        // If sitemap doesn't exist, generate it on-the-fly
        console.log('Sitemap not found, generating...');
        await generateSitemapXml();
      }

      // Stream the file to response
      const stream = file.createReadStream();

      res.set('Content-Type', 'application/xml');
      res.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

      stream.pipe(res);
    } catch (error) {
      console.error('Error serving sitemap:', error);
      res.status(500).send('Error serving sitemap');
    }
  },
);
