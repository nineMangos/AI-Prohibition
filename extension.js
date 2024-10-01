import { lib, game, ui, get, ai, _status } from "../../noname.js";
import Selector from "./view/Selector.js";
import SelectorController from "./controller/SelectorController.js";
import SelectorModel from "./model/SelectorModel.js";
import config from "./asset/config.js";
import utils from "./asset/utils.js";
import Constant from "./asset/Constant.js";

game.import("extension", function () {

	let updateHistory;
	lib.init.css(lib.assetURL + 'extension/AI禁将/view', "Selector");//调用css样式
	let selectorController;

	return {
		name: "AI禁将",
		content: function (cfg, pack) {
			/* <-------------------------AI禁将-------------------------> */
			selectorController = new SelectorController(new Selector(), new SelectorModel());

			!(function () {
				let savedFilter = lib.filter.characterDisabled;
				let stockDisabled = false;
				/**
				 * 从《玄武江湖》抄来的AI禁将
				*/
				lib.filter.characterDisabled = function (i, libCharacter) {
					if (stockDisabled) return savedFilter(i, libCharacter);
					let list = config.bannedList;
					if (lib.character[i] && list.includes(i)) {
						return true;
					}
					return savedFilter(i, libCharacter);
				};
				/**
				 * 判断是否为本体或者其他扩展的禁将
				 */
				window['AI禁将_savedFilter'] = function (i, libCharacter) {
					stockDisabled = true;
					let result = lib.filter.characterDisabled(i, libCharacter);
					stockDisabled = false;
					return result;
				};
			}());

			/* <-------------------------从《全能搜索》抄来的加入顶部菜单栏-------------------------> */
			if (config.addMenu) {
				const getSystem = setInterval(() => {
					if (ui.system1 || ui.system2) {
						clearInterval(getSystem);
						ui.create.system('🈲', function () {
							selectorController.openSelector('showSystem');
						});
					}
				}, 500);
			}
		},
		precontent: function () {
			lib.init.promises
				.json(`${lib.assetURL}extension/AI禁将/updateHistory.json`)
				.then(info => updateHistory = info, err => utils.alert('JSON 文件解析失败\n' + err))
		}, config: {
			"updateInfo": {
				name: `版本：${Constant.version}`,
				init: '1',
				unfrequent: true,
				intro: "查看此版本更新说明",
				"item": {
					"1": "<font color=#2cb625>更新说明",
				},
				"textMenu": function (node, link) {
					lib.setScroll(node.parentNode);
					node.parentNode.style.transform = "translateY(-100px)";
					node.parentNode.style.width = "350px";
					node.style.cssText = "width: 350px; padding:5px; box-sizing: border-box;";
					let str = '';
					if (updateHistory) {
						const changeLog = updateHistory[Constant.version];
						for (let i of changeLog) {
							str += `·${i}<br>`;
						}
					}
					node.innerHTML = str;
				},
			},

			"forbidai_bg": {
				name: "AI禁将界面背景图片",
				init: "huanhua",
				unfrequent: true,
				intro: "更改启动页背景图（重启生效）",
				"item": {
					"xitong": "跟随系统",
					"huanhua": "幻化之战",
					"erqiao": "大乔小乔",
					"yueye": "仲夏月夜",
				},
				"textMenu": function (node, link) {
					lib.setScroll(node.parentNode);
					node.parentNode.style.transform = "translateY(-100px)";
					//node.parentNode.style.height = "710px";
					node.parentNode.style.width = "200px";
					node.style.cssText = "width: 200px; height: 115px; position:relative; padding:0; border-radius:10px; color: white; box-sizing:border-box;";
					if (link === "xitong") {
						node.style.height = "38px";
						node.innerHTML = '<div style="font-family: xingkai, xinwei;line-height:28px; text-align: center; width: 200px; height:30px; box-sizing:border-box; border-radius:10px; border:2px solid gray; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);">跟随系统</div>';
					}
					else {
						const div = ui.create.div();
						div.style.cssText += `
							background:url(${lib.assetURL}extension/AI禁将/image/${link}_bg.jpg) no-repeat right center/cover;
							width: 192px;
							height: 108px;
							text-align: center;
							box-sizing: border-box;
							border-radius: 10px;
							border: 2px solid gray;
							padding-top: 18px;
							position: absolute;
							top: 50%;
							left: 50%;
							transform: translate(-50%, -50%);">`;
						div.innerHTML = `
							<span style="font-family: xingkai, xinwei;">
								${node.innerText}
							</span>`
						node.innerHTML = '';
						node.appendChild(div);
					}
				},
			},

			"forbidai": {
				"clear": true,
				name: '<ins>打开禁将界面</ins>',
				onclick: function () {
					selectorController.openSelector();
				},
			},

			"repository1": {
				clear: true,
				name: `点击复制github仓库地址`,
				async onclick() {
					if (navigator.clipboard && navigator.clipboard.writeText) {
						await navigator.clipboard.writeText("https://github.com/nineMangos/AI-Prohibition");
						alert('内容已成功复制到剪贴板');
					} else {
						alert('复制失败');
					}
				}
			},

			"repository2": {
				clear: true,
				name: `点击复制gitee仓库地址`,
				async onclick() {
					if (navigator.clipboard && navigator.clipboard.writeText) {
						await navigator.clipboard.writeText("https://gitee.com/ninemangos/AI-Prohibition");
						alert('内容已成功复制到剪贴板');
					} else {
						alert('复制失败');
					}
				}
			},
		}, help: {}, package: {
			character: {
				character: {
				},
				translate: {
				},
			},
			card: {
				card: {
				},
				translate: {
				},
				list: [],
			},
			skill: {
				skill: {
				},
				translate: {
				},
			},
			intro: "",
			author: "芒果🥭",
			diskURL: "",
			forumURL: "",
			version: Constant.version,
		}, files: { "character": [], "card": [], "skill": [], "audio": [] }
	}
});
