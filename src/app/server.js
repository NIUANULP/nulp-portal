"use strict";
const { enableLogger } = require("@project-sunbird/logger");
const envHelper = require("./helpers/environmentVariablesHelper.js");
const path = require("path");
const fs = require("fs");
const packageObj = JSON.parse(fs.readFileSync("package.json", "utf8"));
const fetch = require("node-fetch");

enableLogger({
  logBasePath: path.join(__dirname, "logs"),
  logLevel: envHelper.sunbird_portal_log_level,
  eid: "LOG",
  context: {
    channel: envHelper.DEFAULT_CHANNEL,
    env: envHelper.APPID,
    pdata: {
      id: envHelper.APPID,
      ver: packageObj.version,
      pid: "sunbird-portal-backend",
    },
  },
  adopterConfig: {
    adopter: "winston",
  },
});

const { Client } = require('pg')
const client = new Client({
  // user: envHelper.learnathon_voting_table_user,
  // host: envHelper.learnathon_voting_table_host,
  // database: envHelper.learnathon_voting_table_database,
  // password: envHelper.learnathon_voting_table_password,
  // port: envHelper.learnathon_voting_table_port

  // user:'postgres',
  // host: '192.168.2.5',
  // database: 'learnathon',
  // password: '4f487e7141307c67ef7c',
  // port: 5432,

  user:'postgres',
  host: '127.0.0.1',
  database: 'postgres',
  password: 'postgres',
  port: 4000,

})
client.connect(function(err) {
  if (err) throw err;
});
const { logger, enableDebugMode } = require("@project-sunbird/logger");
const express = require("express");
const gracefulShutdown = require("http-graceful-shutdown");
const proxy = require("express-http-proxy");
const session = require("express-session");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const uuid = require("uuid/v1");
const dateFormat = require("dateformat");
const _ = require("lodash");
const trampolineServiceHelper = require("./helpers/trampolineServiceHelper.js");
const telemetryHelper = require("./helpers/telemetryHelper.js");
const tenantHelper = require("./helpers/tenantHelper.js");
const proxyUtils = require("./proxy/proxyUtils.js");
const healthService = require("./helpers/healthCheckService.js");
const latexService = require("./helpers/latexService.js");
const { getKeyCloakClient, memoryStore } = require("./helpers/keyCloakHelper");
const request = require("request-promise");
const portal = this;
const telemetry = new (require("sb_telemetry_util"))();
const telemetryEventConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, "helpers/telemetryEventConfig.json"))
);
const userService = require("./helpers/userService");
const { frameworkAPI } = require("@project-sunbird/ext-framework-server/api");
const frameworkConfig = require("./framework.config.js");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const kidTokenPublicKeyBasePath = envHelper.sunbird_kid_public_key_base_path;
const { loadTokenPublicKeys } = require("sb_api_interceptor");
const {
  getGeneralisedResourcesBundles,
} = require("./helpers/resourceBundleHelper.js");
const { apiWhiteListLogger, isAllowed } = require("./helpers/apiWhiteList");
const { registerDeviceWithKong } = require("./helpers/kongTokenHelper");

let keycloak = getKeyCloakClient({
  realm: envHelper.PORTAL_REALM,
  "auth-server-url": envHelper.PORTAL_AUTH_SERVER_URL,
  "ssl-required": "none",
  resource: envHelper.PORTAL_AUTH_SERVER_CLIENT,
  "public-client": true,
});
const addLogContext = (req, res, next) => {
  req.context = {
    channel: envHelper.DEFAULT_CHANNEL,
    env: envHelper.APPID,
    did: req.get("X-Device-ID"),
    reqId: req.get("X-Request-ID"),
    sid: req.get("X-Session-ID"),
    pdata: {
      id: req.get("X-App-Id"),
      pid: "",
      ver: req.get("X-App-Version"),
    },
    userId: req.get("X-User-ID"),
    isDebugEnabled: req.get("X-Debug-Enable"),
  };
  next();
};
logger.info({
  msg: `logger initialized with LEVEL= ${envHelper.sunbird_portal_log_level}`,
});
const app = express();

app.use(cookieParser());
app.use(helmet());
app.use(addLogContext);

if (envHelper.KONG_DEVICE_REGISTER_ANONYMOUS_TOKEN === "true") {
  app.use(
    session({
      secret: "717b3357-b2b1-4e39-9090-1c712d1b8b64",
      resave: false,
      cookie: {
        maxAge: envHelper.sunbird_anonymous_session_ttl,
      },
      saveUninitialized: false,
      store: memoryStore,
    }),
    registerDeviceWithKong()
  );
}

app.all(
  [
    "/learner/*",
    "/content/*",
    "/user/*",
    "/merge/*",
    "/action/*",
    "/courseReports/*",
    "/course-reports/*",
    "/admin-reports/*",
    "/certreg/*",
    "/device/*",
    "/google/*",
    "/report/*",
    "/reports/*",
    "/v2/user/*",
    "/v1/sso/*",
    "/migrate/*",
    "/plugins/*",
    "/content-plugins/*",
    "/content-editor/telemetry",
    "/discussion/*",
    "/collection-editor/telemetry",
    "/v1/user/*",
    "/sessionExpired",
    "/logoff",
    "/logout",
    "/assets/public/*",
    "/endSession",
    "/sso/sign-in/*",
    "/v1/desktop/handleGauth",
    "/v1/desktop/google/auth/success",
    "/clearSession",
    "/kendra/*",
    "/dhiti/*",
    "/assessment/*",
    "/cloudUpload/*",
    "/apple/auth/*",
    "/uci/*",
  ],
  session({
    secret: envHelper.PORTAL_SESSION_SECRET_KEY,
    resave: false,
    cookie: {
      maxAge: envHelper.sunbird_session_ttl,
    },
    saveUninitialized: false,
    store: memoryStore,
  }),
  keycloak.middleware({ admin: "/callback", logout: "/logout" })
);

app.all("/logoff", endSession, (req, res) => {
  // Clear cookie for client (browser)
  res.status(200).clearCookie("connect.sid", { path: "/" });
  // Clear session pertaining to User
  req.session.destroy(function (err) {
    res.redirect("/logout");
  });
});





// ===============

var secureToken ;
var totalRegistration;
var tokenDetails = {
  "client_id": "lms",
  "client_secret": "94196871-d583-407d-a835-d20122c71fbb",
  "grant_type": "client_credentials"
};

var formBody = [];
for (var property in tokenDetails) {
var encodedKey = encodeURIComponent(property);
var encodedValue = encodeURIComponent(tokenDetails[property]);
formBody.push(encodedKey + "=" + encodedValue);
}
formBody = formBody.join("&");
//  fetch('https://nulp.niua.org/auth/realms/sunbird/protocol/openid-connect/token', {
// method: 'POST',
// headers: {
//   "Content-Type": "application/x-www-form-urlencoded"
// },
// body: formBody
// }).then((response) => response.json())
// .then((responseData) => {
//   secureToken =responseData.access_token
//   console.log("responseData-----------",secureToken); 
// }).catch(err=>{console.log(err)})


  app.get("/newRegistrations", ( req,res, next) => {
    fetch('https://nulp.niua.org/api/user/v1/search', {
  method: 'POST',
  headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkTEJ3cG5MdE1SVWRCOTVBdWFCWjhMd0hSR2lTUTBpVCJ9.Q7-3SuUgnZXJuu-j2_kw9r8J82ckSxRR6zxylpgVG5o",
    "x-authenticated-user-token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI5bC1PTmFodUVWbFN3c1RKbFJlQjg3QmxxN21OQjFJSHd0M1pvcl9QRWpVIn0.eyJqdGkiOiJlYjFkZGJhYy04ZGMwLTQ5NjgtODU5OC01NTE5N2E3MDAwZTciLCJleHAiOjE2ODY5MDkxMDMsIm5iZiI6MCwiaWF0IjoxNjg2ODIyNzAzLCJpc3MiOiJodHRwczovL251bHAubml1YS5vcmcvYXV0aC9yZWFsbXMvc3VuYmlyZCIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiI3M2VkZjFiNi00Y2QyLTQ1N2MtYTEyMS0xZGRhN2E2MzgyNDgiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJsbXMiLCJhdXRoX3RpbWUiOjAsInNlc3Npb25fc3RhdGUiOiIzOWJjOTJhMC0wNzc4LTQ2NzUtYTdiZS00ZDA5NGQxNmNjNDUiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vbnVscC5uaXVhLm9yZyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJhZG1pbiIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJtYW5hZ2UtdXNlcnMiXX0sImxtcyI6eyJyb2xlcyI6WyJ1bWFfcHJvdGVjdGlvbiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiIiLCJjbGllbnRJZCI6ImxtcyIsImNsaWVudEhvc3QiOiIxMTYuNzQuMjA5LjgzIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic2VydmljZS1hY2NvdW50LWxtcyIsImNsaWVudEFkZHJlc3MiOiIxMTYuNzQuMjA5LjgzIiwiZW1haWwiOiJzZXJ2aWNlLWFjY291bnQtbG1zQHBsYWNlaG9sZGVyLm9yZyJ9.TI-DmqMoDhXM6BFY7vjv0Wek8fIoxiSDOt7kUM2xB_-B0QreMMFZdqAxyggUA06CPMLDARGPFnRP24DsA8XqIECH3OpMq31gsEHKLRybL3p1YVA9-VDxQCvYgO53A54Eb4DlkQwlpfvmr91PsNuysHFarF6_kVdI3tQlHNk3YoNQeGKbWC3E-HvlW26KD4yjLc_LoEVwzF6Vhl6TtTDhFzSlT7W2fQ7zWXAYIs1vzyFYSZ645QaksOTJiDVvshtve8XHVv9zUJ94-dCUVnytpvfiqrV7MH9x7nBHnj7xUeXzWU37cgYYfojCoKyqZcDBz_5bF2wpnyuOqDNvcimgbw",
    "Content-Type": "application/json"
  },
  body:  JSON.stringify({
    "request": {
      "filters": {
        "createdDate": {
          ">=": "2023-03-13 00:00"
        },
        "status": "1"
      },
      "fields": [
        "count",
        "framework"
      ]
    }
  })
  }).then((response) => response.json())
  .then((responseData) => {
    totalRegistration = responseData.result.response.count
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuid(),
        msgid: uuid(),
        status: "successful",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        data: totalRegistration ,
      },
    });

  }).catch(err=>{console.log(err)});
  
  });

app.post("/learnCount", bodyParser.json({ limit: "10mb" }), (req, res) => {
  // file system module to perform file operations
  const fs = require("fs");

  // stringify JSON Object
  var jsonContent = JSON.stringify(req.body);

  fs.writeFile(
    "liveLearnDashboardCounts.json",
    jsonContent,
    "utf8",
    function (err) {
      if (err) {
        return console.log(err);
      }
    }
  );

  res.status(200).send();
});

app.get("/counts", (req, res, next) => {
  const fs1 = require("fs");
  const countData = JSON.parse(
    fs1.readFileSync("liveLearnDashboardCounts.json", "utf8")
  );
  res.send({
    ts: new Date().toISOString(),
    params: {
      resmsgid: uuid(),
      msgid: uuid(),
      status: "successful",
      err: null,
      errmsg: null,
    },
    responseCode: "OK",
    result: {
      data: { ...countData },
    },
  });
});

app.post("/learnVote", bodyParser.json({ limit: "10mb" }), (req, res) => {

    let date_time = new Date();
    let date =  dateFormat(date_time, 'yyyy-mm-dd');
    let time =  date_time.getHours() + ":" +  date_time.getMinutes() + ":" + date_time.getSeconds();
    const { userId, contentId , vote,userName,UserMobile, userEmail,userCity, reasonOfVote, votedOn } = req.body.body[0]
    const body = [userId, contentId , vote,userName,UserMobile, userEmail,userCity, reasonOfVote, date, time]


    fetch('https://nulp.niua.org/api/user/v1/search', {
  method: 'POST',
  headers: {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJkTEJ3cG5MdE1SVWRCOTVBdWFCWjhMd0hSR2lTUTBpVCJ9.Q7-3SuUgnZXJuu-j2_kw9r8J82ckSxRR6zxylpgVG5o",
    "x-authenticated-user-token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI5bC1PTmFodUVWbFN3c1RKbFJlQjg3QmxxN21OQjFJSHd0M1pvcl9QRWpVIn0.eyJqdGkiOiJlYjFkZGJhYy04ZGMwLTQ5NjgtODU5OC01NTE5N2E3MDAwZTciLCJleHAiOjE2ODY5MDkxMDMsIm5iZiI6MCwiaWF0IjoxNjg2ODIyNzAzLCJpc3MiOiJodHRwczovL251bHAubml1YS5vcmcvYXV0aC9yZWFsbXMvc3VuYmlyZCIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiI3M2VkZjFiNi00Y2QyLTQ1N2MtYTEyMS0xZGRhN2E2MzgyNDgiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJsbXMiLCJhdXRoX3RpbWUiOjAsInNlc3Npb25fc3RhdGUiOiIzOWJjOTJhMC0wNzc4LTQ2NzUtYTdiZS00ZDA5NGQxNmNjNDUiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbImh0dHBzOi8vbnVscC5uaXVhLm9yZyJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJhZG1pbiIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsicmVhbG0tbWFuYWdlbWVudCI6eyJyb2xlcyI6WyJtYW5hZ2UtdXNlcnMiXX0sImxtcyI6eyJyb2xlcyI6WyJ1bWFfcHJvdGVjdGlvbiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiIiLCJjbGllbnRJZCI6ImxtcyIsImNsaWVudEhvc3QiOiIxMTYuNzQuMjA5LjgzIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic2VydmljZS1hY2NvdW50LWxtcyIsImNsaWVudEFkZHJlc3MiOiIxMTYuNzQuMjA5LjgzIiwiZW1haWwiOiJzZXJ2aWNlLWFjY291bnQtbG1zQHBsYWNlaG9sZGVyLm9yZyJ9.TI-DmqMoDhXM6BFY7vjv0Wek8fIoxiSDOt7kUM2xB_-B0QreMMFZdqAxyggUA06CPMLDARGPFnRP24DsA8XqIECH3OpMq31gsEHKLRybL3p1YVA9-VDxQCvYgO53A54Eb4DlkQwlpfvmr91PsNuysHFarF6_kVdI3tQlHNk3YoNQeGKbWC3E-HvlW26KD4yjLc_LoEVwzF6Vhl6TtTDhFzSlT7W2fQ7zWXAYIs1vzyFYSZ645QaksOTJiDVvshtve8XHVv9zUJ94-dCUVnytpvfiqrV7MH9x7nBHnj7xUeXzWU37cgYYfojCoKyqZcDBz_5bF2wpnyuOqDNvcimgbw",
    "Content-Type": "application/json"
  },
  body:  JSON.stringify({
    "request": {
      "filters": {
        "userId": userId, //d76e1f15-581f-49f3-b85b-d24d561699ec
        "status": "1"
      },
      "fields": [
        "count",
        "framework"
      ]
    }
  })
  }).then((response) => response.json())
  .then((responseData) => {
    if(responseData.result.response.count == 1){


    client.query("SELECT * FROM public.learnvote WHERE content_id = '"+contentId +"'AND "+"user_id = '"+ userId + "'").then(( results) =>{
      if (results.rowCount != 0)  {
       res.send({
         ts: new Date().toISOString(),
         params: {
           resmsgid: uuid(),
           msgid: uuid(),
           status: "error",
           err: null,
           errmsg: "Vote already present",
         },
         responseCode: "OK",
         result: {
           data:  "You have already voted this content",
         },
       })
      } else{
       client.query('INSERT INTO learnvote (user_id, content_id, vote, user_name,user_mobile, user_email, user_city, reason_of_vote, voting_date, voting_time) VALUES ($1, $2,$3,$4,$5,$6,$7,$8,$9, $10) RETURNING *', body, (error, results) => {
   
         if (error) {
           console.log("errr-----------", error)
           throw error
         }
         if(results){
           console.log("errr-----------", error)
           res.send({
             ts: new Date().toISOString(),
             params: {
               resmsgid: uuid(),
               msgid: uuid(),
               status: "successful",
               err: null,
               errmsg: null,
             },
             responseCode: "OK",
             result: {
               data: { ...results },
             },
           })
         }
       })
      }
   },err=>{
     console.log("errr-----------", err);
   })
    }
    
  }).catch(err=>{
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuid(),
        msgid: uuid(),
        status: "error",
        err: null,
        errmsg: "User not found",
      },
      responseCode: "OK",
      result: {
        data:  "User not found",
      },
    })
  });



});

app.get("/voteCount", (req, res, next) => {
  var fileExists;
  var countData;
  const contentId = req.query.contentId
  const userId = req.query.userId

var query;
if(contentId && userId){
   query = "SELECT * FROM public.learnvote WHERE content_id = '"+ contentId +"'AND "+"user_id = '"+ userId + "'";

}else if(contentId)
{
  query = "SELECT * FROM public.learnvote WHERE content_id = '"+ contentId + "'";

}else{
  query = "SELECT * FROM public.learnvote ";
}

client.query(query).then(( results) =>{
    res.send({
      ts: new Date().toISOString(),
      params: {
        resmsgid: uuid(),
        msgid: uuid(),
        status: "successful",
        err: null,
        errmsg: null,
      },
      responseCode: "OK",
      result: {
        data: { ...results.rows },
        count:results.rowCount,
      },
    });  
},err=>{
  console.log("errr-----------", err);
})

});



// ===============================


const morganConfig = (tokens, req, res) => {
  let edata = {
    eid: "LOG",
    edata: {
      type: "system",
      level: "TRACE",
      requestid: req.get("x-request-id"),
      message: "ENTRY LOG: " + req.get("x-msgid"),
      params: req.body ? JSON.stringify(req.body) : "empty",
    },
  };
  const tokensList = [
    tokens.url(req, res),
    tokens.method(req, res),
    "context: " + JSON.stringify(req.context),
    tokens.status(req, res),
    "eid: LOG",
    "edata: " + JSON.stringify(edata),
  ];
  if (req.context.isDebugEnabled) {
    // add more info when log level is debug
    tokensList.push(
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
      "requestHeader:",
      JSON.stringify(req.headers),
      "requestBody:",
      req.body ? JSON.stringify(req.body) : "empty",
      "responseBody:",
      res.body
    );
  }
  return tokensList.join(" ");
};

const captureResBodyForLogging = (req, res, next) => {
  if (req.context.isDebugEnabled) {
    // store body only in debug mode
    const _resWrite = res.write;
    const _resEnd = res.end;
    let chunks = [];
    res.write = (chunk) => {
      chunks.push(Buffer.from(chunk));
      _resWrite.apply(res, chunk);
    };
    let ended = false;
    res.end = (chunk, encoding) => {
      if (chunk) chunks.push(Buffer.from(chunk));
      res.body = Buffer.concat(chunks).toString("utf8");
      _resEnd.call(res, chunk, encoding);
    };
  }
  next();
};

/**
 * @param  {Object} - Request object
 * @param  {Object} - Response object
 * @description API to clear session for mobile browser redirection
 * @since release-3.8.0
 */
app.all("/clearSession", (req, res) => {
  res.status(200).clearCookie("connect.sid", { path: "/" });
  req.session.destroy(function (err) {
    res.sendStatus(200);
  });
});

app.use(
  [
    "/api/*",
    "/user/*",
    "/merge/*",
    "/device/*",
    "/google/*",
    "/v2/user/*",
    "/v1/sso/*",
    "/migrate/*",
    "/v1/user/*",
    "/logoff",
    "/logout",
    "/sso/sign-in/*",
  ],
  captureResBodyForLogging,
  morgan(morganConfig)
); // , { skip: (req, res) => !(logger.level === "debug") })); // skip logging if logger level is not debug

app.get("/enableDebugMode", (req, res, next) => {
  const logLevel = req.query.logLevel || "debug";
  const timeInterval = req.query.timeInterval
    ? parseInt(req.query.timeInterval)
    : 1000 * 60 * 10;
  enableDebugMode(timeInterval, logLevel);
  res.send({
    id: "enabledDebugMode",
    ver: "1.0",
    ts: new Date().toISOString(),
    params: {
      resmsgid: uuid(),
      msgid: uuid(),
      status: "successful",
      err: null,
      errmsg: null,
    },
    responseCode: "OK",
    result: {
      enabled: true,
    },
  });
});

app.all("/sessionExpired", endSession, (req, res) => {
  const redirectUri =
    req.get("referer") ||
    `${_.get(envHelper, "SUNBIRD_PORTAL_BASE_URL")}/profile`;
  const logoutUrl = keycloak.logoutUrl(redirectUri);
  delete req.session.userId;
  res.cookie("connect.sid", "", { expires: new Date() });
  res.redirect(logoutUrl);
});

app.get("/endSession", endSession, (req, res) => {
  delete req.session.userId;
  res.cookie("connect.sid", "", { expires: new Date() });
  res.status(200);
  res.end();
});
// device routes
require("./routes/deviceRoutes.js")(app);
require("./routes/googleRoutes.js")(app);

app.get(
  "/health",
  healthService.createAndValidateRequestBody,
  healthService.checkHealth
); // health check api

app.get(
  "/service/health",
  healthService.createAndValidateRequestBody,
  healthService.checkSunbirdPortalHealth
);

app.get("/latex/convert", latexService.convert);
app.post(
  "/latex/convert",
  bodyParser.json({ limit: "1mb" }),
  latexService.convert
);
app.post(
  "/user/v2/accept/tnc",
  bodyParser.json({ limit: "1mb" }),
  userService.acceptTnc
);
app.get(
  "/user/v1/switch/:userId",
  bodyParser.json({ limit: "1mb" }),
  keycloak.protect(),
  userService.switchUser
);

require("./routes/desktopAppRoutes.js")(app); // desktop app routes

require("./routes/googleSignInRoutes.js")(app, keycloak); // google sign in routes

require("./routes/ios.js")(app, keycloak); // apple sign in routes

require("./routes/ssoRoutes.js")(app, keycloak); // sso routes

require("./routes/refreshTokenRoutes.js")(app, keycloak); // refresh token routes

require("./routes/accountMergeRoute.js")(app, keycloak); // refresh token routes

require("./routes/clientRoutes.js")(app, keycloak); // client app routes

require("./routes/reportRoutes.js")(app, keycloak); // report routes

require("./routes/discussionsForum.js")(app, keycloak); // report routes

require("./routes/uci.js")(app, keycloak); // report routes

app.all(
  ["/content-editor/telemetry", "/collection-editor/telemetry"],
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json({ limit: "50mb" }),
  keycloak.protect(),
  telemetryHelper.logSessionEvents
);

require("./routes/groupRoutes.js")(app); // group api routes

require("./routes/notificationRoute.js")(app); // notification api routes

require("./routes/learnerRoutes.js")(app); // learner api routes

require("./routes/mlRoutes.js")(app); // observation api routes

//cert-reg routes
require("./routes/certRegRoutes.js")(app);

app.all(
  ["/content/data/v1/telemetry", "/action/data/v3/telemetry"],
  proxy(envHelper.TELEMETRY_SERVICE_LOCAL_URL, {
    limit: "50mb",
    proxyReqOptDecorator: proxyUtils.decorateRequestHeaders(
      envHelper.TELEMETRY_SERVICE_LOCAL_URL
    ),
    proxyReqPathResolver: (req) =>
      require("url").parse(
        envHelper.TELEMETRY_SERVICE_LOCAL_URL + telemetryEventConfig.endpoint
      ).path,
  })
);

app.get(
  ["/v1/tenant/info", "/v1/tenant/info/:tenantId"],
  proxyUtils.addCorsHeaders,
  tenantHelper.getInfo
); // tenant api

require("./routes/publicRoutes.js")(app); // public api routes

require("./proxy/contentEditorProxy.js")(app, keycloak); // proxy api routes

require("./routes/contentRoutes.js")(app); // content api routes

require("./proxy/localProxy.js")(app); // Local proxy for content and learner service

app.all("/v1/user/session/create", (req, res) =>
  trampolineServiceHelper.handleRequest(req, res, keycloak)
);

app.get(
  "/getGeneralisedResourcesBundles/:lang/:fileName",
  proxyUtils.addCorsHeaders,
  getGeneralisedResourcesBundles
);

app.get("/v1/user/session/start/:deviceId", (req, res) => {
  if (req.session.logSession === false) {
    req.session.deviceId = req.params.deviceId;
    telemetryHelper.logSessionStart(req);
    req.session.logSession = true;
  }
  res.status(200);
  res.end();
});

const subApp = express();
subApp.use(bodyParser.json({ limit: "50mb" }));
app.use("/plugin", subApp);

// ****** DO NOT MODIFY THIS CODE BLOCK / RE-ORDER ******
app.all("*", apiWhiteListLogger());
if (envHelper.PORTAL_API_WHITELIST_CHECK == "true") {
  app.all("*", isAllowed());
}
// ****** DO NOT MODIFY THIS CODE BLOCK / RE-ORDER ******
app.use(
  "/resourcebundles/v1",
  bodyParser.urlencoded({ extended: false }),
  bodyParser.json({ limit: "50mb" }),
  require("./helpers/resourceBundles")(express)
); // Resource bundles apis


frameworkAPI
  .bootstrap(frameworkConfig, subApp)
  .then((data) => runApp())
  .catch((error) => runApp());

function endSession(request, response, next) {
  delete request.session["roles"];
  delete request.session["rootOrgId"];
  delete request.session["orgs"];
  if (request.session) {
    if (_.get(request, "session.userId")) {
      telemetryHelper.logSessionEnd(request);
    }
    delete request.session.sessionEvents;
    delete request.session["deviceId"];
  }
  next();
}

if (!process.env.sunbird_environment || !process.env.sunbird_instance) {
  logger.error({
    msg: `please set environment variable sunbird_environment,sunbird_instance
  start service Eg: sunbird_environment = dev, sunbird_instance = sunbird`,
  });
  process.exit(1);
}
async function runApp() {
  await loadTokenPublicKeys(path.join(__dirname, kidTokenPublicKeyBasePath));
  app.all("*", (req, res) => res.redirect("/")); // redirect to home if nothing found
  // start server after building the configuration data and fetch default channel id

  fetchDefaultChannelDetails((channelError, channelRes, channelData) => {
    portal.server = app.listen(envHelper.PORTAL_PORT, () => {
      envHelper.defaultChannelId = _.get(
        channelData,
        "result.response.content[0].hashTagId"
      ); // needs to be added in envVariable file
      logger.info({ msg: `app running on port ${envHelper.PORTAL_PORT}` });
      logger.info({
        msg: `✅ Portal global API Whitelist check is set to              - ${envHelper.PORTAL_API_WHITELIST_CHECK}`,
      });
      logger.info({
        msg: `✅ Portal global Session storage is set to                  - ${envHelper.PORTAL_SESSION_STORE_TYPE}`,
      });
      logger.info({
        msg: `✅ Portal global Kong anonymous device register is set to   - ${envHelper.KONG_DEVICE_REGISTER_ANONYMOUS_TOKEN}`,
      });
      logger.info({
        msg: `✅ Portal global Kong admin util is set to                  - ${envHelper.KONG_DEVICE_REGISTER_TOKEN}`,
      });
    });
    handleShutDowns();
    portal.server.keepAliveTimeout = 60000 * 5;
  });
}
const fetchDefaultChannelDetails = (callback) => {
  const options = {
    method: "POST",
    url: envHelper.LEARNER_URL + "org/v2/search",
    headers: {
      "x-msgid": uuid(),
      ts: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss:lo"),
      "content-type": "application/json",
      accept: "application/json",
      Authorization: "Bearer " + envHelper.PORTAL_API_AUTH_TOKEN,
    },
    body: {
      request: {
        filters: { slug: envHelper.DEFAULT_CHANNEL },
      },
    },
    json: true,
  };
  return request(options, callback);
};

telemetry.init({
  pdata: {
    id: envHelper.APPID,
    ver: packageObj.version,
    pid: "sunbird-portal-backend",
  },
  method: "POST",
  batchsize: process.env.sunbird_telemetry_sync_batch_size || 200,
  endpoint: telemetryEventConfig.endpoint,
  host: envHelper.TELEMETRY_SERVICE_LOCAL_URL,
  authtoken: "Bearer " + envHelper.PORTAL_API_AUTH_TOKEN,
});

process.on("unhandledRejection", (reason, p) =>
  console.log("Unhandled Rejection", p, reason)
);
process.on("uncaughtException", (err) => {
  // console.log("Uncaught Exception", err);
  process.exit(1);
});

function handleShutDowns() {
  const cleanup = (signal) =>
    new Promise(async (resolve, reject) => {
      // close db connections
      await frameworkAPI.closeCassandraConnections();
      logger.info({ msg: `Closed db connection after ${signal} signal.` });
      resolve();
    });

  gracefulShutdown(portal.server, {
    signals: "SIGINT SIGTERM",
    timeout: 60 * 1000, // forcefully shutdown if not closed gracefully after 1 min
    onShutdown: cleanup,
    finally: () => logger.info({ msg: "Server gracefully shut down." }),
    development: process.env.sunbird_environment === "local" ? true : false, // in dev mode skip graceful shutdown
  });
}

exports.close = () => portal.server.close();
