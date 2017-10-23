




function basicRequest(address, callback) {
  console.log(`Requesting ${address}`)
  requester({
    method: 'GET',
    uri: address,
  }, function(err, res, body) {
    console.log(res.statusCode, body);
    callback && callback()
  })
}


// Some of linksys's requests are to pages that are just a form.
// return all inputs and their value
function getFormPageValues(address, callback) {
  requester({uri: address},
    function(err, res, body) {
      var results = {};
      var $ = cheerio.load(body);
      $("input").each(function() {
        var name = $(this).attr('name');
        var val = $(this).val();
        var disabled = $(this).attr('disabled');
        if (!disabled) { //&& name.indexOf("mibError") === -1) {
          results[name] = val;
        }
      })
      console.log(results);
      callback(results);
    }
  )
}

function submitFormPageValues(address, formData, callback) {
  requester({
    method: 'POST',
    uri: `${address}/FileMgmt/dlData.htm`,
    form: formData,
    headers: {
      Referer: `${address}/FileMgmt/dlData.htm`
    }
  }, function(err, res, body) {
    console.log(res.statusCode, body);
    callback && callback()
  })
}

function getConfigUpdateRequest(address, callback) {
  basicRequest(`${address}/FileMgmt/httpConfigProcess.htm`, callback)
}

function getPortStatus(address, callback) {
  basicRequest(`${address}/wcd?{ports}`, callback)
}

function doAuthUser(address, callback) {
  basicRequest(`${address}/device/authenticate_user.xml`, callback) 
}

function getCopyFiles(address, callback) {
  basicRequest(`${address}/device/copyFiles.xml`, callback) 
}

function getFileUploadPage(address, callback) {
  basicRequest(`${address}/FileMgmt/maintenance_file_fileUpload_m.htm`, callback);
}

function doAllShittyRequests(baseAddress, callback) {

  var index = 0;
  function doNextDownload() {
    if (index >= allRequests.length) {
      callback && callback();
      return;
    }

    var ourUrl = allRequests[index++];
    requester({
      method: 'GET',
      uri: `${baseAddress}${ourUrl.url}`,
      headers: {
        "Referer": `${baseAddress}${ourUrl.referer}`
      }
    }, function(err, res, body) {
      if (err) {
        console.log(`Error reading ${ourUrl.url} - ${err}`);
      } else {
        console.log(`Got ${ourUrl.url} with result ${res.statusCode}`);
      }
      doNextDownload();
    })  
  }
  doNextDownload();
}



function doTftpConfigUpload(baseAddress, tftpServer, tftpFilename, callback) {
  requester({
    method: "POST",
    formData: {
      "restoreUrl":"",
      "errorCollector":"",
      "rlCopyFreeHistoryIndex":"",
      "rlCopyFreeHistoryIndex$scalar":5,
      "rlCopyInetIndex$Add":1,
      "rlCopyInetSourceIpAddress$Add": tftpServer,
      "rlCopyInetSourceFileName$Add": tftpFilename,
      "rlCopyInetSourceLocation$Add":3,
      "rlCopyInetDestinationFileType$Add":2,
      "rlCopyInetDestinationLocation$Add":1,
      "rlCopyInetDestinationUnitNumber$Add":1,
      "rlCopyInetHistoryIndex$Add":5,
      "rlCopyInetRowStatus$Add":4,
      "rlcopyTableVT$endAdd":"OK"
    },
    uri: `${baseAddress}/FileMgmt/tftpConfigProcess.htm` //?[rlcopyTableVT]Query:rlCopyInetIndex=1
  }, function(req, res, body) {
    console.log(`Did tftp upload request with status ${res.statusCode}`, body);
    callback && callback();
  })

}

// Trying with TFTP
// getAddressBaseName(host, function(baseAddressLocal) {
//  baseAddress = baseAddressLocal;
//  doLoginRequest(baseAddress, username, password, function(sessionId) {
//    fillJar(baseAddress, sessionId);
//    doTftpConfigUpload(baseAddress, "10.0.0.1", "lgs552-config.txt", function() {

//    })
//  }); 
// })


// This block of callback hell mimmicks _almost_ exactly the set of requests that
// happen when you load the magic page in the browser. Then, at the end we submit
// the config update.
// getAddressBaseName(host, function(baseAddressLocal) {
//  baseAddress = baseAddressLocal;
//  doLoginRequest(baseAddress, username, password, function(sessionId) {
//    fillJar(baseAddress, sessionId);
//    doAllShittyRequests(baseAddress, function() {
//      getFormPageValues(`${baseAddress}/FileMgmt/dlData.htm`, function(formData) {
//        submitFormPageValues(baseAddress, formData, function() {
//          getFormPageValues(`${baseAddress}/FileMgmt/dlData.htm?`, function(formData) {
//            doConfigUpdateRequest(baseAddress, sessionId, config, function() {
//            //  mvp();
//            })
//          })
//        })
//      });

//    });
//  }); 
// })


// This is the minimal MVP of requests that work after you click the magic page
// in the web browser.



// doLoginRequest(baseAddress, username, password, function(sessionId) {
//  fillJar(baseAddress, sessionId);
//  console.log(sessionId);

//  // getFormPageValues(`${baseAddress}/FileMgmt/dlData.htm`, function() {

//  // });
//  // return;

//  if (sessionId) {
//    setTimeout(function() {
//      //
//      doAuthUser(baseAddress, function() {
//        doAllShittyRequests(baseAddress, function() {
//        getFormPageValues(baseAddress, function(formData) {
//          submitFormPageValues(baseAddress, formData, function() {

//        //getFormPageValues(baseAddress, function(formData) {
//          dlDataResponse(function() {
//        //getPortStatus(baseAddress);
//        //getFileUploadPage(baseAddress, function() {
// //         getCopyFiles(baseAddress, function() {
//            //getConfigUpdateRequest(baseAddress, function() {
//              //setTimeout(function() {
//                jar.setCookie("sessionID=", baseAddress);
//                doLoginRequest(baseAddress, username, password, function(sessionId) {
//  fillJar(baseAddress, sessionId);
//                doConfigUpdateRequest(baseAddress, sessionId, config, function() {
//                });
//                  //getCopyFiles(baseAddress, function() {
//                                  //doConfigUpdateRequest(baseAddress, sessionId, config, function() {

//                //doConfigUpdateRequest(baseAddress, sessionId, config, function() {

//                        //getConfigUpdateRequest(baseAddress, function() {
//                        //});
//                  //});
//                });
                                
//                })
//                                //}); });
//              //}, 1000)
//            })
//          });
//      //  });
//      //    })
//        })
//        //});
//      })
//    }, 1000)
//  } else {
//    console.log("Couldn't get session ID");
//  }
// })






var allRequests = [

// All requests that are just from the upload page refresh
// {
//   "url": `/device/Timestamp_MIB.xml?[rlEventsMaskTableVT]Query:rlEventsMaskPollerId=5`,
//   "type": "GET",
//   "referer": `/home.htm`
// },
// {
//   "url": `/device/noStamp.xml`,
//   "type": "GET",
//   "referer": `/home.htm`
// },
// {
//   "url": `/device/authenticate_user.xml`,
//   "type": "GET",
//   "referer": `/home.htm`
// },
// {
//   "url": `/FileMgmt/maintenance_file_fileDownload_m.htm`,
//   "type": "GET",
//   "referer": `/home.htm`
// },
// {
//   "url": `/styling/styling.css`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/css/ProjectStyling.css`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/js/pageTokens.js`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/js/initFunctions.js`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/js/globalFunctions.js`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/styling/styling.js`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/js/winInWin_m.js`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/js/projectLocalization.js`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/js/IPFormatSelectionHost.js`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/device/blank.html`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/styling/images/red3angle_left.gif`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/FileMgmt/httpConfigProcess.htm`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/styling/images/empty.gif`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/HTTPmib.xml`,
//   "type": "GET",
//   "referer": `/home.htm`
// },
// {
//   "url": `/images/radio_button.png`,
//   "type": "GET",
//   "referer": `/css/ProjectStyling.css`
// },
// {
//   "url": `/images/radio_button_on.png`,
//   "type": "GET",
//   "referer": `/css/ProjectStyling.css`
// },
// {
//   "url": `/images/dropdownarrows.gif`,
//   "type": "GET",
//   "referer": `/styling/styling.css`
// },
// {
//   "url": `/FileMgmt/HTTPmib.xml`,
//   "type": "GET",
//   "referer": `/home.htm`
// },
// {
//   "url": `/styling/styling.css`,
//   "type": "GET",
//   "referer": `/FileMgmt/httpConfigProcess.htm`
// },
// {
//   "url": `/css/ProjectStyling.css`,
//   "type": "GET",
//   "referer": `/FileMgmt/httpConfigProcess.htm`
// },
// {
//   "url": `/styling/styling.js`,
//   "type": "GET",
//   "referer": `/FileMgmt/httpConfigProcess.htm`
// },
// {
//   "url": `/js/pageTokens.js`,
//   "type": "GET",
//   "referer": `/FileMgmt/httpConfigProcess.htm`
// },
// {
//   "url": `/js/projectLocalization.js`,
//   "type": "GET",
//   "referer": `/FileMgmt/httpConfigProcess.htm`
// }
// ,
// {
//   "url": `/FileMgmt/dlData.htm`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/FileMgmt/dlData.htm`,
//   "type": "POST",
//   "referer": `/FileMgmt/dlData.htm`
// },
// {
//   "url": `/FileMgmt/dlData.htm`,
//   "type": "GET",
//   "referer": `/FileMgmt/dlData.htm`
// }




/// ALl requests starting from a blank browser session, right through to page load
{
  "url": "/home.htm",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "../",
  "type": "GET",
  "referer": null
},
{
  "url": "/",
  "type": "GET",
  "referer": null
},
{
  "url": "/config/log_off_page.htm",
  "type": "GET",
  "referer": null
},
{
  "url": "/wba_srvr/js/login.js",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/js/mainlogin.js",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/wba_srvr/js/mainPage.js",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/js/fixes.js",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/styling/styling.css",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/config/device/wcd?{DictionariesList}",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/device/English/dictionaryLogin.xml",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "//styling/images/empty.gif",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/images/linksys_logo.png",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/styling/images/Status_information_icon.gif",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "http://10.0.0.220/favicon.ico",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/images/login_errorarow.png",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/images/linksysImages/topLeft.gif",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/favicon.ico",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/images/linksysImages/topRight.gif",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/images/linksysImages/bottomLeft.gif",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/config/log_off_page.htm",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/images/linksysImages/bottomRight.gif",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/images/linksysImages/bar.gif",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/config/device/wcd?{EncryptionSetting}",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/config/System.xml?action=login&cred=296c21fe260e58618b780a22eaae4adbc6f79a5eb0e10eb84052b068a7901a774271c1ad760d52d54e254a52a2cc0869bf8d4472f726e0832d28595151dae2184f156b5af553e2a514776839709a7302894d739c9c8d1e32ef3c1939241cb53e0bdfa12d7dace1f8d924f7d266a55b65fa1313a14b905494f272e99eb3972f52",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/images/ProgressBar_determinate.gif",
  "type": "GET",
  "referer": "/config/log_off_page.htm"
},
{
  "url": "/css/linksysHomePageStyle.css",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/wba_srvr/js/login.js",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/wba_srvr/js/mainPage.js",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/js/mainlogin.js",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/js/home.js",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/linksys_logo.png",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "http://10.0.0.220/images/icon_help.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "http://10.0.0.220/images/icon_logout.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/linksysImages/space.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/device/wcd?{DictionariesList}",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/English/Dictionary1.xml",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/icon_help.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/device/blank.html",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/GW/home_gw.html",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "http://10.0.0.220//styling/images/empty.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/ProgressBar_determinate.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/icon_logout.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/styling.css",
  "type": "GET",
  "referer": "/GW/home_gw.html"
},
{
  "url": "/css/ProjectStyling.css",
  "type": "GET",
  "referer": "/GW/home_gw.html"
},
{
  "url": "/js/gw.js",
  "type": "GET",
  "referer": "/GW/home_gw.html"
},
{
  "url": "/styling/images/empty.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/Polling/Client_ID_MIB.xml",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/config/Language_MIB.xml?Query:rlFileName=666c6173683a2f2f6261636b75706c6f",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/config/TimeSettings_MIB.xml",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/navarrow_wht_collapsed.png",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/navarrow_collapsed.png",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/linksysImages/corner.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/linksysImages/menu_corner.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/wcd?{general}",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/wcd?{units}{fullInterfaceList}",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/wcd?{ports}",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/Polling/Subscription_MIB.xml?Filter:rlEventsPoller=2",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "http://10.0.0.220/favicon.ico",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/Polling/Subscription_MIB.xml?Filter:rlEventsPoller=2",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/Polling/Subscription_MIB.xml?Filter:rlEventsPoller=2",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/GW/SiteMap.xml",
  "type": "GET",
  "referer": "/GW/home_gw.html"
},
{
  "url": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/GW/wcd?{file=/GW/blank.xml}",
  "type": "GET",
  "referer": "/GW/home_gw.html"
},
// {
//   "url": "/Polling/Subscription_MIB.xml",
//   "type": "POST",
//   "referer": "/home.htm"
// },
{
  "url": "/favicon.ico",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/Polling/Subscription_MIB.xml?[rlEventsTableVT]Query:rlEventId=1.3.6.1.2.1.47.2.0.1@rlEventsPoller=2^Filter:rlEventsPoller=2",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/css/main.css",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/wba_srvr/js/mainPage.js",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/js/globalFunctions.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/js/winInWin_m.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/styling/styling.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/sysinfo/system_general_description_m.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/js/mainlogin.js",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/Polling/Interval_MIB.xml?Query:rlEventsPollingControlPollerId=2",
  "type": "GET",
  "referer": "/home.htm"
},
// {
//   "url": "/Polling/Interval_MIB.xml",
//   "type": "POST",
//   "referer": "/home.htm"
// },
{
  "url": "/Polling/Interval_MIB.xml?Query:rlEventsPollingControlPollerId=2",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/zoomViews_Linksys/LGS552.png",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/zoomViews_Linksys/port_small_upper_on.gif",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/zoomViews_Linksys/port_small_downer_off.gif",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/zoomViews_Linksys/port_small_upper_off.gif",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/zoomViews_Linksys/port_small_extra_upper_off.gif",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/zoomViews_Linksys/port_small_extra_downer_off.gif",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/zoomViews_Linksys/port_small_fiber_upper_off.gif",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/zoomViews_Linksys/port_small_fiber_downer_off.gif",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/zoomViews_Linksys/port_xgiga_upper_off.gif",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/zoomViews_Linksys/port_xgiga_downer_off.gif",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/zoomViews_Linksys/led_small_on.gif",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/images/GutterComp.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/device/noStamp.xml",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/device/authenticate_user.xml",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/navarrow_expanded.png",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/images/button.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/Polling/Subscription_MIB.xml?Filter:rlEventsPoller=2",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/images/empty.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/images/red3angle_down.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/images/red3angle_left.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/images/selected_tbl_bg.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/images/Status_criticalerror_icon.png",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/images/Status_information_icon.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/images/Status_success_icon.png",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/images/Status_warning_icon.png",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/navarrow_wht_expanded.png",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/ProgressBar_indeterminate.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/device/blank.html",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/sysinfo/system_general_reset_m.htm",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/styling.css",
  "type": "GET",
  "referer": "/sysinfo/system_general_reset_m.htm"
},
{
  "url": "/css/ProjectStyling.css",
  "type": "GET",
  "referer": "/sysinfo/system_general_reset_m.htm"
},
{
  "url": "/js/globalFunctions.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/styling/styling.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/js/winInWin_m.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/js/pageTokens.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_reset_m.htm"
},
{
  "url": "/js/projectLocalization.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_reset_m.htm"
},
{
  "url": "/styling/images/empty.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/checkbox_button.png",
  "type": "GET",
  "referer": "/css/ProjectStyling.css"
},
{
  "url": "/images/radio_button_on.png",
  "type": "GET",
  "referer": "/css/ProjectStyling.css"
},
{
  "url": "/images/radio_button.png",
  "type": "GET",
  "referer": "/css/ProjectStyling.css"
},
{
  "url": "/FileMgmt/maintenance_file_fileDownload_m.htm",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/styling.css",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "/css/ProjectStyling.css",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "/js/pageTokens.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_reset_m.htm"
},
{
  "url": "/js/initFunctions.js",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "/js/globalFunctions.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/styling/styling.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/js/winInWin_m.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/js/projectLocalization.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_reset_m.htm"
},
{
  "url": "/js/IPFormatSelectionHost.js",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "/device/blank.html",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "/images/radio_button_on.png",
  "type": "GET",
  "referer": "/css/ProjectStyling.css"
},
{
  "url": "/images/radio_button.png",
  "type": "GET",
  "referer": "/css/ProjectStyling.css"
},
{
  "url": "/styling/images/red3angle_left.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/images/dropdownarrows.gif",
  "type": "GET",
  "referer": "/styling/styling.css"
},
{
  "url": "/FileMgmt/httpConfigProcess.htm",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "/styling/images/empty.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/../FileMgmt/HTTPmib.xml",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/styling.css",
  "type": "GET",
  "referer": "/FileMgmt/httpConfigProcess.htm"
},
{
  "url": "/css/ProjectStyling.css",
  "type": "GET",
  "referer": "/FileMgmt/httpConfigProcess.htm"
},
{
  "url": "/styling/styling.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/js/pageTokens.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_reset_m.htm"
},
{
  "url": "/js/projectLocalization.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_reset_m.htm"
},
{
  "url": "/FileMgmt/HTTPmib.xml",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/FileMgmt/dlData.htm",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "/FileMgmt/maintenance_file_copyFiles_m.htm",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/styling/styling.css",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_copyFiles_m.htm"
},
{
  "url": "/css/ProjectStyling.css",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_copyFiles_m.htm"
},
{
  "url": "/js/initFunctions.js",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "/js/localFunctions.js",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_copyFiles_m.htm"
},
{
  "url": "/js/copyFiles.js",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_copyFiles_m.htm"
},
{
  "url": "/js/globalFunctions.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/styling/styling.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/js/winInWin_m.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_description_m.htm?[petVT]Filter:(ifOperStatus!=6)&&(rlPethPsePortSupportPoe%20!=%202)"
},
{
  "url": "/js/pageTokens.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_reset_m.htm"
},
{
  "url": "/js/projectLocalization.js",
  "type": "GET",
  "referer": "/sysinfo/system_general_reset_m.htm"
},
{
  "url": "/styling/images/empty.gif",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/device/blank.html",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_copyFiles_m.htm"
},
{
  "url": "/images/radio_button_on.png",
  "type": "GET",
  "referer": "/css/ProjectStyling.css"
},
{
  "url": "/images/radio_button.png",
  "type": "GET",
  "referer": "/css/ProjectStyling.css"
},
{
  "url": "/FileMgmt/dlData.htm",
  "type": "GET",
  "referer": "/FileMgmt/maintenance_file_copyFiles_m.htm"
},
{
  "url": "/device/Timestamp_MIB.xml?[rlEventsMaskTableVT]Query:rlEventsMaskPollerId=2",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/wcd?{units}{fullInterfaceList}",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/wcd?{ports}",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/device/noStamp.xml",
  "type": "GET",
  "referer": "/home.htm"
},
{
  "url": "/device/authenticate_user.xml",
  "type": "GET",
  "referer": "/home.htm"
}

]