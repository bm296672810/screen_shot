
var currentTab, // result of chrome.tabs.query of current active tab
    resultWindowId; // window id for putting resulting images
	currentDownloadId = 0;

// 当用户接收关键字建议时触发
chrome.omnibox.onInputEntered.addListener((text) => {
    console.log('inputEntered: ' + text);
    if(!text) return;
	console.log('test:' + text.replace('百度搜索', ''));
    var href = '';
    if(text.endsWith('美女')) href = 'http://image.baidu.com/search/index?tn=baiduimage&ie=utf-8&word=' + text;
    else if(text.startsWith('百度搜索')) href = 'https://www.baidu.com/s?ie=UTF-8&wd=' + text.replace('百度搜索 ', '');
    else if(text.startsWith('谷歌搜索')) href = 'https://www.google.com.tw/search?q=' + text.replace('谷歌搜索 ', '');
    else href = 'https://www.baidu.com/s?ie=UTF-8&wd=' + text;
    openUrlCurrentTab(href);
});

// 当前标签打开某个链接
function openUrlCurrentTab(url)
{
	console.log('openUrlCurrentTab:' + url);
    getCurrentTabId(tabId => {
        chrome.tabs.update(tabId, {url: url});
    });
}
// 后台主动发消息给content-script
function sendMessageToContentScript(message, callback)
{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
    {
        chrome.tabs.sendMessage(tabs[0].id, message, function(response)
        {
            if(callback) callback(response);
        });
    });
}

function errback(resion){
	console.log('errback:' + resion);
}

function splitnotifier() {
    console.log('split-image');
}

// function displayCapture(filenames){
	// if(!filenames || !filenames.length){
		// console.log('displayCapture filenames is null');
	// }
	// else{
		// console.log('displayCapture filenames length=' + filenames.length);
		// console.log('filenames[0]' + filenames[0]);
		// sendMessageToContentScript({msg:'displayFile',files:filenames},function(response){console.log('response:' + response);});
	// }
// }

function displayCaptures(filenames) {
    if (!filenames || !filenames.length) {
        // show('uh-oh');
		console.log('filenames is null!');
        return;
    }

    _displayCapture(filenames);
}


function _displayCapture(filenames, index) {
    index = index || 0;

    var filename = filenames[index];
    var last = index === filenames.length - 1;

    if (currentTab.incognito && index === 0) {
        // cannot access file system in incognito, so open in non-incognito
        // window and add any additional tabs to that window.
        //
        // we have to be careful with focused too, because that will close
        // the popup.
        chrome.windows.create({
            url: filename,
            incognito: false,
            focused: last
        }, function(win) {
            resultWindowId = win.id;
        });
    } else {
        chrome.tabs.create({
            url: filename,
            active: last,
            windowId: resultWindowId,
            openerTabId: currentTab.id,
            index: (currentTab.incognito ? 0 : currentTab.index) + 1 + index
        });
		
		
		downloadFile(filename, splitFilename(filename));
    }

    if (!last) {
        _displayCapture(filenames, index + 1);
    }
}

function splitFilename(url){
	var i = url.lastIndexOf('/');
	var r = url.substr(i + 1,url.length - i - 1);
	return r;
}
function downloadFile(src, filename) {
	console.log('download:' + src);
	// // 创建隐藏的可下载链接
	// var eleLink = document.createElement('a');
	// eleLink.download = filename;
	// eleLink.style.display = 'none';
	// // // 字符内容转变成blob地址
	// eleLink.href = src;
	// // // 触发点击
	// document.body.appendChild(eleLink);
	// eleLink.click();
	// // // 然后移除
	// document.body.removeChild(eleLink);
	
	chrome.downloads.download({'url': src, 'filename': filename}, function(downloadId){console.log('downloadId:' + downloadId); downloadStatus(downloadId);});
	console.log('download end...');
	
};
function downloadStatus(downloadId){
	currentDownloadId = downloadId;
	chrome.downloads.onChanged.addListener(downloadCallback);
}
// 监视下载的回调
function downloadCallback(downloadDelta){
	if(downloadDelta.id == currentDownloadId){
		console.log('downloadCallback:' + JSON.stringify(downloadDelta));
		switch(downloadDelta.state.current){
			case 'complete': downloadComplete(); break;
			case 'in_progress': downloadProgress(); break;
		}
	}
}
function downloadComplete(){
	console.log('downloadComplete downloadId:' + currentDownloadId);
}
function downloadProgress(){
	console.log('downloadProgress downloadId:' + currentDownloadId);
}

function getAllScreen()
{
	getCurrentTab(tab=>{
		if(tab){
			currentTab = tab;
			captureTest();
			var filename = getFilename(tab.url);
			CaptureAPI.captureToFiles(tab, filename, displayCaptures, errback, splitnotifier);
		} else {
			console.log('tab is unvalid !');
		}
	});
}
// 监听来自content-script的消息
function listenContentMsg(request, sender, sendResponse)
{
	console.log('收到来自content-script的消息：');
	var op = request['screenShot'];
	console.log('op:' + op);
	var data;
	var screenshots = [];
	switch(op)
	{
		case 'allScreen': getAllScreen(); break;
	}
    sendResponse('我是后台，我已收到你的消息：' + JSON.stringify(request));
	console.log('data:' + data);
}

chrome.runtime.onMessage.addListener(listenContentMsg);