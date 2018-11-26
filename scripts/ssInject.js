
function screenShot(){
	console.log('screenShot被执行了！');
	// 第二个参数指定接收的域名
	postMessageToContent({screenShot:'allScreen'},'*');
}

function postMessageToContent(msg,org)
{
	window.postMessage(msg, org);
}
