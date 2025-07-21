const axios = require("axios");
const envHelper = require("./environmentVariablesHelper.js");

/**
 * Fetches content data from the API for structured data generation
 * @param {number} page - Page number for pagination
 * @param {number} pageSize - Number of items per page
 * @returns {Promise<Object>} - API response data
 */
const fetchContentData = async (page = 1, pageSize = 100) => {
  const offset = (page - 1) * pageSize;

  const requestData = {
    request: {
      filters: {
        status: ["Live"],
        visibility: [],
        primaryCategory: [
          "Collection",
          "Resource",
          "Course",
          "eTextbook",
          "Explanation Content",
          "Learning Resource",
          "Practice Question Set",
          "ExplanationResource",
          "Practice Resource",
          "Exam Question",
          "Good Practices",
          "Reports",
          "Manual/SOPs",
        ],
      },
      limit: pageSize,
      offset: offset,
      sort_by: {
        lastUpdatedOn: "desc",
      },
      fields: [
        "name",
        "appIcon",
        "medium",
        "subject",
        "resourceType",
        "contentType",
        "organisation",
        "topic",
        "mimeType",
        "trackable",
        "gradeLevel",
        "se_boards",
        "board",
        "se_subjects",
        "se_mediums",
        "se_gradeLevels",
        "primaryCategory",
        "createdOn",
        "previewUrl",
        "creator",
        "identifier",
        "lastPublishedOn",
        "lastUpdatedOn",
        "lastPublishedBy",
        "lastUpdatedBy",
        "lastPublishedByUser",
        "lastUpdatedByUser",
      ],
      facets: ["channel", "gradeLevel", "subject", "medium"],
      query: "",
    },
  };

  const url = `${envHelper.api_base_url}/api/content/v1/search?orgdetails=orgName,email&licenseDetails=name,description,url`;

  const response = await axios.post(url, requestData, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

/**
 * Builds ItemList JSON-LD structured data
 * @param {Array} contentList - Array of content items
 * @param {number} offset - Offset for pagination
 * @returns {Object} - ItemList JSON-LD object
 */
const buildItemListJsonLd = (contentList, offset) => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: contentList.map((course, index) => ({
      "@type": "ListItem",
      position: offset + index + 1,
      item: {
        "@type": "Course",
        name: course.name,
        description: course.subject?.[0] || "Course",
        provider: {
          "@type": "Organization",
          name: course.organisation?.[0] || "NULP",
        },
        url: `${envHelper.api_base_url}/join-course?${course.identifier}`,
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          price: "0",
          priceCurrency: "INR",
          url: `${envHelper.api_base_url}/join-course?${course.identifier}`,
          category: course?.primaryCategory || "Course",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          startDate: course?.createdOn,
          endDate: course?.lastUpdatedOn,
          inLanguage: course?.language?.[0] || "English",
          courseWorkload: "PT1H",
        },
      },
    })),
  };
};

/**
 * Builds single Course JSON-LD structured data
 * @param {Object} course - Course object
 * @returns {Object|null} - Course JSON-LD object or null if no course
 */
const buildCourseJsonLd = (course) => {
  if (!course) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description: course.subject?.[0] || "Course",
    provider: {
      "@type": "Organization",
      name: course.organisation?.[0] || "NULP",
    },
    educationalLevel: course.gradeLevel?.[0],
    inLanguage: course.se_mediums?.[0] || "English",
    url: `${envHelper.api_base_url}/join-course?${course.identifier}`,
    datePublished: course.createdOn,
    dateModified: course.lastUpdatedOn,
    image: course.appIcon,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "INR",
      url: `${envHelper.api_base_url}/join-course?${course.identifier}`,
      category: course?.primaryCategory || "Course",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      startDate: course?.createdOn,
      endDate: course?.lastUpdatedOn,
      inLanguage: course?.language?.[0] || "English",
      courseWorkload: "PT1H",
    },
  };
};

/**
 * Generates structured data for SEO purposes
 * @param {number} page - Page number for pagination
 * @param {number} pageSize - Number of items per page
 * @returns {Promise<Object>} - Object containing structured data and pagination info
 */
const generateStructuredData = async (page = 1, pageSize = 100) => {
  try {
    const offset = (page - 1) * pageSize;

    // Fetch content data from API
    const apiData = await fetchContentData(page, pageSize);
    const contentList = apiData?.result?.content || [];

    // Build structured data
    const itemListJsonLd = buildItemListJsonLd(contentList, offset);
    const courseJsonLd = buildCourseJsonLd(contentList[0]);

    // Prepare structured data array
    const structuredData = [
      JSON.stringify(itemListJsonLd),
      courseJsonLd ? JSON.stringify(courseJsonLd) : null,
    ].filter(Boolean); // remove nulls

    return {
      structuredData,
      totalCount: apiData?.result?.count || 0,
      page,
      pageSize,
      contentList,
    };
  } catch (error) {
    console.error("Error generating structured data:", error);
    return {
      structuredData: [],
      totalCount: 0,
      page,
      pageSize,
      contentList: [],
    };
  }
};

module.exports = {
  generateStructuredData,
  fetchContentData,
  buildItemListJsonLd,
  buildCourseJsonLd,
};
