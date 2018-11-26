window.onload=function(){
	var liItem1 = document.getElementById("mnuCaptureEntireLite");
	liItem1.onclick = function(){
		//alert("mnuCaptureEntireLite");
		//alert(chrome.extension.getBackgroundPage().getInstalledPageURL());
		var bkg = chrome.extension.getBackgroundPage();
		bkg.sendMessageToContentScript({cmd:'test', value:'你好，我是popup！'}, function(response)
		{
			console.log('来自content的回复：'+response);
		});
	}
}
