//import axios from 'axios';
//const axios = require("axios");
async function register({ registerHook, peertubeHelpers, registerVideoField, registerClientRoute }) {
  const axios = require("axios");
  const { notifier } = peertubeHelpers
  const basePath = await peertubeHelpers.getBaseRouterRoute();

  let chatEnabled, keysendEnabled, lnurlEnabled, legacyEnabled, debugEnabled, rssEnabled;
  let userName = "PeerTuber";
  let accountName, channelName, videoName, instanceName, accountAddress, softwareVersion, client_id, channelId,videoUuid;
  let streamEnabled = false;
  let panelHack;
  let podData;
  let hostPath;
  let licenceApi=`/api/v1/videos/licences`
  let licences = [];
  // PeerTube returns the licences as one object. Convert to array of objects.
  try {
    let licenceReply = await axios.get(licenceApi);
    if (licenceReply && licenceReply.data){
      let licencesBlock=licenceReply.data
      for (var [key,value]  of Object.entries(licencesBlock)){
        let licence ={}
        licence.name = value;
        licence.key = key;
        licences.push(licence);
      }
    }
  } catch (err){
    console.log("🚧 hard error getting available licences", licenceApi,err)
  }

  registerHook({
    target: 'action:video-watch.player.loaded',
    handler: async ({ player, video }) => {
      if (debugEnabled){
        console.log(`🚧🚧 video`,video);
      }
      let videoEl;
      if (player.el()) {
        videoEl = player.el().getElementsByTagName('video')[0]
        if (debugEnabled){
          console.log(`🚧🚧videoEl`,videoEl);
        }
      } else {
        //weird error condition avoidance
        videoEl - { time: 0 };
      }
      if (location.instance != video.originInstanceHost) {
        instanceName = video.originInstanceHost;
      }
      console.log("🚧🚧looking for permanent live info",video.isLive);
      //for compatibility with AGates modificuation of uuid for lives in podping
      if (video.isLive){
        videoUuid = video.uuid+'_'+video.publishedAt.toISOString();
      } else {
        videoUuid = video.uuid;
      }
      channelId=video.channel.id;
      accountName = video.byAccount;
      channelName = video.byVideoChannel;
      videoName = video.uuid;
      let episodeName = video.name;
      let itemID;
      let episodeGuid = videoUuid;
      let displayName = video.channel.displayName;
      let addSpot = document.getElementById('plugin-placeholder-player-next');
      let addSpot4 = document.getElementsByClassName('root-header-right')[0];
      //console.log("🚧addspit section",addSpot4)
      const elem = document.createElement('div');

      var v4vButtonHTML;
      if (chatEnabled) {
        v4vButtonHTML = v4vButtonHTML + ` <button _ngcontent-vww-c178="" id = "bigchat" type="button" class="peertube-button orange-button ng-star-inserted" hidden="true">` + "▼" + `</button>`
        v4vButtonHTML = v4vButtonHTML + ` <button _ngcontent-vww-c178="" id = "smallchat" type="button" class="peertube-button orange-button ng-star-inserted" hidden="true">` + "▲" + `</button>`
        v4vButtonHTML = v4vButtonHTML + ` <button _ngcontent-vww-c178="" id = "closechat" type="button" class="peertube-button orange-button ng-star-inserted" title="open chat panel">` + "Chat" + `</button>`
      }
      if (v4vButtonHTML) {
        //  console.log("🚧--------------button hmtl",v4vButtonHTML)
        elem.innerHTML = v4vButtonHTML;
        addSpot.appendChild(elem);
      }
      if (chatEnabled) {
        let newContainer = document.createElement('div');
        newContainer.setAttribute('id', 'peertube-plugin-irc-container')
        newContainer.setAttribute('hidden', 'true');
        addSpot.append(newContainer)
        //addSpot.append()

        var container = document.getElementById('peertube-plugin-irc-container')

        if (!container) {
          logger.error('Cant found the irc chat container.')
        }
        let chatRoom = await getChatRoom(channelName);
        if (debugEnabled) {
          console.log("🚧found chat room", chatRoom);
        }
        if (!chatRoom) {
          let shortInstance = instanceName.split(".")[0];
          shortInstance = shortInstance.split(" ")[0];
          let shortChannel = channelName.split("@")[0];
          chatRoom = "irc://irc.rizon.net/" + shortInstance + "-" + shortChannel;
          await setChatRoom(channelName, chatRoom);
        }
        let chatLink = "https://kiwiirc.com/nextclient/#" + chatRoom + '?nick=' + userName + '&autoconnect=true&startupscreen=welcome';
        //let chatLink = "https://kiwiirc.com/nextclient/#" + chatRoom + '?nick=' + userName;
        if (userName === 'PeerTuber') {
          chatLink = chatLink + "???";
        }
        container.setAttribute("style", "display:flex");
        container.setAttribute('style', 'height:100%;width:100%;resize:both;display:flex;flex-direction:column;overflow:auto')
        const iframe = document.createElement('iframe')
        iframe.setAttribute('src', chatLink);
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
        iframe.setAttribute('frameborder', '0')
        iframe.setAttribute('id', "peertube-plugin-irc-iframe");
        container.append(iframe)
        let docIframe = document.getElementById('peertube-plugin-irc-iframe');
        docIframe.setAttribute('style', 'height:100%')
        docIframe.style.height = "100%";
        docIframe.style.width = "100%";
        docIframe.style.display = "flex";
        docIframe.style.flexDirection = "column";
        docIframe.style.resize = "both";
        docIframe.style.overflow = "auto";
        docIframe.contentWindow.kiwiconfig = () => { console.log("🚧███kiwi config called ") }
        let idoc = docIframe.contentWindow.document;
        let ibody = idoc.getElementsByTagName('body');
        let configScript = document.createElement(`div`);
        configScript.innerHTML = `<script name="kiwiconfig">{"startupScreen": "welcome", "startupOptions": { "server": "irc.freenode.net", "port": 6697, "tls": true, "direct": false, "nick": "specialk" "autoConnect": true }}</script>`;
        //console.log("🚧before",ibody,configScript);
        ibody[0].appendChild(configScript)
        //console.log("🚧after",ibody,configScript);
      }

      const bigChat = document.getElementById("bigchat");
      if (bigChat) {
        bigChat.title = "increase chat window height";
        bigChat.onclick = async function () {
          container.style.height = container.offsetHeight + 512 + 'px';
        }
      }
      const smallChat = document.getElementById("smallchat");
      if (smallChat) {
        smallChat.title = "Decrease chat window height";
        smallChat.onclick = async function () {
          container.style.height = container.offsetHeight - 512 + 'px';
        }
      }
      const closeChat = document.getElementById("closechat");
      let videoDisplay = document.getElementById("videojs-wrapper");
      let fullVideo = document.getElementById("video-wrapper");
      var oldVideo, oldChat
      if (closeChat) {

        closeChat.onclick = async function () {
          if (debugEnabled) {
            console.log("🚧clicked", closeChat.innerHTML, videoDisplay.hidden, container.hidden);
            console.log("🚧width", container.clientWidth, videoDisplay.clientWidth, fullVideo.clientWidth);
            console.log("🚧height", container.clientheight, videoDisplay.clientHeight);
          }
          if (closeChat.innerHTML === "Full Chat") {
            closeChat.title = "Close chat window";
            container.hidden = false;
            oldVideo = videoDisplay.clientWidth;
            videoDisplay.hidden = true;
            closeChat.innerHTML = "X";
            container.style.flexGrow = "1";
            container.style.flex = "wrap";
            //container.style.width = "2000px";
            //container.width = "2000px"
            //container.width = fullVideo.clientWidth;
            bigChat.hidden = false;
            smallChat.hidden = false;
          }
          else if (closeChat.innerHTML === "Chat") {
            closeChat.title = "make chat full screen"
            container.hidden = false;
            videoDisplay.hidden = false;
            closeChat.innerHTML = "Full Chat";
            bigChat.hidden = false;
            smallChat.hidden = false;
            if (container.clientHeight < 640) {
              container.style.height = "640px";
            }
          }
          else if (closeChat.innerHTML === "X") {
            container.hidden = true;
            videoDisplay.hidden = false;
            closeChat.innerHTML = "Chat";

            bigChat.hidden = true;
            smallChat.hidden = true;
            closeChat.title = "open chat panel";
          }
          if (debugEnabled) {
            console.log("🚧after click", closeChat.innerHTML, videoDisplay.hidden, container.hidden);
            console.log(container, videoDisplay);
          }
        }
      }
    }
  })
  registerHook({
    target: 'action:video-channel-videos.video-channel.loaded',
    handler: async (result, params) => {
      if (debugEnabled) {
        console.log("🚧 chanel loaded result ", result,"params:", params)
      }
      let buttonSpot= document.getElementsByClassName("channel-buttons");
      let buttonHtml = document.createElement("div");
      return result;
    }
  })
  registerHook({
    target: 'action:video-edit.init',
    handler: async ({ type, updateForm }) => {
      let podData
      let itemTxt = document.getElementById("itemtxt");
      //console.log('🚧type and update form!', type,updateForm,itemTxt);
    }
  })
  registerHook({
    target: 'action:video-edit.form.updated',
    handler: async ({ type, updateForm }) => {
      let chapterUrl = document.getElementById('chapters')
      let videoUuid = (window.location.href).split("/").pop();
      //console.log('🚧 possible chapter file',chapterUrl.value);
      if (chapterUrl && chapterUrl.value && chapterUrl.value !=""){
        let chaptersData,chaptersApi,tempChapters
        let returnChapters = [];
        try {
          chaptersData = await axios.get(chapterUrl.value);
          chaptersApi = `/api/v1/videos/${videoUuid}/chapters`
          if (chaptersData && chaptersData.data && chaptersData.data.chapters && Array.isArray(chaptersData.data.chapters) && chaptersData.data.chapters.length>1){
            //console.log('🚧 creating temp chapters');
            tempChapters = chaptersData.data.chapters
            for (var chap of tempChapters){
              let newChapter ={
                timecode : chap.startTime,
                title : chap.title
              }
              returnChapters.push(newChapter);
            }
            //console.log('🚧 made ',returnChapters);
            let bearer = await peertubeHelpers.getAuthHeader();
            let result = await axios.put(chaptersApi, {chapters: returnChapters},{ headers: bearer });           
            /*const requestOptions = {
              method: 'PUT',
              headers: bearer,
              body: JSON.stringify({chapters: returnChapters})
            }
            const result = await fetch(chapterApi, requestOptions);
            const data = await response.json();
            */
            
            //console.log('🚧 returned ',result);
          } else {
            console.log('🚧 bad chapter data',chaptersData);
          }
        } catch (err){
          console.log("🚧🚧🚧🚧🚧🚧 update chapters failure", chaptersApi,tempChapters,err);
        }
        
      }
    }
  })
  registerHook({
    target: 'action:router.navigation-end',
    handler: async ({ params, user }) => {
      let podcastButtonInsertPoint = document.getElementsByClassName("video-channels-header");
      console.log('🚧navigation end', podcastButtonInsertPoint);
      if (podcastButtonInsertPoint.length>0){
        //console.log('🚧 found it!', podcastButtonInsertPoint.length);
        var newStuff = document.createElement("a");
        newStuff.innerHTML=`<a  class="peertube-create-button" href="/p/podcast2/import"><my-global-icon _ngcontent-ng-c287775211="" iconname="add" aria-hidden="true" _nghost-ng-c1540792725=""><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></my-global-icon>Import Podcast<!----></a>`+
        `<br><a  class="peertube-create-button" href="/p/podcast2/importarc"><my-global-icon _ngcontent-ng-c287775211="" iconname="add" aria-hidden="true" _nghost-ng-c1540792725=""><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></my-global-icon>Import internet archive collection<!----></a>`+
        `<br><a  class="peertube-create-button" href="/p/podcast2/transcriptsync"><my-global-icon _ngcontent-ng-c287775211="" iconname="add" aria-hidden="true" _nghost-ng-c1540792725=""><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></my-global-icon>get youtube tanscripts<!----></a>`+
       
        podcastButtonInsertPoint[0].appendChild(newStuff);
      }
    }
  })
  registerHook({
    target: 'action:video-channel-update.video-channel.loaded',
    handler: async (params) => {
      if (debugEnabled) {
        console.log("🚧channel update loaded", params);
      }
      
      videoName = undefined;
      let channelUpdate = document.getElementsByClassName("form-group");
      let channel = (window.location.href).split("/").pop();
      channelName = channel;
      if (debugEnabled) {
        console.log("🚧channel info located", channel,channelName);
      }
      //let walletInfo = await getWalletInfo(null, null, channel);
      let feedID = await getFeedID(channel);
      let feedGuid = await getChannelGuid(channel);
      let feedTxt = [""];
      let podData = await getPodData(channel);
      let email;
      let category;
      let image;

      if (debugEnabled) {
        console.log("🚧pod data", feedID,feedGuid,feedTxt, podData);
      }
      if (!podData) {
        podData = {
          "licence": { key: 2, name: "attribution - shared"},
          "feedid": feedID,
          "feedguid": feedGuid,
          "medium": "podcast",
          "channel": channel,
          "category": "news",
          "image": "https://freediverse.com/lazy-static/avatars/a9e4fd2c-1895-49fb-9824-3886e89dc948.jpg"
        } 
        podData.text = feedTxt;
      }
      if (podData && podData.email){
        email = podData.email;
      } else {
        email="";
      }
      if (!podData.text) {
        podData.text = feedTxt;
      }
      if (!podData.category) {
        category = "news";
        podData.category=category;
      } else {
        category=podData.category;
      }
      if (!podData.image) {
        image = "https://freediverse.com/lazy-static/avatars/a9e4fd2c-1895-49fb-9824-3886e89dc948.jpg";
        podData.image = image; 
      } else {
        image = podData.image
      }
      let newPodData = podData

      let panel = await getConfigPanel(channel);
      panelHack = panel;
      channelUpdate[0].appendChild(panel);
      let id = document.getElementById("id");
      if (id) {
        id.value = feedID;
        let updateButton = document.getElementById("update-feed");
        if (updateButton) {
          updateButton.onclick = async function () {
            if (id.value){
              setFeedID(channel, id.value);
              updateButton.innerText = "Saved!";
            }
          }
        }
      }
      let chatRoom = document.getElementById("chatroom");
      let chatButton = document.getElementById("update-chat");
      if (chatButton) {
        chatButton.onclick = async function () {
          setChatRoom(channel, chatRoom.value);
          chatButton.innerText = "Saved!";
        }
      }
      let rssCloneButton = document.getElementById("rss-clone");
      if (rssCloneButton){
        rssCloneButton.onclick = async function (){
          //let cloneChannel="https://peertube.gruntwerk.org/feeds/podcast/videos.xml?videoChannelId=14819"
          //let url = "https://" + window.location.hostname + "/plugins/podcast2/router/dirtyhack?clone=" + cloneChannel;
          let url = "https://" + window.location.hostname + "/plugins/podcast2/router/dirtyhack?avater=" + cloneChannel;
          let bearer = await peertubeHelpers.getAuthHeader() 
          //console.log("trying to hack", bearer, url,cloneChannel);
          try {
            await axios.put(url,{ bear: bearer},{ headers: bearer });
          } catch (err){
            console.log("error sending request",err,url,cloneChannel);
          }

        }
      }
      //console.log("🚧checking for rss settings button");
      let rssSettingsButton = document.getElementById("rss-settings");
      let changeMonitor;
      if (rssSettingsButton) {
        rssSettingsButton.onclick = async function () {
          //console.log("🚧rss settings button clicked");
          //let podData= {medium:podcast}
          let redirectEnabled,redirectUrl;
          if (podData.redirectUrl){
            redirectUrl = podData.redirectUrl;  
          } else {
            redirectUrl ="";
          }
          let html = `Audio podcast Feed: ${window.location.protocol}//${window.location.hostname}/plugins/podcast2/router/podcast2?channel=${channel}<br>`;
          html = html + `<br><button id="rss-link" class="peertube-button orange-button ng-star-inserted">RSS Feed</button>`;
          if (!feedID) {
            html = html + `<a href="https://podcastindex.org/add?feed=` + encodeURIComponent("https://" + window.location.hostname + "/plugins/podcast2/router/podcast2?channel=" + channel) + `"<button id="button-register-feed" class="peertube-button orange-button ng-star-inserted" title = "For full Boostagram functionality on sites like saturn.fly.dev and conshax.app you will need to register your channel">register with Podcast Index</button></a>`
          } else {
            html = html +"Podcast Index Feed ID: " + feedID;
            //html = html + `<br><button type="button" id="register-feed" name="register-feed" class="peertube-button orange-button ng-star-inserted">Register Feed to Podcast Index</button>`
          }
          html = html + `<h3>Settings for legacy index compatibility</h3>`;
          html = html + `<br>Podcast E-mail Address: `;
          html = html + `<input type="text" id="email" width="40" value="${email}">`
          html = html + `<br>itunes category: `;
          html = html + `<input type="text" id="category" width="40" value="${category}">`
          html = html + `<br>itunes large image path: `;
          html = html + `<input type="text" id="image" width="80" value="${image}">`
          html = html + `<br><hr><h3>Podcasting 2.0 settings</h3>`;
          html = html + `<br>Channel GUID: `;
          html = html + `<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="channel-guid" width="40" value="` + feedGuid + `">`
          // html = html + `<button id="update-guid" class="peertube-button orange-button ng-star-inserted">Save</button>`
          html = html + `<br>Podcast Medium <select id="feed-medium"><option value="podcast">podcast </option><option value="music">music </option><option value="film">film </option><option value="video">video </option><option value="audiobook">audiobook </option></select>`
          if (licences){
              html = html + `<br>Podcast licence <select id="feed-licence">`
              for (var licence of licences){
                let line = `<option value="${licence.key}">${licence.name}</option>`
                //console.log("🚧 lines:", line)
                html=html+line;
              }
          }
            //console.log("🚧 hard error getting licences", licenceApi,err)
          console.log("🚧 licences", licences,licenceApi)
          html = html + `</select>`
          for (var i = 0; i < podData.text.length; i++) {
            html = html + `<br>Podcast txt value ` + i + `: `;
            html = html + `<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="feed-txt-` + i + `" width="40" value="` + podData.text[i] + `">`
          }
          
          html = html +'<br><hr>Danger - only use when moving podcast to new hosting provider. Creates 301 redirect to replacement feed';
          html = html + `<br><input type="checkbox" id="redirect-enabled" name="redirect-enabled"> migrate podcast to `;
          html = html + `<input STYLE="color: #000000; background-color: #ffffff;"type="text" id="redirect-url" value="${redirectUrl}"><br>`

          let rssEditSettings = await peertubeHelpers.showModal({
            title: 'RSS settings ' + channel,
            content: "",
            close: true,
            confirm: {
              value: 'save', action: async () => {
                clearInterval(changeMonitor);
                if (debugEnabled){
                   console.log("🚧 saving pod data", newPodData,);
                }
                try {
                  await axios.post(basePath + "/setpoddata", newPodData, { headers: await peertubeHelpers.getAuthHeader() });
                } catch (err) {
                  console.log("🚧 hard error attempting to update pod data", newPodData,err)
                }
              }
            },

          });
          let rssLinkButton;
          let modal = (document.getElementsByClassName('modal-body'))
          if (modal) {
            modal[0].setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
            modal[0].innerHTML = html;
            rssLinkButton = await document.getElementById('rss-link');
            switch (podData.medium) {
              case "podcast":   document.getElementById("feed-medium").selectedIndex = 0; break;
              case "music":     document.getElementById("feed-medium").selectedIndex = 1; break;
              case "film":      document.getElementById("feed-medium").selectedIndex = 2; break;
              case "video":     document.getElementById("feed-medium").selectedIndex = 3; break;
              case "audiobook": document.getElementById("feed-medium").selectedIndex = 4; break;
              default: console.log("🚧unable to find a match for podData.medium");
            }
            document.getElementById("redirect-enabled").checked = podData.redirectEnabled;
            let licence = document.getElementById("feed-licence");
            if (podData && podData.licence){
              licence.selectedIndex=podData.licence.key-1
            }if (debugEnabled){
               console.log("🚧 licence option",podData.licence,licence);
            }

          }

          


          changeMonitor = setInterval(async function () {
            try {
              newPodData.feedguid = document.getElementById("channel-guid").value;
              newPodData.medium = document.getElementById("feed-medium").value;
              let licence = {};
              licence.key = document.getElementById("feed-licence").value;
              licence.name = licences[licence.key-1].name;
              //console.log("🚧 license setting",licence);
              newPodData.licence = licence;
              newPodData.image = document.getElementById("image").value;
              image = newPodData.image;
              newPodData.category = document.getElementById("category").value;
              category = newPodData.category;
              let inputEmail = document.getElementById("email").value;
              if (inputEmail && inputEmail.indexOf("@")>0){
                newPodData.email=inputEmail;
                email = inputEmail;
              }
              if (inputEmail && inputEmail==""){
                newPodData.email=undefined;
                email = inputEmail;
              }
              newPodData.redirectEnabled = document.getElementById("redirect-enabled").checked;
              //let wtf = document.getElementById("redirect-enabled");
              //newPodData.redirectEnabled = wtf.checked;
              newPodData.redirectUrl =     document.getElementById("redirect-url").value;
              for (var i = 0; i < feedTxt.length; i++) {
                podData.text[i] = document.getElementById("feed-txt-" + i).value;
              }
            } catch {
              //clearInterval(changeMonitor);
            }
          }, 500);
          if (rssLinkButton) {
            rssLinkButton.onclick = async function () {
              let rssFeedUrl = window.location.protocol + "//" + window.location.hostname + "/plugins/podcast2/router/podcast2?channel=" + channel
              if (debugEnabled) {
                console.log("🚧rss link", rssFeedUrl);
              }
              window.open(rssFeedUrl);
          }
          let registerFeedButton = document.getElementById('register-feed');
          if (registerFeedButton) {
            registerFeedButton.onclick = async function () {
              let registerFeedUrl = "https://podcastindex.org/add?feed=" + feedID;
              window.open(registerFeedUrl);
            }
          }
          }
        }
      }
    }
  })
  registerClientRoute({
    route: 'podcast2/import',
    onMount: async ({ rootEl }) => {
      rootEl.innerHTML = `<div id="podcast2-import"><center><h1>Import Podcast</h1></center>
      Podcast RSS Url:<input class="form-control d-block ng-pristine ng-valid ng-touched" type="text" id="podcast2-import-url">
      <button id = "podcast2-import-button" class="peertube-button orange-button ng-star-inserted">Import</button>
      `
      let importButton = document.getElementById("podcast2-import-button");
      let importUrl = document.getElementById("podcast2-import-url");
      if (importButton){
        importButton.onclick  = async function () {
         
          let cloneChannel;
          if (importUrl){
            console.log("importing channel",importUrl.value);
            cloneChannel = importUrl.value;
            if (cloneChannel && cloneChannel.length>1){
              cloneChannel = cloneChannel;
              if (!cloneChannel.includes("http")){
                cloneChannel="https://"+cloneChannel;
              }
              let url = "https://" + window.location.hostname + "/plugins/podcast2/router/importchannel?clone=" + cloneChannel;
              let bearer = await peertubeHelpers.getAuthHeader() 
              console.log("trying to import", bearer, url,cloneChannel);
              let returnMessage;
              try {
                returnMessage = await axios.put(url,{ bear: bearer},{ headers: bearer });
              } catch (err){
                console.log("error sending request",err,url,cloneChannel,err.message,err.data.message);
                notifier.error("failed trying to import ");
              }
              console.log("importing returned message",returnMessage);
              if (returnMessage){
                window.location.replace(returnMessage.data);
              }
              // notifier.success(returnMessage)
            }
          } else {
            console.log("no import url");
          }
        }
      } else {
        console.log("no import button");
      }
    }
  })
  registerClientRoute({
    route: 'podcast2/importarc',
    onMount: async ({ rootEl }) => {
      rootEl.innerHTML = `<div id="podcast2-importarc"><center><h1>Import internet archive</h1></center>
      Internet Archive ID:<input class="form-control d-block ng-pristine ng-valid ng-touched" type="text" id="podcast2-importarc-url">
      <button id = "podcast2-importarc-button" class="peertube-button orange-button ng-star-inserted">Import</button>
      `
      let importarcButton = document.getElementById("podcast2-importarc-button");
      let importarcUrl = document.getElementById("podcast2-importarc-url");
      if (importarcButton){
        importarcButton.onclick  = async function () {
         
          let cloneChannel,cloneChannelParts;
          if (importarcUrl){
            console.log("importing channel",importarcUrl.value);
            cloneChannel = importarcUrl.value;
            if (cloneChannel && cloneChannel.length>1){
              cloneChannelParts = cloneChannel.split("/");
              if (cloneChannelParts.length > 1){
                cloneChannel = cloneChannelParts[cloneChannelParts.length-1];
              }
              let url = "https://" + window.location.hostname + "/plugins/podcast2/router/importarc?id=" + cloneChannel;
              let bearer = await peertubeHelpers.getAuthHeader() 
              console.log("trying to import", bearer, url,cloneChannel);
              let returnMessage;
              try {
                returnMessage = await axios.put(url,{ bear: bearer},{ headers: bearer });
              } catch (err){
                console.log("error sending request",err,url,cloneChannel,err.message,err.data.message);
                notifier.error("failed trying to import ");
              }
              console.log("importing returned message",returnMessage);
              if (returnMessage){
                window.location.replace(returnMessage.data);
              }
              // notifier.success(returnMessage)
            }
          } else {
            console.log("no import url");
          }
        }
      } else {
        console.log("no import button");
      }
    }
  })
  registerClientRoute({
    route: 'podcast2/transcriptsync',
    onMount: async ({ rootEl }) => {
      rootEl.innerHTML = `<div id="podcast2-transcript-sync"><center><h1>get transcripts for imported videos</h1></center>
      <button id = "podcast2-transcript-sync-button" class="peertube-button orange-button ng-star-inserted">Import</button>
      `
      let importTranscriptButton = document.getElementById("podcast2-transcript-sync-button");
      if (importTranscriptButton){
        importTranscriptButton.onclick  = async function () {
          let videoSkip = 0;
          let videoblock = 20;
          let synched =0;
          let synchlimit = 10;
          let returnedVideos;
          let getVideosApi = `${basePath}/api/v1/videos` 
          
          while (synched<synchlimit){
            try {
              returnedVideos = axios.get(getVideosApi);
            } catch (err){
              console.log("🚧 hard error getting video list for transcripts",getVideosApi, synched);
            }
            for (var video of returnedVideos.data){
              synched++
              console.log("🚧 found video",video,synched);
            }
          }

          /*
          let cloneChannel,cloneChannelParts;
          if (importarcUrl){
            console.log("importing channel",importarcUrl.value);
            cloneChannel = importarcUrl.value;
            if (cloneChannel && cloneChannel.length>1){
              cloneChannelParts = cloneChannel.split("/");
              if (cloneChannelParts.length > 1){
                cloneChannel = cloneChannelParts[cloneChannelParts.length-1];
              }
              let url = "https://" + window.location.hostname + "/plugins/podcast2/router/importarc?id=" + cloneChannel;
              let bearer = await peertubeHelpers.getAuthHeader() 
              console.log("trying to import", bearer, url,cloneChannel);
              let returnMessage;
              try {
                returnMessage = await axios.put(url,{ bear: bearer},{ headers: bearer });
              } catch (err){
                console.log("error sending request",err,url,cloneChannel,err.message,err.data.message);
                notifier.error("failed trying to import ");
              }
              console.log("importing returned message",returnMessage);
              if (returnMessage){
                window.location.replace(returnMessage.data);
              }
              // notifier.success(returnMessage)
            }
          } else {
            console.log("no import url");
          }
          */
        }
      } else {
        console.log("no import button");
      }
    }
  })

  const videoFormOptions = { tab: 'plugin-settings' };
  let commonOptions = {
    name: 'seasonnode',
    label: 'Season number',
    descriptionHTML: 'which season this episode belongs to',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    name: 'seasonname',
    label: 'Season descriptive name',
    descriptionHTML: 'Display name of this season',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    name: 'episodenode',
    label: 'Episode number',
    descriptionHTML: 'episode number in season',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    name: 'episodename',
    label: 'Episode descriptive name',
    descriptionHTML: 'Display name of this episode',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    id: 'chapters-id',
    name: 'chapters',
    label: 'Chapter file',
    descriptionHTML: 'URL for chapter file',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    name: 'itemtxt',
    label: 'arbitrary text',
    descriptionHTML: 'arbitrary text string for item',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }
  commonOptions = {
    name: 'sourceid',
    label: 'YouTube ID',
    descriptionHTML: 'ID of original youtube video',
    type: 'input',
    default: ''
  }
  for (const type of ['upload', 'import-url', 'import-torrent', 'update', 'go-live']) {
    registerVideoField(commonOptions, { type, ...videoFormOptions })
  }

  await peertubeHelpers.getSettings()
    .then(s => {
      chatEnabled = s['irc-enable'];
      debugEnabled = s['debug-enable'];
      rssEnabled = s['rss-enable'];
      // if (debugEnabled) {
      console.log("🚧settings", s);
      // }
    })
  peertubeHelpers.getServerConfig()
    .then(config => {
      if (debugEnabled) {
        console.log('🚧Fetched server config.', config);
      }
      instanceName = config.instance.name;

    })
    /*
  try {
    let versionResult = await axios.get(basePath + "/getversion");
    if (versionResult && versionResult.data) {
      softwareVersion = versionResult.data;
    }
  } catch (err) {
    console.log("🚧error getting software version", basePath, err);
  }
  */
 softwareVersion="6.9";

  async function getChatRoom(channel) {
    if (debugEnabled) {
      console.log("🚧getting chat room", channel, basePath, chatEnabled)
    }
    if (!chatEnabled){
      return;
    }
    let chatApi = basePath + "/getchatroom?channel=" + channel;
    try {
      let chatRoom = await axios.get(chatApi);
      if (chatRoom) {
        //console.log("🚧chatroom returned", chatRoom, "data", chatRoom.data);
        return chatRoom.data;
      }
    } catch (err) {
      return;
    }
  }
  async function setChatRoom(channel, chatRoom) {
    if (debugEnabled) {
      console.log("🚧getting chat room", channel, chatRoom, chatEnabled)
    }
    if (!chatEnabled){
      return;
    }
    let chatApi = basePath + "/setchatroom?channel=" + channel + "&chatroom=" + encodeURIComponent(chatRoom);
    try {
      await axios.get(chatApi);
    } catch (err) {
      console.log("🚧error attempting to set chatroom", err, channel, chatRoom);
    }
  }
  async function getFeedID(channel) {
    let feedApi = basePath + "/getfeedid?channel=" + channel;
    try {
      let feedId = await axios.get(feedApi);
      if (feedId) {
        return feedId.data;
      }
    } catch (err) {
      return;
    }
  }
  async function setFeedID(channel, feedID) {
    let feedApi = basePath + "/setfeedid?channel=" + channel + "&feedid=" + feedID;
    try {
      await axios.get(feedApi);
    } catch (err) {
      console.log("🚧error attempting to fetch feed id", err);
    }
  }
  async function getChannelGuid(channel) {
    let guid;
    let guidApi = basePath + "/getpoddata?channel=" + channel;
    try {
      guid = await axios.get(guidApi);
      if (guid) {
        if (debugEnabled) {
          console.log("🚧guid from guid api", guid)
        }
        return guid.data.feedguid;
      }
    } catch (err) {
      console.log("🚧error getting channel guid", guidApi, err)
    }
    return;
  }
  async function getPodData(channel) {
    let freshPodData;
    let podApi = basePath + "/getpoddata?channel=" + channel;
    try {
      freshPodData = await axios.get(podApi);
      if (freshPodData) {
        return freshPodData.data;
      }
    } catch (err) {
      console.log("🚧error getting pod Data", podApi, err)
    }

    return;
  }
  async function getConfigPanel(channel) {
    let feedID = await getFeedID(channel);
    if (debugEnabled) {
      console.log("🚧getting config panel", feedID, channel);
    }
    let html = `<br><label _ngcontent-msy-c247="" for="pod">Podcast Settings</label><br>`

    if (rssEnabled) {
      html = html + "<hr>"
      html = html + `<button type="button" id="rss-settings" name="ress-settings" class="peertube-button orange-button ng-star-inserted">Podcasting 2.0 RSS settings</button>`;
      //html = html + `<button type="button" id="rss-clone"  class="peertube-button orange-button ng-star-inserted">clone</button>`;

    }


    html = html + "<hr>"

    //html = html + "<br>podcast 2.0 RSS feed URL: " + rssFeedUrl;
    const panel = document.createElement('div');
    panel.setAttribute('class', 'podcast2-button');
    panel.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms')
    panel.innerHTML = html;
    return panel;
  }

}
  export {
  register
}

