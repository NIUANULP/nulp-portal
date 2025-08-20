const axios = require("axios");
const envHelper = require("./environmentVariablesHelper.js");

class SitemapHelper {
  constructor() {
    this.baseUrl = envHelper.api_base_url;
  }

  // XML escape function to handle special characters
  escapeXML(text) {
    if (!text) return "";
    return text
      .toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // Format date to W3C Date format (ISO 8601) for XML sitemaps
  formatDateForSitemap(dateInput) {
    if (!dateInput) {
      return new Date().toISOString();
    }

    let date;

    try {
      // Handle different input types
      if (typeof dateInput === "string") {
        // Handle common date formats from API
        if (dateInput.includes("+")) {
          // Format: "2024-05-17T09:52:14.433+0000"
          date = new Date(dateInput);
        } else {
          // Try parsing as is
          date = new Date(dateInput);
        }
      } else if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === "number") {
        // Unix timestamp (milliseconds or seconds)
        date = new Date(dateInput < 1e12 ? dateInput * 1000 : dateInput);
      } else {
        // Fallback to current date
        date = new Date();
      }

      // Validate the date
      if (isNaN(date.getTime()) || date.getTime() < 0) {
        console.warn(`Invalid date detected: ${dateInput}, using current date`);
        date = new Date();
      }

      // Ensure date is not in the future (sitemap best practice)
      const now = new Date();
      if (date > now) {
        date = now;
      }

      // Return in ISO format (W3C Date format)
      return date.toISOString();
    } catch (error) {
      console.error(`Error formatting date ${dateInput}:`, error);
      return new Date().toISOString();
    }
  }

  // URL encode function to ensure valid URLs
  encodeURL(url) {
    try {
      // First decode to handle already encoded URLs, then encode properly
      const decoded = decodeURIComponent(url);
      return encodeURI(decoded);
    } catch (error) {
      // If decoding fails, try to encode as is
      return encodeURI(url);
    }
  }

  // Only public routes that Google can crawl (no authentication required)
  getStaticRoutes() {
    return [
      // Main public routes
      { url: "/", changefreq: "daily", priority: "1.0" },
      // Public webapp routes (main content area)
      { url: "/webapp", changefreq: "daily", priority: "0.9" },
      { url: "/webapp/join-course", changefreq: "daily", priority: "0.9" },
      { url: "/webapp/player", changefreq: "daily", priority: "0.9" },
    ];
  }

  // Fetch dynamic content from API (only public content)
  async getDynamicContent() {
    try {
      const data = JSON.stringify({
        request: {
          filters: {
            status: ["Live"],
            visibility: [],
            primaryCategory: [
              "Course",
              "Good Practices",
              "Reports",
              "Manual/SOPs",
            ],
          },
          limit: 10000, // Get all content for sitemap
          offset: 0,
          sort_by: {
            lastUpdatedOn: "desc",
          },
          fields: [
            "identifier",
            "name",
            "lastUpdatedOn",
            "createdOn",
            "primaryCategory",
            "subject",
            "gradeLevel",
            "medium",
            "board",
            "visibility",
          ],
          facets: ["channel", "gradeLevel", "subject", "medium", "board"],
          query: "",
        },
      });

      const url = `${envHelper.api_base_url}/api/content/v1/search?orgdetails=orgName,email&licenseDetails=name,description,url`;
      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response.data?.result?.content || [];
    } catch (error) {
      console.error("Error fetching dynamic content for sitemap:", error);
      return [];
    }
  }

  // Convert content to sitemap URLs (webapp routes only)
  contentToSitemapUrls(contentList) {
    if (!Array.isArray(contentList)) {
      console.warn("contentList is not an array, returning empty array");
      return [];
    }

    return contentList
      .filter(
        (content) =>
          content && (content.visibility === "Default" || !content.visibility)
      ) // Only public content and valid objects
      .filter(
        (content) =>
          content.identifier && typeof content.identifier === "string"
      ) // Ensure identifier exists and is string
      .map((content) => {
        try {
          // Use the first available date and format it properly
          const dateToUse =
            content.lastUpdatedOn ||
            content.lastPublishedOn ||
            content.createdOn;
          const isCourse = content?.primaryCategory?.toLowerCase() === "course";
          const identifier = encodeURIComponent(content.identifier);

          return {
            url: isCourse
              ? `/webapp/join-course?${identifier}`
              : `/webapp/player?id=${identifier}`,
            changefreq: "daily",
            priority: "0.6",
            lastmod: this.formatDateForSitemap(dateToUse),
          };
        } catch (error) {
          console.error(
            `Error processing content ${content.identifier}:`,
            error
          );
          return null;
        }
      })
      .filter((url) => url !== null); // Remove any failed conversions
  }

  // Validate URL object structure
  validateUrlObject(urlObj) {
    if (!urlObj || typeof urlObj !== "object") {
      return false;
    }

    // Check required fields
    if (!urlObj.url || typeof urlObj.url !== "string") {
      return false;
    }

    // Validate URL format
    if (!urlObj.url.startsWith("/")) {
      return false;
    }

    // Validate optional fields
    if (
      urlObj.priority &&
      (isNaN(urlObj.priority) || urlObj.priority < 0 || urlObj.priority > 1)
    ) {
      return false;
    }

    return true;
  }

  // Generate XML sitemap
  generateSitemapXML(urls) {
    const validUrls = urls.filter((url) => this.validateUrlObject(url));

    if (validUrls.length !== urls.length) {
      console.warn(
        `Filtered out ${
          urls.length - validUrls.length
        } invalid URLs from sitemap`
      );
    }

    const urlSet = validUrls
      .map((url) => {
        try {
          const fullUrl = this.encodeURL(`${this.baseUrl}${url.url}`);
          const lastmod = this.escapeXML(
            this.formatDateForSitemap(url.lastmod)
          );
          const changefreq = this.escapeXML(url.changefreq || "daily");
          const priority = this.escapeXML(url.priority || "0.6");

          return `
    <url>
      <loc>${this.escapeXML(fullUrl)}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>
    </url>`;
        } catch (error) {
          console.error(`Error processing URL ${url.url}:`, error);
          return null;
        }
      })
      .filter((urlXml) => urlXml !== null)
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${urlSet}
</urlset>`;
  }

  // Generate sitemap index for large sitemaps
  generateSitemapIndex(sitemaps) {
    const sitemapSet = sitemaps
      .map((sitemap) => {
        const fullUrl = this.encodeURL(`${this.baseUrl}${sitemap.url}`);
        const lastmod = this.escapeXML(
          this.formatDateForSitemap(sitemap.lastmod)
        );

        return `
    <sitemap>
      <loc>${this.escapeXML(fullUrl)}</loc>
      <lastmod>${lastmod}</lastmod>
    </sitemap>`;
      })
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapSet}
</sitemapindex>`;
  }

  // Main method to generate complete sitemap (public routes only)
  async generateSitemap() {
    try {
      console.log("Generating sitemap for public routes only...");

      // Get static public routes
      const staticRoutes = this.getStaticRoutes()
        .filter((route) => route && route.url) // Ensure valid routes
        .map((route) => ({
          ...route,
          lastmod: this.formatDateForSitemap(new Date()),
        }));

      // Get dynamic public content with error handling
      let publicContent = [];
      try {
        const dynamicContent = await this.getDynamicContent();
        publicContent = dynamicContent.filter(
          (content) =>
            content &&
            content.identifier &&
            (content.visibility === "Default" || !content.visibility)
        );
      } catch (error) {
        console.error(
          "Error fetching dynamic content, using static routes only:",
          error
        );
      }

      const contentUrls = this.contentToSitemapUrls(publicContent);

      // Combine all URLs and filter out any invalid ones
      const allUrls = [...staticRoutes, ...contentUrls].filter(
        (url) => url && url.url
      ); // Remove any null/undefined URLs

      console.log(`Generated sitemap with ${allUrls.length} public URLs`);
      console.log(`- Static routes: ${staticRoutes.length}`);
      console.log(`- Public content: ${contentUrls.length}`);

      // Validate we have at least some URLs
      if (allUrls.length === 0) {
        console.warn("No valid URLs found for sitemap, using fallback");
        return this.generateSitemapXML([
          {
            url: "/",
            changefreq: "daily",
            priority: "1.0",
            lastmod: this.formatDateForSitemap(new Date()),
          },
        ]);
      }

      // If too many URLs, split into multiple sitemaps
      if (allUrls.length > 50000) {
        return this.generateSitemapIndex(
          this.splitIntoMultipleSitemaps(allUrls)
        );
      }

      return this.generateSitemapXML(allUrls);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      // Return a basic fallback sitemap
      return this.generateSitemapXML([
        {
          url: "/",
          changefreq: "daily",
          priority: "1.0",
          lastmod: this.formatDateForSitemap(new Date()),
        },
      ]);
    }
  }

  // Split large sitemaps into multiple files
  splitIntoMultipleSitemaps(urls) {
    const sitemaps = [];
    const chunkSize = 45000; // Leave room for other URLs

    for (let i = 0; i < urls.length; i += chunkSize) {
      const chunk = urls.slice(i, i + chunkSize);
      const sitemapIndex = Math.floor(i / chunkSize) + 1;

      sitemaps.push({
        url: `/sitemap-${sitemapIndex}.xml`,
        content: this.generateSitemapXML(chunk),
        lastmod: this.formatDateForSitemap(new Date()),
      });
    }

    return sitemaps;
  }

  // Generate robots.txt content
  generateRobotsTxt() {
    return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${this.baseUrl}/sitemap.xml

# Allow public routes
Allow: /webapp/
Allow: /webapp/join-course
Allow: /webapp/player
Allow: /discussion-forum/

# Disallow protected/private routes
Disallow: /learn/
Disallow: /resources/
Disallow: /profile/
Disallow: /search/
Disallow: /workspace/
Disallow: /dashboard/
Disallow: /dashBoard/
Disallow: /manage/
Disallow: /contribute/
Disallow: /groups/
Disallow: /my-groups/
Disallow: /announcement/
Disallow: /orgType/
Disallow: /myActivity/
Disallow: /org/
Disallow: /observation/
Disallow: /solution/
Disallow: /questionnaire/
Disallow: /uci-admin/
Disallow: /program/
Disallow: /home/
Disallow: /contents/
Disallow: /certificate/
Disallow: /learningHistory/
Disallow: /continueLearning/
Disallow: /help/
Disallow: /framework/
Disallow: /addConnections/
Disallow: /domainList/
Disallow: /contentList/
Disallow: /joinCourse/
Disallow: /pdf/
Disallow: /noresult/
Disallow: /user/
Disallow: /view-all/
Disallow: /nulp-chatbot/

# Disallow admin and system routes
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /callback/
Disallow: /logout/
Disallow: /login/
Disallow: /auth/
Disallow: /v1/
Disallow: /v2/
Disallow: /v3/
Disallow: /dist/
Disallow: /assets/libs/
Disallow: /tenant/
Disallow: /sunbird-plugins/

# Allow important static resources
Allow: /assets/images/
Allow: /assets/styles/
Allow: /favicon.ico

# Crawl delay
Crawl-delay: 1`;
  }
}

module.exports = SitemapHelper;
