import { lib, game, ui, get, ai, _status } from "../../../noname.js";
import Selector from "../view/Selector.js";

class Rectangle {
	/** @type { number } 矩形选框起点X坐标 */
	startX
	/** @type { number } 矩形选框起点Y坐标 */
	startY
	/** @type { number } 记录矩形选框的初始起点Y坐标，用于自动滚动元素 */
	initialY
	/** @type { CanvasBoard } canvas 对象 */
	cvs
	/** @type { CanvasRenderingContext2D } 绘制上下文 */
	ctx
	/** @type { number } 矩形选框起点X坐标 */
	endX
	/** @type { number } 矩形选框起点Y坐标 */
	endY
	/** @type { string } 矩形选框的填充颜色 */
	fillColor = "rgba(0,119,255,0.2)";
	/** @type { string } 矩形选框的描边颜色 */
	strokeColor = "rgb(0,119,255)";

	/**
	 * 构建矩形选框对象
	 * @param { CanvasBoard } cvs canvas 对象
	 * @param { number } startX 矩形起点X坐标
	 * @param { number } startY 矩形终点Y坐标
	 */
	constructor(cvs, startX, startY) {
		this.startX = startX / game.documentZoom;
		this.startY = startY / game.documentZoom;
		this.initialY = this.startY;
		this.cvs = cvs;
		this.ctx = cvs.ctx;
		this.endX = this.startX;
		this.endY = this.startY;
	}
	/** @type { number } */
	get minX() {
		return Math.min(this.startX, this.endX);
	}
	/** @type { number } */
	get maxX() {
		return Math.max(this.startX, this.endX);
	}
	/** @type { number } */
	get minY() {
		return Math.min(this.startY, this.endY);
	}
	/** @type { number } */
	get maxY() {
		return Math.max(this.startY, this.endY);
	}
	/**
	 * 绘制选框
	 */
	draw() {
		const ctx = this.ctx;
		ctx.beginPath();
		ctx.moveTo(this.minX * devicePixelRatio, this.minY * devicePixelRatio);
		ctx.lineTo(this.maxX * devicePixelRatio, this.minY * devicePixelRatio);
		ctx.lineTo(this.maxX * devicePixelRatio, this.maxY * devicePixelRatio);
		ctx.lineTo(this.minX * devicePixelRatio, this.maxY * devicePixelRatio);
		ctx.lineTo(this.minX * devicePixelRatio, this.minY * devicePixelRatio);
		ctx.fillStyle = this.fillColor;
		ctx.fill();
		ctx.strokeStyle = this.strokeColor;
		ctx.lineCap = 'square';
		ctx.lineWidth = 1 * devicePixelRatio;
		ctx.stroke();
	}
}

/** @extends HTMLCanvasElement */
export default class CanvasBoard {
	/** @type { Selector } 选择器 */
	seletor
	/** @type { CanvasRenderingContext2D } 绘制上下文 */
	ctx
	/** @type { object } */
	status = {
		shape: null, // 当前绘制的图形
		element: null, // 当前操作的元素,
		scrollTop: null, // 记录的初始滚动条位置,
		virtualRect: null, // 虚拟选框
	}

	/**
	 * 创建 canvas 元素，用于绘制选框
	 * @param { HTMLElement } parentNode 父元素
	 * @param { HTMLDivElement } seletor 选择器
	 */
	constructor(parentNode, seletor) {
		const cvs = document.createElement('canvas');
		Object.setPrototypeOf(CanvasBoard.prototype, Object.getPrototypeOf(cvs));
		Object.setPrototypeOf(cvs, this);
		if (getComputedStyle(parentNode).getPropertyValue('position') === 'static') {
			throw new Error('canvas父元素的position属性值不能为static');
		}
		parentNode.appendChild(cvs);
		cvs.style.cssText = 'background-color: rgba(170, 170, 170, 0); pointer-events: none; z-index: 100; position: absolute; top:0 ; left:0';
		cvs.seletor = seletor;
		cvs.ctx = cvs.getContext('2d');
		cvs.width = 0;
		cvs.height = 0;
		return cvs;
	}
	/**
	 * 处理 canvas 父元素的鼠标按下事件
	 * @param { HTMLElement} element 被操作的 dom
	 * @param { MouseEvent  } oriEvt mousedown 事件对象
	 */
	hanldleMouseDown(element, oriEvt) {
		// 将 canvas 自身的宽高调整至与父元素一致
		const width = this.parentNode.offsetWidth;
		const height = this.parentNode.offsetHeight;
		this.width = width * devicePixelRatio;
		this.height = height * devicePixelRatio;
		this.style.width = width + 'px';
		this.style.height = height + 'px';

		const { x: relativeX, y: relativeY } = this.getRelativePositionInElement(this.parentNode, oriEvt.clientX, oriEvt.clientY);
		const { offsetX, offsetY } = oriEvt;
		const shape = new Rectangle(this, relativeX, relativeY);
		this.status.shape = shape;
		this.status.element = element;
		this.status.scrollTop = element.scrollTop;
		this.status.virtualRect = {
			startX: offsetX,
			startY: offsetY
		}

		const bounding = this.getBoundingClientRect();
		this.draw();
		// 定义一个处理鼠标移动的函数
		const handleMouseMove = e => {
			shape.endX = (e.clientX - bounding.left) / game.documentZoom;
			shape.endX = Math.min(Math.max(shape.endX, 0), this.width / devicePixelRatio); //限制矩形选框的左右描边在 canvas 内
			shape.endY = (e.clientY - bounding.top) / game.documentZoom;
			this.scrollOnDrag(element, e.clientY);
		}
		// 定义一个处理鼠标抬起的函数
		const handleMouseUp = e => {
			const buttons = this.seletor.buttonsArr;
			const virRect = this.getVirtualRect();
			let zoom = +window.getComputedStyle(this.seletor.querySelector('.characterList .content>.buttons')).zoom * +window.getComputedStyle(document.documentElement).getPropertyValue('--sl-layout-zoom');
			if (typeof zoom !== 'number' || !zoom) zoom = 1
			if (buttons) buttons.forEach(btn => {
				if (this.doRectanglesIntersect(this.getRectangle(btn, zoom), virRect)) {
					if (e.shiftKey) return;
					this.seletor.controller[(e.ctrlKey || e.metaKey) ? 'hanldleCharBtnUnselect' : 'hanldleCharBtnSelect'](btn);
				}
			})
			this.status.shape = null;
			this.ctx.clearRect(0, 0, this.width, this.height);
			delete this.status.element;
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		}
		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	/**
	 * 获取鼠标在 element 元素内的相对位置
	 * @param { HTMLElement } element 
	 * @param { number } clientX e.clientX
	 * @param { number } clientY e.clientY
	 * @returns { object }
	 */
	getRelativePositionInElement(element, clientX, clientY) {
		const rect = element.getBoundingClientRect();
		const { left, top } = rect;
		const { scrollLeft, scrollTop, scrollWidth, scrollHeight } = element;
		let x = clientX - left + scrollLeft;
		let y = clientY - top + scrollTop;
		if (x < 0) {
			x = 0;
		}
		if (y < 0) {
			y = 0;
		}
		return { x: Math.round(x), y: Math.round(y) };
	}
	/**
	 * 返回一个 node 对应的矩形对象
	 * @param { Node } node 武将按钮
	 * @param { number}  zoom 缩放
	 * @returns { object }
	 */
	getRectangle(node, zoom) {
		return {
			startX: node.offsetLeft * zoom,
			startY: node.offsetTop * zoom,
			endX: (node.offsetLeft + node.offsetWidth) * zoom,
			endY: (node.offsetTop + node.offsetHeight) * zoom,
		}
	}
	/**
	 * 返回一个虚拟选框矩形对象
	 * @returns { object }
	 */
	getVirtualRect() {
		const startX = this.status.virtualRect.startX,
			startY = this.status.virtualRect.startY,
			endX = this.status.shape.endX,
			endY = this.status.shape.endY + this.status.element.scrollTop

		return {
			startX: Math.min(startX, endX),
			startY: Math.min(startY, endY),
			endX: Math.max(startX, endX),
			endY: Math.max(startY, endY),
		}
	}
	// 判断两个矩形是否有重叠
	doRectanglesIntersect(rect1, rect2) {
		// 获取矩形的边界值
		const left1 = rect1.startX;
		const right1 = rect1.endX;
		const top1 = rect1.startY;
		const bottom1 = rect1.endY;

		const left2 = rect2.startX;
		const right2 = rect2.endX;
		const top2 = rect2.startY;
		const bottom2 = rect2.endY;

		// 检查是否有重叠
		const xOverlap = Math.max(0, Math.min(right1, right2) - Math.max(left1, left2));
		const yOverlap = Math.max(0, Math.min(bottom1, bottom2) - Math.max(top1, top2));

		return (xOverlap > 0) && (yOverlap > 0);
	}
	//当鼠标超出元素纵向边界时自动滚动元素。
	scrollOnDrag(element, mouseY) {
		const { y, height } = element.getBoundingClientRect();
		let scrollY;
		if (mouseY < y) {
			scrollY = mouseY - y;
		} else if (mouseY > (y + height)) {
			scrollY = mouseY - (y + height);
		}

		if (scrollY) {
			element.scrollBy({
				top: scrollY,
				behavior: 'auto'
			});
		}
	}
	/**
	 * 实时绘制选框
	 */
	draw() {
		requestAnimationFrame(this.draw.bind(this));
		this.ctx.clearRect(0, 0, this.width, this.height);
		if (this.status.shape) {
			if (this.status.shape.initialY && this.status.element && this.status.element.scrollTop) {
				this.status.shape.startY = this.status.shape.initialY - this.status.element.scrollTop + this.status.scrollTop;
			}
			this.status.shape.draw();
		}
	}
}
