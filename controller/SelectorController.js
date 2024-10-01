import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import Selector from "../view/Selector.js";
import SelectorModel from "../model/SelectorModel.js";
import utils from "../asset/utils.js";
import config from "../asset/config.js";
import Popup from "../view/Popup/index.js";
import Help from "../view/Popup/Help.js";
import Plan from "../view/Popup/Plan.js";
import Setup from "../view/Popup/Setup.js";
import Constant from "../asset/Constant.js";

export default class SelectorController {
	/** * @type { number } 定时任务的id */
	#timeId1;
	#timeId2;
	#timeId3;
	/** * @type { string[] } 被选中的武将id数组*/
	selectedBannedList = [];
	/** * @type { string[] } 取消选中的武将id数组*/
	reducedBannedList = [];
	/** * @type { Selector } */
	selector;
	/** * @type { SelectorModel }  */
	model;
	/** * @type { boolean } 是否处于搜索框的搜索状态下 */
	isSearching;
	/** * @type { boolean } 若为true，则在等待键盘抬起 */
	awaitKeyup;
	/** * @type { "showSystem" | undefined } */
	onClose
	/** * @type { Array } 用于记录窗口事件并禁用，关闭时恢复 */
	recordEvent = [];
	/**
	 * @param { Selector } selector 选择器
	 * @param { SelectorModel } model 选择器模型
	 */
	constructor(selector, model) {
		this.selector = selector;
		this.model = model;
		selector.controller = this;
		model.controller = this;
	}
	/**
	 * @param { "showSystem" | undefined } onClose 
	 */
	openSelector(onClose) {
		this.addBannedEvent(window, 'onkeydown');
		this.addBannedEvent(lib.config, 'swipe');
		window.onkeydown = this.onKeydownWindow.bind(this);
		this.onClose = onClose;
		this.selector.open();
	}
	/**
	 * @param { string } name 
	 * @returns { string[] }
	 */
	getList(name) {
		switch (name) {
			case 'packList': return this.model.getPackListId();
			case 'packCategories': return this.model.getPackCategoriesId();
			case 'characters': return this.model.getCharactersId();
		}
		return [];
	}
	onKeydownWindow(event) {
		const key = event.key.toLowerCase();
		if (!event.ctrlKey && !event.metaKey) {
			switch (key) {
				case 'f1': {
					this.onClickHelpBtn();
					break;
				}
				case 'escape':
				case 'esc': {
					if (!(this.selector.lastElementChild instanceof Popup)) {
						this.onClickCloseBtn();
					}
					break;
				}
			}
		} else {
			switch (key) {
				case 'a': {
					const target = this.selector.node.selectAll;
					this.onClickSelectAllBtn(target);
					break;
				}
				case 'f': {
					this.selector.node.searchInput.focus();
					break;
				}
				case 's': {
					this.onClickCharConfirmBtn();
					break;
				}
				case 'j': {
					const target = this.selector.node.charSelectedBtn;
					this.onClickCharSelectedBtn(target);
					break;
				}
				case 'h': {
					this.onClickHelpBtn();
					break;
				}
				case 't': {
					this.onClickSetUpBtn();
					break;
				}
				case 'b': {
					this.onClickInverseBtn();
					break;
				}
				case 'control': {
					if (this.awaitKeyup) return;
					this.awaitKeyup = true;
					const handleMousewheel = (e) => {
						if (!e.ctrlKey) return;
						const delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
						let zoom = +getComputedStyle(document.documentElement).getPropertyValue('--sl-layout-zoom');
						const max = Constant.maxZoom / game.documentZoom, min = Constant.minZoom / game.documentZoom;
						zoom = delta > 0 ? Math.min(max, zoom + 0.08) : Math.max(min, zoom - 0.08);
						document.documentElement.style.setProperty('--sl-layout-zoom', zoom);
						config.computedZoom = zoom * game.documentZoom;
						config.save();
					};
					const handleKeyup = (e) => {
						if (e.key.toLowerCase() !== 'control') return;
						this.awaitKeyup = false;
						window.removeEventListener('mousewheel', handleMousewheel);
						window.removeEventListener('keyup', handleKeyup);
					};
					window.addEventListener('mousewheel', handleMousewheel);
					window.addEventListener('keyup', handleKeyup);
					break;
				}
			}
		}
	}
	onClickSelectContentBtn(target, event) {
		if (event.target.tagName !== 'SPAN') return;
		utils.playAudio('click1');
		const span = target.parentNode.querySelector('.method>span');
		if (config.currentActiveMode === event.target.innerText) return;
		span.textContent = event.target.innerText;
		config.currentActiveMode = event.target.innerText;
		this.selector.renderPackCategories();
	}
	onClickHelpBtn(target, event) {
		if (event) utils.playAudio('click2');
		new Help(this.selector);
	}
	onClickSelectAllBtn(target, event) {
		if (event) utils.playAudio('click2');
		if (target.classList.toggle('active')) {
			target.textContent = '全不选';
			this.selector.buttonsArr.forEach(btn => {
				this.hanldleCharBtnSelect(btn);
			});
		} else {
			target.textContent = '全选';
			this.selector.buttonsArr.forEach(btn => {
				this.hanldleCharBtnUnselect(btn);
			});
		}
	}
	autoToggleSelectAllBtn() {
		if (this.#timeId3) clearTimeout(this.#timeId3);
		const { selectAll } = this.selector.node;
		this.#timeId3 = setTimeout(() => {
			this.#timeId3 = null;
			if (this.selector.buttonsArr.every(btn => btn.getSelected())) {
				if (!selectAll.classList.contains('active')) {
					selectAll.classList.add('active');
					selectAll.textContent = '全不选';
				}
			} else {
				if (selectAll.classList.contains('active')) {
					selectAll.classList.remove('active');
					selectAll.textContent = '全选';
				}
			}
		}, 30);
	}
	onClickInverseBtn(target, event) {
		if (event) utils.playAudio('click2');
		this.selector.buttonsArr.forEach(btn => {
			this.hanldleCharBtnToggleSelect(btn);
		});
	}
	onClickPlanBtn(target, event) {
		if (event) utils.playAudio('click2');
		new Plan(this.selector);
	}
	onClickSetUpBtn(target, event) {
		if (event) utils.playAudio('click2');
		new Setup(this.selector);
	}
	onKeydownSearchInput(target, event) {
		event.stopPropagation();
		if (event.key == 'Enter') {
			event.preventDefault();
			this.search();
		}
	}
	onInputSearchInput(target, event) {
		if (target.value !== '') {
			this.selector.node.searchClean.style.display = 'block';
		} else {
			this.selector.node.searchClean.style.display = 'none';
		}
	}
	onClickSearchClean(target, event) {
		this.selector.node.searchInput.value = '';
		this.selector.node.searchInput.focus();
		target.style.display = 'none';
	}
	onClickSearchBtn(target, event) {
		this.search();
	}
	search() {
		const selector = this.selector;
		const value = selector.node.searchInput.value;
		if (value.trim() === "") {
			if (this.isSearching) {
				this.isSearching = false;
				selector.renderCharacterList();
			} else {
				utils.alert("请输入正确内容");
			}
			return;
		}
		const reg = new RegExp(value);
		const characters = this.model.getCharactersId(c => reg.test(c) || reg.test(lib.translate[c]));
		this.isSearching = true;
		selector.renderCharacterList(characters);
	};
	onClickCloseBtn(target, event) {
		if (event) utils.playAudio('click5');
		config.scrollLeft = this.selector.node.charPackList.scrollLeft;
		config.save();
		this.selector.close();
		this.removeAllBannedEvent();
		if (ui.dialog) ui.dialog.show();
		if (this.onClose === "showSystem") {
			setTimeout(() => {
				game.closePopped();
				ui.system1.classList.add("shown");
				ui.system2.classList.add("shown");
				game.closeMenu();
				ui.click.shortcut();
			}, 0)
		} else {
			ui.arena.classList.add('menupaused');
			ui.menuContainer.show();
		}
	}
	onMousedownDirectionBtn(target, event) {
		utils.playAudio('click2');
		const change = target.classList.contains('selector-list-left') ? -200 : 200;
		const ul = target.parentNode.querySelector('ul');
		ul.scroll({ left: ul.scrollLeft + change, behavior: 'smooth' });
		this.#timeId2 = setTimeout(() => this.#timeId1 = setInterval(() => ul.scrollLeft += change / 2, 100), 300);
	}
	onWheelCharPackList(target, event) {
		event.preventDefault();
		target.scrollLeft += event.deltaY / 2;
	}
	onClickList(target, event) {
		if (event) utils.playAudio('click3');
		const li = event.target.closest('li');
		if (!li) return;
		const selector = this.selector;
		const activeLi = target.querySelector('li.active');
		if (li === activeLi && !this.isSearching) {
			return;
		};
		if (activeLi) {
			activeLi.classList.remove('active');
		}
		//给当前点击的 li 添加 active 类名
		li.classList.add('active');
		const id = li.getAttribute('data-id');
		target.tagName === 'UL' ? config.currentActivePackId = id : config.currentActivePackCategoryId = id;
		target.tagName === 'UL' ? selector.renderPackCategories() : selector.renderCharacterList();
		this.isSearching = false;
	}
	onMouseupSelector(target, event) {
		clearInterval(this.#timeId1);
		clearTimeout(this.#timeId2);
	}
	onClickCharSelectedBtn(target, event) {
		if (event) utils.playAudio('click2');
		if (target.classList.toggle('active')) {
			config.isCharSelectedActive = true;
			this.selector.renderCharacterList();
		} else {
			config.isCharSelectedActive = false;
			this.selector.renderCharacterList();
		}
	}
	onClickCharConfirmBtn(target, event) {
		if (event) utils.playAudio('click2');
		const num1 = config.bannedList.length;
		const filterList = this.model.getAllCharactersId().filter(id => window['AI禁将_savedFilter'](id));// 系统禁将数组
		config.bannedList.addArray(this.selectedBannedList);
		config.bannedList.removeArray(this.reducedBannedList);
		config.bannedList.removeArray(filterList);
		this.selectedBannedList.splice(0, this.selectedBannedList.length);
		this.reducedBannedList.splice(0, this.reducedBannedList.length);
		config.save();
		const num2 = config.bannedList.length;
		const cordova = utils.getDeviceType() === "cordova";
		const enter = cordova ? '\n\n' : '<br><br>';
		const str = `本次禁用武将 ${num2 - num1} 个${enter}自选禁用武将 ${num2} 个${enter}总计禁用武将 ${num2 + filterList.length} 个`;
		cordova ? utils.alert(str) : utils.asyncAlert(str);
		this.selector.buttonsArr.forEach(btn => btn.autoblock());
	}
	onMousedownCharacterList(target, event) {
		//不是左键点击直接返回
		if (event.button !== 0) return;
		const button = event.target.closest('.button.item');
		if (!button) {
			const content = target.querySelector('.content-container>.content');
			if (!content || event.target !== content.querySelector('.buttons')) return;
			this.selector.canvas.hanldleMouseDown(content, event);
		} else {
			target.addEventListener("mouseup", e => {
				if (e.target.closest('.button.item') === button && !button.isUnselectable) {
					if (event) {
						utils.playAudio(button.getSelected() ? 'click6' : 'click4');
					}
					this.hanldleCharBtnToggleSelect(button);
				}
			}, { once: true });
		}
	}
	hanldleCharBtnSelect(btn) {
		btn.select();
		this.selectedBannedList.add(btn.name);
		this.reducedBannedList.remove(btn.name);
		this.autoToggleSelectAllBtn();
	}
	hanldleCharBtnUnselect(btn) {
		btn.unselect();
		this.selectedBannedList.remove(btn.name);
		this.reducedBannedList.add(btn.name);
		this.autoToggleSelectAllBtn();
	}
	hanldleCharBtnToggleSelect(btn) {
		if (btn.getSelected()) {
			this.hanldleCharBtnUnselect(btn);
		} else if (!btn.isUnselectable) {
			this.hanldleCharBtnSelect(btn);
		}
	}
	/**
	 * @param { object } target 目标对象
	 * @param { string } key 目标对象的键
	 */
	addBannedEvent(target, key) {
		this.recordEvent.push([target, key, target[key]]);
		target[key] = typeof target[key] === 'function' ? () => { } : null;
	}
	removeAllBannedEvent() {
		this.recordEvent.forEach((item) => {
			item[0][item[1]] = item[2];
		});
		this.recordEvent = [];
	}
}

