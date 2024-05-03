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

        const getBatchList = await axios(getBatch);

        const filteredBatchList =
          getBatchList?.data?.result?.response?.content.filter(
            (batch) =>
              batch.cert_templates !== null &&
              Object.keys(batch.cert_templates).length > 0
          );
        if (filteredBatchList?.length > 0) {
          arrayOfBatchList.push(filteredBatchList[0]);
        }
      })
    );

    const totalCourses = courses?.length;
    let courseWithCertificate = arrayOfBatchList?.length;
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
    console.log(`Error occurred while fetching  certificate count`);
    res.send({
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
  let count = 0;
  data.forEach((obj) => {
    if (obj?.issuedCertificates && obj?.issuedCertificates?.length > 0) {
      count++;
    }
  });
  return count;
}

const courseCount = async (req, res) => {
  try {
    // Get the courses list

    const courses = await getCourses(req);
    // Get the total course count
    const totalCourses = courses?.length;
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
      (item) => new Date(item.enrolledDate) >= firstDayOfCurrentMonth
    );

    // Filter the array to get entries enrolled last month
    const enrolledLastMonth = courses.filter(
      (item) =>
        new Date(item?.enrolledDate) >= firstDayOfLastMonth &&
        new Date(item?.enrolledDate) < firstDayOfCurrentMonth
    );

    // Get the counts
    const countThisMonth = enrolledThisMonth?.length;
    const countLastMonth = enrolledLastMonth?.length;
    // Get the count of courses with status 1
    // Status 1 is ongoing course
    const status1Count = courses.filter((item) => item.status === 1).length;

    // Get the count of courses with status 2
    // Status 2 is completed course
    const status2Count = courses.filter((item) => item.status === 2).length;

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
    console.log(`Error occurred while fetching  course enrolled count`);
    res.send({
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
