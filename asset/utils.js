import { lib, game, ui, get, ai, _status } from "../../../noname.js";

class Utils {
	/** @type { boolean } */
	alerting = false;
	remote = this.getDeviceType() === "electron" ? require('@electron/remote') : void 0;
	path = this.getDeviceType() === "electron" ? require('path') : void 0;
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
		if (this.getDeviceType() === "electron") {
			this.remote.dialog.showMessageBoxSync(this.remote.getCurrentWindow(), {
				title: '无名杀',
				message: msg !== undefined ? (msg + '') : '',
				icon: this.path.join(__dirname, 'noname.ico'),
				buttons: ['确定'],
				noLink: true
			});
			return;
		}
		return window.alert(msg);

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
		if (this.getDeviceType() === "electron") {
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
		return window.confirm(message);

	}
	/**
	 * confirm弹窗，搬运自《应用配置》扩展
	 * @param { any } message 弹窗文本
	 * @param { string } buttons 按钮数组
	 */
	confirm2(message, buttons = ['确定', '取消']) {
		if (this.getDeviceType() === "electron") {
			const result = this.remote.dialog.showMessageBoxSync(this.remote.getCurrentWindow(), {
				title: '无名杀',
				message: message !== undefined ? (message + '') : '',
				icon: this.path.join(__dirname, 'noname.ico'),
				buttons,
				noLink: true,
				cancelId: buttons.length - 1,
				defaultId: 0,
			});
			return buttons[result];
		}
		return window.confirm(message);

	}
	getDeviceType() {
		if (window.cordova) {
			return 'cordova';
		} else if (typeof window.require === "function") {
			return 'electron';
		}
		return 'other';
	}
	/**
	 * 重命名文件
	 * @param { string } oldPath 旧路径名
	 * @param { string } newFileName 新文件名
	 * @param { (data: any) => void } callback 回调函数
	 * @param { (err: any) => void } onerror 错误回调函数
	 */
	renameFile(oldPath, newFileName, callback = () => { }, onerror = () => { }) {
		if (this.getDeviceType() === "electron") {
			const newPath = this.path.join(oldPath.substring(0, oldPath.lastIndexOf("/")), newFileName);
			lib.node.fs.rename(__dirname + "/" + oldPath, __dirname + "/" + newPath, function (err, data) {
				if (err) {
					onerror(err);
				} else {
					callback(data);
				}
			});
		} else if (this.getDeviceType() === "cordova") {
			const nonameInitialized = localStorage.getItem("noname_inited");
			// 解析当前文件的文件系统 URL
			window.resolveLocalFileSystemURL(nonameInitialized + oldPath, function (fileEntry) {
				// 获取目标目录的父目录
				fileEntry.getParent(function (parentDirectoryEntry) {
					// 使用 moveTo 方法重命名文件
					fileEntry.moveTo(parentDirectoryEntry, newFileName, function (newFileEntry) {
						// 文件重命名成功
						callback(null, newFileEntry);
					}, onerror);
				}, onerror);
			}, onerror);
		}
	}
}

export default new Utils();
