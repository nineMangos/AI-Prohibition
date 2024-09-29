
import { lib, game, ui, get, ai, _status } from "../../../../noname.js";
import utils from "../../asset/utils.js";

/** @extends HTMLElement */
export default class Popup extends HTMLElement {
	baseStyle = `
		* {
			margin: 0;
			padding: 0;
			font-weight: 400;
		}
		.container {
			position: absolute;
			width: 50%;
			height: 80%;
			background: rgba(0, 0, 0, .65);
			box-sizing: border-box;
			border: 2px solid #ccc;
			border-radius: 9px;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			padding: 5px;
		}
		.container>.header{
			display: flex;
			width: 100%;
			height: 30px;
		}
		/* 弹窗标题样式 */
		.container>.header>h2 {
			flex: 1;
			height: 30px;
    		line-height: 30px;
			font-size: 27px;
		}
		/* 设置弹窗的按钮样式 */
		.container>.header>span {
			width: 30px;
			height: 30px;
			background: url(${lib.assetURL}extension/AI禁将/image/close.png) no-repeat center center/contain;
			cursor: pointer;
		}
		.container>.content {
			width: 100%;
			height:  calc(100% - 30px);
			padding: 5px;
			box-sizing: border-box;
			font-size: 15px;
			text-align: start;
			overflow-y: scroll;
			overflow-x: hidden;
		}
		.container>.content::-webkit-scrollbar {
			display: none;
		}
	`;
	extraStyle = '';
	/** @type { object } */
	node
	/**
	 * 创建一个自定义弹窗
	 * @param { Node } parentNode 父元素
	 * @param { style } extraStyle 额外样式
	 */
	constructor(parentNode, extraStyle) {
		super();
		this.extraStyle = extraStyle || this.extraStyle;
		parentNode.appendChild(this);
	}
	connectedCallback() {
		this.style.cssText = `
				position: absolute;
				width: 100%;
				height: 100%;
				backdrop-filter: blur(2px);
				top: 0;
				left: 0;
				z-index: 20;
			`;
		const shadow = this.attachShadow({ mode: 'open' });
		const template = document.createElement('template');
		template.innerHTML = `
			<style>		
				${this.baseStyle + this.extraStyle}}
			</style>
			<div class="container">
				<div class="header">
					<h2></h2>
					<span></span>
				</div>
				<div class="content">
				</div>
			</div>
		`;
		shadow.appendChild(template.content);
		this.node = {
			container: shadow.querySelector('.container'),
			header: shadow.querySelector('.header'),
			caption: shadow.querySelector('.header>h2'),
			close: shadow.querySelector('.header>span'),
			content: shadow.querySelector('.content')
		}
		this.node.close.addEventListener(lib.config.touchscreen ? 'touchend' : 'click', this.close.bind(this));
	}
	close(e) {
		if (e) utils.playAudio('click5');
		this.remove();
	}
	/**@param { Node | string} caption  */
	setCaption(caption) {
		if (caption instanceof Node) {
			this.node.caption.appendChild(caption);
		} else {
			this.node.caption.innerHTML += caption;
		}
	}
	/**@param { Node | string} content  */
	setContent(content) {
		if (content instanceof Node) {
			this.node.content.appendChild(content);
		} else {
			this.node.content.innerHTML += content;
		}
	}
}

customElements.define('selector-popup', Popup);
