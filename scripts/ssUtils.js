
var MAX_PRIMARY_DIMENSION = 15000 * 2,
	MAX_SECONDARY_DIMENSION = 4000 * 2,
	MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;
	
var matches = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'],
	noMatches = [/^https?:\/\/chrome.google.com\/.*$/];

function isValidUrl(url) {
	// couldn't find a better way to tell if executeScript
	// wouldn't work -- so just testing against known urls
	// for now...
	var r, i;
	for (i = noMatches.length - 1; i >= 0; i--) {
		if (noMatches[i].test(url)) {
			return false;
		}
	}
	for (i = matches.length - 1; i >= 0; i--) {
		r = new RegExp('^' + matches[i].replace(/\*/g, '.*') + '$');
		if (r.test(url)) {
			return true;
		}
	}
	return false;
}

function getFilename(contentURL) {
	console.log('contentURL:' + contentURL);
    var name = contentURL.split('?')[0].split('#')[0];
    if (name) {
        name = name
            .replace(/^https?:\/\//, '')
            .replace(/[^A-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^[_\-]+/, '')
            .replace(/[_\-]+$/, '');
        name = '-' + name;
    } else {
        name = '';
    }
    return 'screencapture' + name + '-' + Date.now() + '.png';
}

// 获取当前选项卡ID
function getCurrentTabId(callback)
{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
    {
        if(callback) callback(tabs.length ? tabs[0].id: null);
    });
}

// 获取当前选项卡
function getCurrentTab(callback)
{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
    {
        if(callback) callback(tabs.length ? tabs[0] : null);
    });
}
// 获取图片的宽高
function getJpegExtents(image) {
    var width, height;
    if (image.substring(0, 23) === 'data:image/jpeg;base64,') {
        image = atob(image.replace('data:image/jpeg;base64,', ''));
    }

    if (!image.charCodeAt(0) === 0xff ||
        !image.charCodeAt(1) === 0xd8 ||
        !image.charCodeAt(2) === 0xff ||
        !image.charCodeAt(3) === 0xe0 ||
        !image.charCodeAt(6) === 'J'.charCodeAt(0) ||
        !image.charCodeAt(7) === 'F'.charCodeAt(0) ||
        !image.charCodeAt(8) === 'I'.charCodeAt(0) ||
        !image.charCodeAt(9) === 'F'.charCodeAt(0) ||
        !image.charCodeAt(10) === 0x00) {
        throw new Error('getJpegSize requires a binary jpeg file')
    }

    var blockLength = image.charCodeAt(4)*256 + image.charCodeAt(5);
    var i = 4, len = image.length;
    while ( i < len ) {
        i += blockLength;
        if (image.charCodeAt(i) !== 0xff) {
            throw new Error('getJpegSize could not find the size of the image');
        }
        if (image.charCodeAt(i+1) === 0xc0) {
            height = image.charCodeAt(i+5)*256 + image.charCodeAt(i+6);
            width = image.charCodeAt(i+7)*256 + image.charCodeAt(i+8);
            return [width, height];
        } else {
            i += 2;
            blockLength = image.charCodeAt(i)*256 + image.charCodeAt(i+1)
        }
    }
}

function isOnlyLite()
{
    return localStorage[cOnlyLitePref] == "true" || localStorage[cOnlyLitePref] == "1";
}

function isNativeSupported()
{
    if (isOnlyLite())
        return false;
    else
        return fsNativePlugin.ready;
}

function getPlugin()
{
	return isNativeSupported() ? fsNativePlugin : getJSPlugin();
}
function pluginCommand(cmd, param1)
{
	try
	{
		var obj = param1 ? param1 : {},
			plugin = getPlugin();
		obj.JSONCommand = cmd;
		
		if (isDebug) {
            if (obj.dataurl) {
                var t       = obj.dataurl;
                obj.dataurl = "<cut>";
                getConsolePtr()("plugin command: " + cmd + " : " + JSON.stringify(obj));
                obj.dataurl = t;
            }
            else getConsolePtr()("plugin command: " + cmd + " : " + JSON.stringify(obj));
        }
		//return getPlugin().launchFunction(cmd, obj);
		return isNativeSupported() ? plugin.launchJSON(obj) : plugin.launchFunction(cmd, obj);
	}
	catch (e) 
	{
		logError(e.message);
		return false;
	}
}