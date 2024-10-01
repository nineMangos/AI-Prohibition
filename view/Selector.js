import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import SelectorController from '../controller/SelectorController.js';
import CanvasBoard from './CanvasBoard.js';
import Dialog from './Dialog.js';
import CharacterBtn from './CharacterBtn.js';
import config from "../asset/config.js";

/**
 * @type {Selector}
 * @extends {HTMLDivElement}
 */
class Selector extends HTMLDivElement {
	/** * @type { boolean } 是否已经初始化 */
	#isInit
	/** * @type { HTMLDivElement[] } 当前可选的所有武将按钮 */
	buttonsArr = [];
	/** * @type { HTMLDivElement[] } 当前的所有武将按钮*/
	allButtonsArr = [];
	/** * @type { object } */
	node
	/** * @type { HTMLCanvasElement } */
	canvas
	/** * @type { SelectorController } */
	controller
	constructor() {
		super();
		this.classList.add('Selector');
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
					<button class="selector-header-help" title="帮助"></button>
					<button class="selectAll">全选</button>
					<button class="inverse">反选</button>
					<button class="plan">方案</button>
					<button class="setUp" title="设置"></button>
				</div>
				<form class="selector-header-search">
					<div class="search-content">
						<input class="input" type="text" autocomplete="off"
							accesskey="f" maxlength="100" x-webkit-speech="" x-webkit-grammar="builtin:translate" value=""
							placeholder="输入武将名称/拼音以搜索" title="输入武将名称/拼音以搜索">
						<div class="search-clean"></div>
					</div>
					<button type="button"></button>
				</form>
				<div class="selector-header-loginfo">
					共搜索到<span style="color: #ffe6b7;">0</span>个武将
				</div>
				<div class="selector-header-close"></div>
			</div>
			<div class="selector-list">
				<button class="selector-list-left" title="向左滚动"></button>
				<button class="selector-list-right" title="向右滚动"></button>
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
	 	 `;
		this.node = {
			selectContent: this.querySelector('.selector-header>.select>span>.select-content'),
			help: this.querySelector('.selector-header-help'),
			selectAll: this.querySelector('.selector-header-pack>.selectAll'),
			inverse: this.querySelector('.selector-header-pack>.inverse'),
			plan: this.querySelector('.selector-header-pack>.plan'),
			setUp: this.querySelector('.selector-header-pack>.setUp'),
			searchInput: this.querySelector('.selector-header-search .input'),
			searchClean: this.querySelector('.selector-header-search .search-clean'),
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
	}
	init() {
		if (this.#isInit) return;
		this.#isInit = true;
		this.#addListener();
		this.renderPackList();
		const cvs = new CanvasBoard(this.node.characterList, this);
		this.canvas = cvs;

		document.documentElement.style.setProperty('--sl-layout-zoom', config.computedZoom / game.documentZoom);
		this.node.selectContent.parentNode.querySelector('.method>span').textContent = config.currentActiveMode;
		if (config.isCharSelectedActive) {
			this.node.charSelectedBtn.classList.add('active');
		}
	}
	reload() {
		this.remove();
		const selector = new Selector();
		this.controller.selector = selector;
		selector.controller = this.controller;
		selector.open();
	}
	/**
	 * @param { function } onClose 
	 */
	open() {
		const forbidai_bg = game.getExtensionConfig('AI禁将', 'forbidai_bg');
		if (forbidai_bg) {
			this.style.backgroundImage = forbidai_bg === 'xitong' ? ui.background.style.backgroundImage : `url("${lib.assetURL}extension/AI禁将/image/${forbidai_bg}_bg.jpg")`;
		}
		ui.window.appendChild(this);
		this.init();
		this.setAttribute("data-visible", "true");
		this.node.charPackList.scrollLeft = config.scrollLeft;
	}
	close() {
		this.setAttribute("data-visible", "false");
	}
	/**
	 * 渲染武将包列表/渲染武将包分类列表
	 * @param { 'packList' | 'packCategories' } name 
	 */
	renderList(name) {
		const list = this.controller.getList(name);
		let parentNode;
		let getActiveId;
		let setActiveId;
		let getInnerHTML;
		let next = () => { };

		if (name === 'packList') {
			parentNode = this.node.charPackList;
			getActiveId = () => config.currentActivePackId;
			setActiveId = (id) => config.currentActivePackId = id;
			getInnerHTML = (id) => {
				return id === 'all' ? '全扩' : lib.translate[id + '_character_config']
			}
			next = this.renderPackCategories.bind(this);
		} else if (name === 'packCategories') {
			parentNode = this.node.charPackCategories;
			getActiveId = () => config.currentActivePackCategoryId;
			setActiveId = (id) => config.currentActivePackCategoryId = id;
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
		const characters = charactersArr || this.controller.getList('characters');
		//创建武将按钮
		this.node.loginfo.textContent = `${characters.length}`;
		const buttonsArr = [];
		const allButtonsArr = characters.map(ele => {
			const btn = new CharacterBtn(ele, this.controller.selectedBannedList);
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
		if (config.small) buttons.classList.add('smallzoom');
		this.renderElements(allButtonsArr, buttons);
		this.controller.autoToggleSelectAllBtn();
		if (!config.defaultImage) this.lazyLoad(allButtonsArr);
	}
	/**
	 * 懒加载武将图片
	 * @param {Array} buttons - 需要懒加载的 DOM 元素数组
	 */
	lazyLoad(buttons) {
		const io = new IntersectionObserver((entries) => {
			entries.forEach(item => {
				if (item.isIntersecting) {
					const btn = item.target;
					// if (item.intersectionRatio > 0 && item.intersectionRatio <= 1) {
					if (btn.getAttribute('data-src')) {
						btn.style.backgroundImage = btn.getAttribute('data-src');
						io.unobserve(btn);
					}
				}
			})
		}, {
			threshold: 0.01 // 触发条件更为宽松
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

		const renderFrame = function () {
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
			plan,
			setUp,
			searchInput,
			searchClean,
			searchBtn,
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
		const getEvtName = function (name) {
			const map = new Map([
				["mouseup", "touchend"],
				["click", "touchend"],
				["mousedown", "touchstart"],
			]);
			return lib.config.touchscreen ? map.get(name) : name;
		}
		const handleEventListener = function (target, eventName, callbackName) {
			target.addEventListener(eventName, function (e) {
				selector.controller[callbackName](this, e);
			});
		}
		const click = getEvtName('click');
		const mousedown = getEvtName('mousedown');

		handleEventListener(selector, 'mouseup', 'onMouseupSelector');
		handleEventListener(selectContent, click, 'onClickSelectContentBtn');
		handleEventListener(help, click, 'onClickHelpBtn');
		handleEventListener(selectAll, click, 'onClickSelectAllBtn');
		handleEventListener(inverse, click, 'onClickInverseBtn');
		handleEventListener(plan, click, 'onClickPlanBtn');
		handleEventListener(setUp, click, 'onClickSetUpBtn');
		handleEventListener(searchInput, 'keydown', 'onKeydownSearchInput');
		handleEventListener(searchInput, 'input', 'onInputSearchInput');
		handleEventListener(searchClean, click, 'onClickSearchClean');
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

customElements.define('character-selector', Selector, { extends: 'div' });
export default Selector;
