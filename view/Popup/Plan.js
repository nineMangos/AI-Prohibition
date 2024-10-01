import Popup from "./index.js";
import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import config from "../../asset/config.js";
import utils from "../../asset/utils.js";

class PlanCardModel {
	constructor(name, bannedList) {
		this.name = name;
		this.bannedList = bannedList.slice();
		this.id = Date.now().toString(32);
	}
}

/** @extends HTMLLIElement */
class PlanCard {
	get name() { return this.querySelector('.show>span[data-id="name"]').innerHTML; }
	set name(value) { this.querySelector('.show>span[data-id="name"]').innerHTML = value; }
	get data() {
		const name = this.name;
		const { bannedList, id } = this._data;
		return { name, id, bannedList, fileName: this.getFileName(name) };
	}
	constructor({ name, bannedList, id }) {
		const li = document.createElement('li');
		li._data = { bannedList, id };
		Object.setPrototypeOf(PlanCard.prototype, Object.getPrototypeOf(li));
		Object.setPrototypeOf(li, this);
		const show = document.createElement('div');
		show.classList.add('show');
		show.innerHTML = `<span data-id="name">${name}</span><input type="text" maxlength="6"><span data-id="length">（禁将数量：${bannedList.length}）</span>`;
		const action = document.createElement('div');
		action.classList.add('action');
		action.innerHTML = `
			<span data-id="load">读取</span>
			<span data-id="cover">覆盖</span>
			<span data-id="edit">编辑</span>
			<span data-id="delete">删除</span>
		`;
		li.appendChild(show);
		li.appendChild(action);
		return li;
	}
	/**
	 * 获取文件名
	 * @param { string } str
	 * @returns { string } 
	 */
	getFileName(str1) {
		const { bannedList, id } = this._data;
		return `${str1}【${bannedList.length}】 - ${id}.json`;
	}
}

export default class Plan extends Popup {
	selector
	/** @type { number } 最大方案数 */
	maxLi = 15;
	/** @type { Promise | null } 当前的 Promise 对象 */
	currentPromise = null;
	constructor(parentNode) {
		super(parentNode, `
			.content>.add{
				margin-bottom: 10px;
			}
			.content>.add>img{
				width: 18px;
				vertical-align: bottom;
			}
			.content>.add>span[data-id="text"]{
			}
			.content>ul{
				display: grid;
				gap: 10px;
				list-style: none;
			}
			.content>ul>li {
				display: flex;
				justify-content: space-between;
				align-items: center;
				background: rgba(200,200,200,.3);
				border-radius: 10px;
				height: 38px;
				text-align: center;
				padding: 5px;
				box-sizing: border-box;
			}
			.content>ul>li>.action {
				display: flex;
				gap: 5px;
			}
			.content>ul>li>.show>span[data-id="name"] {
				 font-size: 16.5px;
			}
			.content>ul>li>.show>span[data-id="name"].hidden {
				 display: none;
			}
			.content>ul>li>.show>span[data-id="name"] +input{
				 width: 60px;
				 display: none;
			}
			.content>ul>li>.show>span[data-id="name"].hidden +input{
				 display: inline;
			}
			.content>ul>li>.show>span[data-id="length"] {
				font-size: 13.5px;
			}
			.content>ul>li>.action>span {
				font-size: 14px;
				cursor: pointer;
			}
			.content>ul>li>.action>span:hover {
				color: #83AAEF;
			}
		`);
		this.selector = parentNode;
		this.setCaption('AI禁将——方案');
		if (!['electron', 'cordova'].includes(utils.getDeviceType())) {
			this.setContent('<center style="line-height: 50vh; font-size: 30px;">当前环境不可用</center>');
		} else {
			this.readAllJSON()
				.then(plans => {
					const add = document.createElement('div');
					const ul = document.createElement('ul');
					plans.forEach(item => ul.appendChild(new PlanCard(item)));
					add.classList.add('add');
					add.innerHTML = `<img src="${lib.assetURL}extension/AI禁将/image/add.png" style="cursor: pointer;"><span data-id="text"> 添加新的方案</span>`;
					this.node.content.node = { add, ul };
					this.setContent(add);
					this.setContent(ul);
					this.#addListener();
				});
		}
	}
	/** @returns { PlanCard } */
	createNewPlanCard() {
		const ul = this.node.content.node.ul;
		let str = '方案';
		let num = 1;
		const nameArr = Array.from(ul.childNodes, item => item.name);
		while (true) {
			const cnNumber = get.cnNumber(num, true);
			if (nameArr.every(name => name !== str + cnNumber)) {
				str += cnNumber;
				break;
			}
			num++;
		}
		const model = new PlanCardModel(str, config.bannedList);
		return new PlanCard(model);
	}
	#addListener() {
		const add = this.node.content.node.add;
		const ul = this.node.content.node.ul;
		this.node.content.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', e => {
			if (e.target.matches('.content>.add>img')) {
				//添加按钮
				utils.playAudio('click1');
				const card = this.createNewPlanCard();
				this.writeJSON(card).then(() => {
					let count = ul.childElementCount;
					if (count++ >= this.maxLi) return;
					if (Array.from(ul.childNodes).some(item => item.name === card.name)) {
						return;
					}
					ul.appendChild(card);
					const textnode = add.querySelector('span[data-id="text"]');
					if (count >= this.maxLi && !textnode.innerHTML.includes('（已达上限）')) {
						textnode.innerHTML += '（已达上限）';
					}
				});
			} else if (e.target.closest('.content>ul>li>.action')) {
				switch (e.target.getAttribute('data-id')) {
					case 'load': {
						utils.playAudio('click1');
						const li = e.target.closest('.content>ul>li');
						config.bannedList = li.data.bannedList.slice();
						config.save();
						utils.alert(`读取“${li.name}”成功！`);
						this.selector.renderCharacterList();
						break;
					}
					case 'cover': {
						utils.playAudio('click1');
						if (utils.confirm('确定覆盖此方案吗？')) {
							const newCard = this.createNewPlanCard();
							const oldCard = e.target.closest('.content>ul>li');
							this.deleteJSON(oldCard)
								.then(() => {
									return this.writeJSON(newCard);
								})
								.then(() => {
									ul.replaceChild(newCard, oldCard);
									utils.alert(`新方案“${newCard.name}”已覆盖原方案！`);
								});
						}
						break;
					}
					case 'edit': {
						utils.playAudio('click1');
						const name = e.target.closest('.content>ul>li').querySelector('span[data-id="name"]')
						const input = name.nextElementSibling;
						this.validateInput(name, input);
						break;
					}
					case 'delete': {
						utils.playAudio('click1');
						const oldCard = e.target.closest('.content>ul>li');
						this.deleteJSON(oldCard)
							.then(() => {
								oldCard.remove();
								if (ul.childElementCount < this.maxLi) {
									const text = add.querySelector('[data-id="text"]');
									text.innerHTML = text.innerHTML.replace('（已达上限）', '');
								}
							});
						break;
					}
				}
			}
		});
		this.node.content.addEventListener('dblclick', (e) => {
			if (e.target.matches('ul>li>.show>span[data-id="name"]')) {
				const name = e.target;
				const input = name.nextElementSibling;
				this.validateInput(name, input);
			} else if (e.target.matches('ul>li')) {
				const li = e.target;
				if (navigator.clipboard && navigator.clipboard.writeText) {
					if (utils.confirm(`是否将“${li.name}”的所有禁将id复制到剪贴板中？`)) {
						const str = JSON.stringify(li.data.bannedList);
						navigator.clipboard.writeText(str.substring(1, str.length - 1));
						utils.alert("复制成功！")
					}
				}
			}
		});
	}
	/**
	 * 校验输入框内容
	 * @param { HTMLElement } name 
	 * @param { HTMLInputElement} input 
	 */
	validateInput(name, input) {
		const li = name.closest('.content>ul>li');
		name.classList.add('hidden');
		setTimeout(() => input.focus(), 0);
		input.onkeydown = (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				input.blur();
			}
		};
		input.onblur = (e) => {
			let value = input.value;
			name.classList.remove('hidden');
			value = value.trim();
			if (!value) return;
			if (Array.from(li.parentNode.childNodes).some(item => item !== li && item.name === value)) {
				utils.alert("命名有重复！");
				return;
			}
			if (!/^[a-zA-Z0-9\s\u4e00-\u9fa5\-\_\.]+(\.[a-zA-Z0-9]+)*$/.test(value)) {
				utils.alert("命名不合法！");
				return;
			}
			const oldFileName = li.data.fileName;
			const newFileName = li.getFileName(value);
			this.renameJSON(oldFileName, newFileName)
				.then(() => {
					li.name = value;
					return this.writeJSON(li);
				});
		}
	}
	/**
	 * 读取所有的JSON文件
	 * @returns { Promise<object> }
	 */
	readAllJSON() {
		if (this.currentPromise) {
			return Promise.reject('上一步操作尚未完成！');
		}
		this.currentPromise = new Promise((resolve, reject) => {
			game.getFileList(`extension/AI禁将/plan`, async (folders, files) => {
				let num = 0;
				const plans = [];
				for (const file of files) {
					if (num >= this.maxLi) break;
					if (file.endsWith('.json')) {
						const data = await new Promise(resolve => {
							lib.init.json(`${lib.assetURL}extension/AI禁将/plan/${file}`, data => resolve(data), e => console.error('JSON 文件解析失败：\n' + e));
						});
						num++;
						plans.push(data);
					}
				}
				this.currentPromise = null;
				resolve(plans);
			}, e => reject(e));
		})
		return this.currentPromise;
	}
	/**
	 * 写入JSON文件
	 * @param { PlanCard } PlanCard
	 * @returns { Promise }
	 */
	writeJSON(card) {
		if (this.currentPromise) {
			return Promise.reject('上一步操作尚未完成！');
		}
		this.currentPromise = new Promise((resolve) => {
			game.writeFile(JSON.stringify(card.data), `extension/AI禁将/plan`, card.data.fileName, data => {
				this.currentPromise = null;
				resolve(data);
			});
		})
		return this.currentPromise;
	}
	/**
	 * 删除JSON文件
	 * @param { PlanCard } PlanCard
	 * @returns { Promise }
	 */
	deleteJSON(card) {
		if (this.currentPromise) {
			return Promise.reject('上一步操作尚未完成！');
		}
		this.currentPromise = new Promise(resolve => {
			game.removeFile(`extension/AI禁将/plan/${card.data.fileName}`, data => {
				this.currentPromise = null;
				resolve(data);
			});
		})
		return this.currentPromise;
	}
	/**
	 * 重命名JSON文件
	 * @param { string } oldFile 旧文件名
	 * @param { string } newFile 新文件名
	 * @returns { Promise }
	 */
	renameJSON(oldFile, newFile) {
		if (this.currentPromise) {
			return Promise.reject('上一步操作尚未完成！');
		}
		this.currentPromise = new Promise((resolve, reject) => {
			const _path = `extension/AI禁将/plan/`;
			utils.renameFile(_path + oldFile, newFile, data => {
				this.currentPromise = null;
				resolve(data);
			}, e => reject(e));
		})
		return this.currentPromise;
	}
}

customElements.define('selector-popup-plan', Plan);
