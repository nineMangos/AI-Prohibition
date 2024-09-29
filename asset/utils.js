import { lib, game, ui, get, ai, _status } from "../../../noname.js";

class Utils {
	/** @type { boolean } */
	alerting = false;
	remote = require('@electron/remote');
	path = require('path');
	/**
	 * 搬运自缘伴随行的《启动页美化》，已征得同意
	 * @param { string } name 音频名
	 * @param { number? } volume 音量
	 */
	playAudio(name, volume) {
		const audio = document.createElement("audio");
		const path = "extension/AI禁将/audio/";
		audio.src = lib.assetURL + path + name.replace(".mp3", "") + ".mp3";
		audio.volume = volume || lib.config.volumn_audio / 8;
		document.body.appendChild(audio);
		audio.addEventListener("ended", () => {
			document.body.removeChild(audio);
		});
		audio.play()["catch"]((error) => {
			this.alert("⚠️音频播放时发生错误！\n⚠️请检查你的音频文件【" + lib.assetURL + path + name + "】是否正确存在！");
			console.error("⚠️音频播放时发生错误！\n⚠️请检查你的音频文件【" + lib.assetURL + path + name + "】是否正确存在！");
			audio.remove();
		});
	}
	/**
	 * alert弹窗，搬运自《应用配置》扩展
	 * @param { any } msg 弹窗文本
	 */
	alert(msg) {
		this.remote.dialog.showMessageBoxSync(this.remote.getCurrentWindow(), {
			title: '无名杀',
			message: msg !== undefined ? (msg + '') : '',
			icon: this.path.join(__dirname, 'noname.ico'),
			buttons: ['确定'],
			noLink: true
		});
	}
	/**
	 * 异步alert弹窗
	 * @param { string } str 弹窗文本
	 */
	asyncAlert(str) {
		if (this.alerting) return;
		this.alerting = true;
		return new Promise(resolve => {
			game.prompt(str, "alert", () => {
				this.alerting = false;
				resolve(true);
			});
		});
	}
	/**
	 * confirm弹窗，搬运自《应用配置》扩展
	 * @param { any } message 弹窗文本
	 */
	confirm(message) {
		const result = this.remote.dialog.showMessageBoxSync(this.remote.getCurrentWindow(), {
			title: '无名杀',
			message: message !== undefined ? (message + '') : '',
			icon: this.path.join(__dirname, 'noname.ico'),
			buttons: ['确定', '取消'],
			noLink: true,
			cancelId: 1,
			defaultId: 0,
		});
		return result == 0;
	}
	/**
	 * 重命名文件
	 * @param { string } oldPath 旧路径名
	 * @param { string } newPath 新路径名
	 * @param { (data: any) => void } callback 回调函数
	 * @param { (err: any) => void } onerror 错误回调函数
	 */
	renameFile(oldPath, newPath, callback = () => { }, onerror = () => { }) {
		lib.node.fs.rename(__dirname + "/" + oldPath, __dirname + "/" + newPath, function (err, data) {
			if (err) {
				onerror(err);
			} else {
				callback(data);
			}
		});
	}
}

export default new Utils();
