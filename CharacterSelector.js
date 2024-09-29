import { lib, game, ui, get, ai, _status } from "../../noname.js";
import CharacterModel from './CharacterModel.js';
import InteractionModel from './InteractionModel.js';
import CanvasBoard from './CanvasBoard.js';
import Dialog from './Dialog.js';
import CharacterBtn from './CharacterBtn.js';

/**
 * @type {CharacterSelector}
 * @extends {HTMLDivElement}
 */
class CharacterSelector extends HTMLDivElement {
	/** * @type { '默认'|'评级'|'势力'|'性别' } 当前武将包的分类方式 */
	get currentActiveMode() { return this.config.record[0]; }
	set currentActiveMode(value) { this.config.record[0] = value; }
	/** * @type { string } 当前武将包（'all' 或 武将包id） */
	get currentActivePackId() { return this.config.record[1]; }
	set currentActivePackId(value) { this.config.record[1] = value; }
	/** * @type { string } 当前武将包的分类（‘standard_2008’、‘standard_2013’|'epic'、'legend'|'wei'、'shu'） */
	get currentActivePackCategoryId() { return this.config.record[2]; }
	set currentActivePackCategoryId(value) { this.config.record[2] = value; }
	/** * @type { number } 武将包栏的滚动条位置 */
	get scrollLeft() { return this.config.record[3]; }
	set scrollLeft(value) { this.config.record[3] = value; }
	/** * @type { boolean } 是否在显示“禁将列表” */
	get isCharSelectedActive() { return this.config.record[4]; }
	set isCharSelectedActive(value) { this.config.record[4] = value; }
	/** * @type { boolean } 是否已经初始化 */
	#isInit
	/** * @type { boolean } 是否处于搜索框的搜索状态下 */
	isSearching
	/** * @type { object } 配置 */
	config = {
		record: [],
		bannedList: [],
		small: false,
		defaultImage: 0,
		addMenu: false,
		remember: true,
		hide: false,
	}
	/** * @type { HTMLDivElement[] } 不包含不可选的武将按钮 */
	buttonsArr = [];
	/** * @type { HTMLDivElement[] } 所有武将按钮*/
	allButtonsArr = [];
	/** * @type { object } */
	node
	/** * @type { HTMLCanvasElement } */
	canvas
	/** * @type { CharacterModel } */
	characterModel
	/** * @type { InteractionModel } */
	interactionModel
	constructor() {
		super();
		this.classList.add('Selector');
		this.characterModel = new CharacterModel(this);
		this.interactionModel = new InteractionModel(this);
		this.innerHTML = `
			<div class="selector-header">
				<div class="select">
					<span class="classification">分类方式：</span>
					<span class="choose">
						<span class="method">
							<span style="color: #ffe6b7;">默认</span>
							<img src="${lib.assetURL}extension/AI禁将/image/T3.png">
						</span>
						<div class="select-content">
							<div>
								<span>默认</span>
								<span>评级</span>
								<span>势力</span>
								<span>性别</span>
							</div>
						</div>
					</span>
				</div>
				<div class="selector-header-pack">
					<button class="selector-header-help"></button>
					<button class="selectAll">全选</button>
					<button class="inverse">反选</button>
					<button class="setUp"></button>
				</div>
				<div class="selector-header-search">
					<input type="text" class="input" placeholder="输入武将名称/拼音以搜索">
					<button></button>
				</div>
				<div class="selector-header-loginfo">
					共搜索到<span style="color: #ffe6b7;">0</span>个武将
				</div>
				<div class="selector-header-close"></div>
			</div>
			<div class="selector-list">
				<button class="selector-list-left"></button>
				<button class="selector-list-right"></button>
				<ul></ul>
			</div>
			<div class="selector-content">
				<div class="selector-content-characterSort">
					<ol></ol>
					<div class="result">
		  				<button class="charSelectedBtn">禁将列表</button>
		  				<button class="charConfirmBtn">确认禁将</button>			
					</div>
				</div>
				<div class="characterList"></div>
			</div>
			<div id="popupContainer"></div>
	 	 `;

		this.node = {
			selectContent: this.querySelector('.selector-header>.select>span>.select-content'),
			help: this.querySelector('.selector-header-help'),
			selectAll: this.querySelector('.selector-header-pack>.selectAll'),
			inverse: this.querySelector('.selector-header-pack>.inverse'),
			setUp: this.querySelector('.selector-header-pack>.setUp'),
			searchInput: this.querySelector('.selector-header-search>.input'),
			searchBtn: this.querySelector('.selector-header-search>button'),
			loginfo: this.querySelector('.selector-header-loginfo>span'),
			close: this.querySelector('.selector-header-close'),
			left: this.querySelector('.selector-list-left'),
			right: this.querySelector('.selector-list-right'),
			charPackList: this.querySelector('.selector-list ul'),
			charPackCategories: this.querySelector('.selector-content-characterSort ol'),
			charSelectedBtn: this.querySelector('.selector-content-characterSort .charSelectedBtn'),
			charConfirmBtn: this.querySelector('.selector-content-characterSort .charConfirmBtn'),
			characterList: this.querySelector('.selector-content>.characterList'),
		}

		this.config = game.getExtensionConfig('AI禁将', 'forbidai');
		if (!this.config.remember || this.config.record.length < 5) this.config.record = ['默认', 'all', 'all', 0, false];
	}
	init() {
		if (this.#isInit) return;
		this.#isInit = true;
		this.#addListener();
		this.renderPackList();
		const cvs = new CanvasBoard(this.node.characterList, this);
		this.canvas = cvs;

		this.node.selectContent.parentNode.querySelector('.method>span').textContent = this.currentActiveMode;
		if (this.isCharSelectedActive) {
			this.node.charSelectedBtn.classList.add('active');
		}
	}
	reinit() {
		this.onClose = () => { };
		this.close();
		this.remove();
		const selector = new CharacterSelector();
		selector.open();
	}
	/**
	 * @param { function } onClose 
	 */
	open(onClose) {
		this.windowOnkeydown = window.onkeydown;
		window.onkeydown = this.interactionModel.onKeydownWindow.bind(this.interactionModel);
		const forbidai_bg = game.getExtensionConfig('AI禁将', 'forbidai_bg');
		if (forbidai_bg) {
			this.style.backgroundImage = forbidai_bg === 'xitong' ? ui.background.style.backgroundImage : `url("${lib.assetURL}extension/AI禁将/image/${forbidai_bg}_bg.jpg")`;
		}
		ui.window.appendChild(this);
		this.init();
		this.setAttribute("data-visible", "true");
		this.onClose = onClose;
		this.node.charPackList.scrollLeft = this.scrollLeft;
	}
	close() {
		window.onkeydown = this.windowOnkeydown;
		if (ui.dialog) ui.dialog.show();
		this.setAttribute("data-visible", "false");
		if (this.onClose) {
			this.onClose();
		} else {
			ui.arena.classList.add('menupaused');
			ui.menuContainer.show();
		}
	}
	/**
	 * 渲染武将包列表/渲染武将包分类列表
	 * @param {string} name 'packList' | 'PackCategories'
	 */
	renderList(name) {
		let list;
		let parentNode;
		let getActiveId;
		let setActiveId;
		let getInnerHTML;
		let next = () => { };

		if (name === 'packList') {
			list = this.characterModel.getPackListId();
			parentNode = this.node.charPackList;
			getActiveId = () => this.currentActivePackId;
			setActiveId = (id) => this.currentActivePackId = id;
			getInnerHTML = (id) => {
				return id === 'all' ? '全扩' : lib.translate[id + '_character_config']
			}
			next = this.renderPackCategories.bind(this);
		} else if (name === 'packCategories') {
			list = this.characterModel.getPackCategoriesId();
			parentNode = this.node.charPackCategories;
			getActiveId = () => this.currentActivePackCategoryId;
			setActiveId = (id) => this.currentActivePackCategoryId = id;
			getInnerHTML = (id) => {
				return id === 'all' ? '所有武将' : lib.translate[id];
			}
			next = this.renderCharacterList.bind(this);
		} else {
			throw new Error('name must be "packList" or "packCategories",name:', name);
		}

		//清空 parentNode 的所有子元素
		parentNode.innerHTML = '';
		//渲染每一个 li
		list.forEach(id => {
			//创建li元素
			const li = document.createElement('li');
			//给li添加自定义属性
			li.setAttribute('data-id', id);
			//如果当前li名是当前记录的高亮名，给li添加 active 类名
			if (id === getActiveId()) li.classList.add('active');
			//给li添加内容
			li.innerHTML = getInnerHTML(id);
			//将li添加到ul中
			parentNode.appendChild(li);
		});

		//如果没有高亮li，则给第一个li添加 active 类名
		const activeLi = parentNode.querySelector('li.active');
		const firstChild = parentNode.firstChild;
		if (!activeLi && firstChild) {
			firstChild.classList.add('active');
			setActiveId(firstChild.getAttribute('data-id'));
		}

		//调用next函数
		next();
	}
	// 渲染武将包列表
	renderPackList() {
		this.renderList('packList');
	}
	//渲染武将包分类列表
	renderPackCategories() {
		this.renderList('packCategories');
	}
	/**
	 * 渲染每一个武将
	 * @param { string[]? } charactersArr 
	 */
	renderCharacterList(charactersArr) {
		//筛选排序id数组
		let characters = charactersArr || this.characterModel.getCharactersId();
		characters = characters.filter(id => {
			if (this.isCharSelectedActive && !lib.filter.characterDisabled(id) && !this.interactionModel.selectedBannedList.includes(id)) return false;
			if (this.config.hide && window.forbidai_savedFilter(id)) return false;
			return true;
		});
		characters.sort((a, b) => {
			return !lib.filter.characterDisabled(b) - !lib.filter.characterDisabled(a) +
				!window.forbidai_savedFilter(b) - !window.forbidai_savedFilter(a)
		})
		//创建武将按钮
		this.node.loginfo.textContent = `${characters.length}`;
		const buttonsArr = [];
		const allButtonsArr = characters.map(ele => {
			const btn = new CharacterBtn(ele, this.interactionModel.selectedBannedList, this.interactionModel.reducedBannedList, this.config);
			if (!btn.isUnselectable) buttonsArr.push(btn);
			return btn;
		});
		this.buttonsArr = buttonsArr;
		this.allButtonsArr = allButtonsArr;
		//逐帧渲染和懒加载武将按钮
		const characterList = this.node.characterList;
		if (this.node.dialog) this.node.dialog.remove();
		const dialog = new Dialog(characterList);
		this.node.dialog = dialog;
		/* const dialog = this.node.dialog || new Dialog(characterList);
		this.node.dialog = dialog; */
		dialog.content.innerHTML = '';
		const buttons = ui.create.div('.buttons', dialog.content);
		if (this.config.small) buttons.classList.add('smallzoom');
		this.renderElements(allButtonsArr, buttons);
		this.interactionModel.autoToggleSelectAllBtn();
		if (!this.config.defaultImage) this.lazyLoad(allButtonsArr);
	}
	/**
	 * 懒加载武将图片
	 * @param {Array} buttons - 需要懒加载的 DOM 元素数组
	 */
	lazyLoad(buttons) {
		const io = new IntersectionObserver((entries) => {
			entries.forEach(item => {
				if (item.isIntersecting) {
					const btn = item.target
					if (item.intersectionRatio > 0 && item.intersectionRatio <= 1) {
						btn.style.backgroundImage = btn.src;
						//btn.setAttribute('src', btn.getAttribute('data-src'))
						io.unobserve(btn);
					}
				}
			})
		})
		buttons.forEach((it) => {
			io.observe(it)
		})
	}
	/**
	 * 逐帧渲染大量 DOM 元素
	 * @param {Array} elements - 需要渲染的 DOM 元素数组
	 * @param {HTMLElement} container - 容器 DOM 节点
	 */
	renderElements(elements, container) {
		let frame = 0;// 当前帧数

		function renderFrame() {
			const num = 10; // 每帧渲染的元素数量
			const start = frame * num; // 当前帧的起始索引
			const end = Math.min(start + num, elements.length); // 当前帧的结束索引
			// 循环添加元素到容器中
			for (let i = start; i < end; i++) {
				container.appendChild(elements[i]);
			}

			// 如果还有剩余的元素需要渲染，则继续渲染下一帧
			if (end < elements.length) {
				frame++; // 增加帧数
				requestAnimationFrame(renderFrame); // 请求下一帧渲染
			}
		}

		renderFrame();// 开始渲染第一帧
	}
	#addListener() {
		const {
			selectContent,
			help,
			selectAll,
			inverse,
			setUp,
			searchInput,
			searchBtn,
			loginfo,
			close,
			left,
			right,
			charPackList,
			charPackCategories,
			charSelectedBtn,
			charConfirmBtn,
			characterList
		} = this.node;
		const selector = this;
		function getEvtName(name) {
			const map = new Map([
				["mouseup", "touchend"],
				["click", "touchend"],
				["mousedown", "touchstart"],
			]);
			return lib.config.touchscreen ? map.get(name) : name;
		}
		function handleEventListener(target, eventName, callbackName) {
			target.addEventListener(eventName, function (e) {
				selector.interactionModel[callbackName](this, e);
			});
		}
		const click = getEvtName('click');
		const mousedown = getEvtName('mousedown');

		handleEventListener(selector, 'mouseup', 'onMouseupSelector');
		handleEventListener(selectContent, click, 'onClickSelectContentBtn');
		handleEventListener(help, click, 'onClickHelpBtn');
		handleEventListener(selectAll, click, 'onClickSelectAllBtn');
		handleEventListener(inverse, click, 'onClickInverseBtn');
		handleEventListener(setUp, click, 'onClickSetUpBtn');
		handleEventListener(searchInput, 'keyup', 'onKeyupSearchInput');
		handleEventListener(searchBtn, click, 'onClickSearchBtn');
		handleEventListener(close, click, 'onClickCloseBtn');
		handleEventListener(left, mousedown, 'onMousedownDirectionBtn');
		handleEventListener(right, mousedown, 'onMousedownDirectionBtn');
		handleEventListener(charPackList, 'wheel', 'onWheelCharPackList');
		handleEventListener(charPackList, click, 'onClickList');
		handleEventListener(charPackCategories, click, 'onClickList');
		handleEventListener(charSelectedBtn, click, 'onClickCharSelectedBtn');
		handleEventListener(charConfirmBtn, click, 'onClickCharConfirmBtn');
		handleEventListener(characterList, 'mousedown', 'onMousedownCharacterList');
	}
}

customElements.define('character-selector', CharacterSelector, { extends: 'div' });
export default CharacterSelector;
