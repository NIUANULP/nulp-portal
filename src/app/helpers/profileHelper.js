const uuidv1 = require("uuid/v1");
const envHelper = require("./environmentVariablesHelper.js");
const axios = require("axios");

const certificateCount = async (req, res) => {
  try {
    // Get the courses list

    const courses = await getCourses(req);

    const totalCertificateReceived = countNonEmptyCertificates(courses);
    // Get the batch list
    let arrayOfBatchList = [];
    await Promise.all(
      courses.map(async (item) => {
        let data = JSON.stringify({
          request: {
            filters: {
              status: "1",
              courseId: `${item?.courseId}`,
              enrollmentType: "open",
            },
            sort_by: {
              createdDate: "desc",
            },
          },
        });
        let getBatch = {
          method: "post",
          maxBodyLength: Infinity,
          url: `${envHelper.api_base_url}/learner/course/v1/batch/list`,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Cookie: `${req.headers.cookie}`,
          },
          data: data,
        };

        try {
          const getBatchList = await axios(getBatch);
          console.log("-------------------", getBatchList);

          const filteredBatchList =
            getBatchList?.data?.result?.response?.content?.filter((batch) => {
              const certTemplates = batch?.cert_templates;
              return (
                certTemplates !== null &&
                certTemplates !== undefined &&
                Object.keys(certTemplates).length > 0
              );
            });

          if (filteredBatchList?.length > 0) {
            arrayOfBatchList.push(filteredBatchList[0]);
          }
        } catch (batchError) {
          console.error(
            `Error fetching batch list for course ${item?.courseId}`,
            batchError
          );
        }
      })
    );

    const totalCourses = courses?.length || 0;
    let courseWithCertificate = arrayOfBatchList?.length || 0;
    if (totalCertificateReceived > courseWithCertificate) {
      const temp = totalCertificateReceived - courseWithCertificate;
      courseWithCertificate = courseWithCertificate + temp;
    }
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        totalCourses: totalCourses,
        courseWithCertificate: courseWithCertificate,
        certificateReceived: totalCertificateReceived,
      },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error("Error occurred while fetching certificate count", err);
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "unsuccessful",
        err: err.message,
        errmsg: null,
      },
      responseCode: "OK",
      message: "Error occurred while fetching  certificate count",
    });
  }
};
function countNonEmptyCertificates(data) {
  return data.reduce((count, obj) => {
    if (obj?.issuedCertificates?.length > 0) {
      count++;
    }
    return count;
  }, 0);
}

const courseCount = async (req, res) => {
  try {
    // Get the courses list

    const courses = await getCourses(req);
    // Get the total course count
    const totalCourses = courses?.length || 0;
    // Get the current date
    const currentDate = new Date();

    // Get the first day of the current month
    const firstDayOfCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    // Get the first day of the last month
    const firstDayOfLastMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );

    // Filter the array to get entries enrolled this month
    const enrolledThisMonth = courses.filter(
      (item) => new Date(item?.enrolledDate) >= firstDayOfCurrentMonth
    );

    // Filter the array to get entries enrolled last month
    const enrolledLastMonth = courses.filter(
      (item) =>
        new Date(item?.enrolledDate) >= firstDayOfLastMonth &&
        new Date(item?.enrolledDate) < firstDayOfCurrentMonth
    );

    // Get the counts
    const countThisMonth = enrolledThisMonth?.length || 0;
    const countLastMonth = enrolledLastMonth?.length || 0;

    // Get the count of courses with status 1 (ongoing courses)
    const status1Count =
      courses.filter((item) => item?.status === 1).length || 0;

    // Get the count of courses with status 2 (completed courses)
    const status2Count =
      courses.filter((item) => item?.status === 2).length || 0;

    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "successful",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        totalCourses: totalCourses,
        enrolledThisMonth: countThisMonth,
        enrolledLastMonth: countLastMonth,
        ongoingCourses: status1Count,
        completedCourses: status2Count,
      },
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error("Error occurred while fetching course enrolled count", err);
    res.status(statusCode).send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuidv1(),
        msgid: uuidv1(),
        status: "unsuccessful",
        err: err.message,
        errmsg: null,
      },
      responseCode: "OK",
      message: "Error occurred while fetching  course enrolled count",
    });
  }
};
async function getCourses(req) {
  try {
    // Get the courses list
    let config = {
      method: "get",

      url: `${envHelper.api_base_url}/learner/course/v1/user/enrollment/list/${req?.query?.user_id}?orgdetails=orgName,email&licenseDetails=name,description,url&fields=contentType,topic,name,channel,mimeType,appIcon,gradeLevel,resourceType,identifier,medium,pkgVersion,board,subject,trackable,primaryCategory,organisation&batchDetails=name,endDate,startDate,status,enrollmentType,createdBy,certificates`,
      headers: {
        "Content-Type": "application/json",
        Cookie: `${req.headers.cookie}`,
      },
    };

    const response = await axios(config);
    const courses = response?.data?.result?.courses;
    return courses;
  } catch (error) {
    throw error;
  }
}
module.exports = {
  certificateCount,
  courseCount,
};
